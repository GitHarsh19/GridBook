import type { Metadata } from "next";
import { Geist, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit-var",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "PitPass — Book Sim Racing Rigs",
  description:
    "Discover and book sim racing rigs and gaming cafe slots in your city.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${outfit.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "#1f1f1f",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#e2e2e2",
            },
          }}
        />
      </body>
    </html>
  );
}
