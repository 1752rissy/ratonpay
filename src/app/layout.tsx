import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Rata MVP",
  description: "Divide gastos con amigos fácilmente",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rata MVP",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
  openGraph: {
    title: "Ratón Pay - Gastos Compartidos",
    description: "Únete a este grupo dentro de la rata para dividir los gastos.",
    url: "https://ratonpay.vercel.app",
    siteName: "Ratón Pay",
    images: [
      {
        url: "/icons/icon-512x512.png", // Usamos el ícono más grande disponible localmente como imagen principal (WhatsApp lo recorta a cuadrado)
        width: 512,
        height: 512,
        alt: "Logo Ratón Pay",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>

      </body>
    </html>
  );
}
