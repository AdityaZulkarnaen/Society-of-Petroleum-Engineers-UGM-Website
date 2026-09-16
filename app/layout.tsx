import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SPE UGM Student Chapter — Engineering the future of energy",
  description:
    "The SPE UGM Student Chapter is a community of engineering students from all disciplines at Universitas Gadjah Mada, advancing Indonesia's energy industry through research, training, and global collaboration.",
};

export const viewport: Viewport = {
  themeColor: "#fbfbfe",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
