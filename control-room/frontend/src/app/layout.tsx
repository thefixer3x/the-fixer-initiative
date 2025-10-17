import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { SimpleAuthProvider } from "@/contexts/SimpleAuthContext";
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
        <Suspense fallback={<div>Loading...</div>}>
          <SimpleAuthProvider>
            {children}
            <Toaster position="top-right" />
          </SimpleAuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
