import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Influencer Finder // Automated Discovery & Sheet Sync",
  description: "Production-grade Instagram influencer discovery, multi-agent filter & scoring engine, and automated Google Sheets synchronizer.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cyber-black text-cyber-text antialiased selection:bg-neon-green/30 selection:text-neon-green">
        {children}
      </body>
    </html>
  );
}
