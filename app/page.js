import { redirect } from "next/navigation";
import { hasAnyUser } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  try {
    const existe = await hasAnyUser();
    if (!existe) redirect("/setup");
  } catch {
    // se o banco ainda não estiver configurado, manda para o setup mesmo assim
    redirect("/setup");
  }

  redirect("/login");
}
