import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Damas Clash",
  description: "Damas Clash — jogue online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
