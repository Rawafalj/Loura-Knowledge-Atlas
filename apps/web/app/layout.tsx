import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Loura Knowledge Atlas",
  description: "A private, source-grounded learning and reasoning atlas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
