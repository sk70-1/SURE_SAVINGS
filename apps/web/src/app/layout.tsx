import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sure-Savings | Smart Money Cushion for Freelancers & Gig Workers",
  description:
    "Automated emergency savings, simple recommendations, and income smoothing for freelancers and gig workers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-[#111827] min-h-screen font-sans selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
