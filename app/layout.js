import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "Caderno — Gestão de encomendas",
  description: "Sistema de pedidos, lembretes e agenda para confeiteiras",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
