import type { Metadata } from "next";
import { displayFont, bodyFont } from "@/lib/fonts";
import { Providers } from "./providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "VMG Partners - Portfolio Intelligence",
  description:
    "Internal tooling for VMG Partners Technology and Consumer portfolios",
  icons: { icon: "/vmg-vector.svg" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} font-sans antialiased`}
      >
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
