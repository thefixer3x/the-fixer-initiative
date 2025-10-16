import type { Metadata } from "next";
import { Suspense } from "react";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import "./globals.css";
import { AuthProvider } from "@/contexts/StackAuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Fixer Initiative Control Room",
  description: "Centralized control system for managing multiple Supabase projects efficiently",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/apple-touch-icon-precomposed.png' }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StackProvider app={stackClientApp}>
          <StackTheme>
            <Suspense fallback={<div>Loading...</div>}>
              <AuthProvider>
                {children}
                <Toaster position="top-right" />
              </AuthProvider>
            </Suspense>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
