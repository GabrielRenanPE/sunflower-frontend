import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Importando a Montserrat com pesos bem fortes
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "700", "800", "900"], // O 900 (Black) é o que vai dar o destaque
});

export const metadata: Metadata = {
  title: "Sunflower Dashboard",
  description: "Análise de Viabilidade Solar em Belo Jardim",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Injetamos a variável da fonte na tag html
    <html lang="pt-BR" className={montserrat.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}