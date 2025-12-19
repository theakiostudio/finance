import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance Splitter - Flatmate Expense Tracker",
  description: "Split household expenses 50/50 with your flatmate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
