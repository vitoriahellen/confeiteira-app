import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { obterConfigMensageria, salvarConfigMensageria } from "@/lib/mensageriaConfig";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (user.papel !== "admin") {
    return NextResponse.json({ error: "Apenas administradoras podem ver esta configuração." }, { status: 403 });
  }

  const cfg = await obterConfigMensageria();

  // Nunca devolve o valor decifrado dos segredos pro navegador — só se está definido.
  return NextResponse.json({
    instanceId: cfg.instanceId,
    tokenDefinido: cfg.tokenDefinido,
    numeroInterno: cfg.numeroInterno,
  });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (user.papel !== "admin") {
    return NextResponse.json({ error: "Apenas administradoras podem alterar esta configuração." }, { status: 403 });
  }

  const body = await request.json();
  await salvarConfigMensageria(body, user);

  return NextResponse.json({ ok: true });
}
