import { NextResponse } from "next/server";
import { query, hasAnyUser } from "@/lib/db";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function GET() {
  try {
    const jaExiste = await hasAnyUser();
    return NextResponse.json({ jaConfigurado: jaExiste });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const jaExiste = await hasAnyUser();
    if (jaExiste) {
      return NextResponse.json(
        { error: "Já existe um administrador configurado." },
        { status: 400 }
      );
    }

    const { nome, email, senha } = await request.json();

    if (!nome || !email || !senha || senha.length < 6) {
      return NextResponse.json(
        { error: "Preencha nome, e-mail e uma senha com pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const senhaHash = await hashPassword(senha);

    const result = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, papel)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, nome, email, papel`,
      [nome, email.toLowerCase(), senhaHash]
    );

    const user = result.rows[0];
    const token = await createSessionToken(user);
    await setSessionCookie(token);

    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
