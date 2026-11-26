import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ekhaya Ecommerce | Your business. Your store.",
  description: "Launch and grow your online store with Ekhaya Ecommerce.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  );
}