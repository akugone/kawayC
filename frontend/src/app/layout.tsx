import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DebugToggleFloating } from "../components/DebugToggleFloating";
import { Header } from "../components/Header";
import { ErrorBoundary } from "../components/kyc/ErrorBoundary";
import ContextProvider from "../context";
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
  title: "Confidential KYC Verification | KawaiiC",
  description:
    "Verify your identity while keeping your documents completely private. Revolutionary KYC powered by iExec's Trusted Execution Environment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="kawai-c" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ContextProvider>
          <ErrorBoundary>
            <Header />
            {children}
            <DebugToggleFloating />
          </ErrorBoundary>
        </ContextProvider>
      </body>
    </html>
  );
}
