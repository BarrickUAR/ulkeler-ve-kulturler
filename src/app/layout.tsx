import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Baloo_2, Patrick_Hand, Shrikhand } from "next/font/google";
import "./globals.css";

const el = Patrick_Hand({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-el", display: "swap" });
const okunur = Atkinson_Hyperlegible_Next({ subsets: ["latin", "latin-ext"], variable: "--font-okunur", display: "swap" });
// Kapaktaki "Ülkeler ve Kültürler" yazısına yakın retro kalın el yazısı
const kapak = Shrikhand({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-kapak", display: "swap" });
// Çizgi film arayüz yazısı (rozetler, kartlar, düğmeler)
const cizgi = Baloo_2({ weight: ["500", "700", "800"], subsets: ["latin", "latin-ext"], variable: "--font-cizgi", display: "swap" });

const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Ülkeler ve Kültürler", template: "%s · Ülkeler ve Kültürler" },
  description: "Bir kitapçığın sesli, hareketli sayfaları.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f6f7f3", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${el.variable} ${okunur.variable} ${kapak.variable} ${cizgi.variable}`}>
      <body>{children}</body>
    </html>
  );
}
