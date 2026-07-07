import { NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (user.papel !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem ver usuários." }, { status: 403 });
  }

  await ensureSchema();
  const result = await query(
    "SELECT id, nome, email, papel, telefone, criado_em FROM usuarios ORDER BY criado_em ASC"
  );
  return NextResponse.json({ usuarios: result.rows });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (user.papel !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem criar usuários." }, { status: 403 });
  }

  const { nome, email, senha, telefone } = await request.json();

  if (!nome || !email || !senha || senha.length < 6) {
    return NextResponse.json(
      { error: "Preencha nome, e-mail e uma senha com pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  try {
    const senhaHash = await hashPassword(senha);
    const result = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, papel, telefone)
       VALUES ($1, $2, $3, 'membro', $4)
       RETURNING id, nome, email, papel, telefone, criado_em`,
      [nome, email.toLowerCase(), senhaHash, telefone || null]
    );
    return NextResponse.json({ usuario: result.rows[0] });
  } catch (err) {
    if (String(err.message).includes("duplicate key")) {
      return NextResponse.json({ error: "Já existe um usuário com este e-mail." }, { status: 400 });
    }
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
