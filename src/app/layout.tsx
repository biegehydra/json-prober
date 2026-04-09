import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JSON Prober — Search JSON, Generate Accessor Code",
  description:
    "Paste JSON, search by key or value, and get copy-paste-ready accessor code for C#, Python, JavaScript, Java, Go, and more. Free online JSON path finder and code generator.",
  authors: [{ name: "Connor Hallman", url: "https://github.com/biegehydra" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full flex flex-col bg-base text-text-primary">
        {children}
      </body>
    </html>
  );
}
