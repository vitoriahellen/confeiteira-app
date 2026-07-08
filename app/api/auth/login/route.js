import { NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { registrarEvento } from "@/lib/auditoria";

export async function POST(request) {
  try {
    await ensureSchema();
    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }

    const result = await query(
      "SELECT id, nome, email, senha_hash, papel, permissoes, tutorial_visto FROM usuarios WHERE email = $1",
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      await registrarEvento({ usuarioNome: email, tipo: "login_falha", modulo: "auth", detalhes: "E-mail não cadastrado." });
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }

    const senhaOk = await verifyPassword(senha, user.senha_hash);
    if (!senhaOk) {
      await registrarEvento({ usuarioId: user.id, usuarioNome: user.nome, tipo: "login_falha", modulo: "auth", detalhes: "Senha incorreta." });
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }

    const token = await createSessionToken(user);
    await setSessionCookie(token);
    await registrarEvento({ usuarioId: user.id, usuarioNome: user.nome, tipo: "login_sucesso", modulo: "auth" });

    return NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        papel: user.papel,
        permissoes: user.permissoes,
        tutorialVisto: user.tutorial_visto,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
