import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptShape",
  description: "AI CAD Generator for Onshape",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://js.puter.com/v2/" async></script>
      </head>

      <body className="bg-zinc-950 text-white">
        {children}
      </body>
    </html>
  );
}