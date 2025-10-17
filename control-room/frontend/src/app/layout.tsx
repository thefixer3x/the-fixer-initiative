import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { SimpleAuthProvider } from "@/contexts/SimpleAuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Fixer Initiative Control Room",
  description: "Centralized control system for managing multiple Supabase projects efficiently"
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
