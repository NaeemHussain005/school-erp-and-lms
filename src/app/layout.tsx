import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SchoolGuide — School ERP + LMS",
  description: "Complete school management & learning platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
