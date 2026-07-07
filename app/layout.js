import { Poppins, IBM_Plex_Mono, Dancing_Script } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const dancingScript = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata = {
  title: "Casa do Bolo — Gestão de encomendas",
  description: "Sistema de pedidos, lembretes e agenda para confeiteiras",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${plexMono.variable} ${dancingScript.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
