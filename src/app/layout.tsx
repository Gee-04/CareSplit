import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Support Wallet",
  description: "Send money home with control and peace of mind — built on Open Payments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
