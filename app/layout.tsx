import type { Metadata } from "next";
import { Providers } from "@/app/components/providers";
import "./globals.css";

const outfit = {
  variable: "font-sans",
};

export const metadata: Metadata = {
  title: "Ordo — Smart Print Management",
  description:
    "Upload. Pay. Collect. The modern way to manage print orders in college. Skip the WhatsApp chaos, join the queue digitally.",
  keywords: ["print management", "college", "xerox", "print orders", "queue management"],
  openGraph: {
    title: "Ordo — Smart Print Management",
    description: "Upload. Pay. Collect. The modern way to manage print orders in college.",
    type: "website",
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
      className={`${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-[var(--font-outfit)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
