import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shark Tank AI | The Pitch Room",
  description: "Practice your startup pitch, face three investors, and negotiate your deal.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
