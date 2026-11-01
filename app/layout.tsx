import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { CartFloatingBar } from "@/components/CartFloatingBar";
import { AuthRequiredModal } from "@/components/AuthRequiredModal";
import { ChatWidget } from "@/components/ChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | onlineshop",
    default: "onlineshop",
  },
  description: "onlineshop สินค้าคุณภาพ สั่งซื้อง่าย จัดส่งรวดเร็ว",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-gray-100 antialiased text-gray-900 flex flex-col min-h-screen">
        <main className="flex-grow pb-20 md:pb-0">
          {children}
        </main>
        
        <CartFloatingBar />
        <AuthRequiredModal />
        <ChatWidget />

        {/* Only show BottomNav on mobile */}
        <div className="md:hidden">
           <BottomNav />
        </div>
      </body>
    </html>
  );
}
