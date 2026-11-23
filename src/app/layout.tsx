import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "./fonts/Inter.ttf", variable: "--font-inter", weight: "100 900", display: "swap",
});
const instrumentSerif = localFont({
  src: [
    { path: "./fonts/InstrumentSerif-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/InstrumentSerif-Italic.ttf", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});
const plexMono = localFont({
  src: "./fonts/IBMPlexMono-Bold.ttf", variable: "--font-plex-mono", weight: "700", display: "swap",
});

export const metadata: Metadata = {
  title: "Shark Tank AI | The Pitch Room",
  description: "Practice your startup pitch, face three investors, and negotiate your deal.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
