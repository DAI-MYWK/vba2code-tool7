import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "住所照合ツール - ホットスタッフ",
  description: "ジョブオプとHOT犬索の住所データを照合し、不一致を検出するツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <header className="bg-primary text-white py-6 px-8 shadow-md">
          <h1 className="text-2xl font-bold">住所照合ツール</h1>
          <p className="text-sm text-blue-100 mt-1">
            ジョブオプ × HOT犬索 住所データ照合システム
          </p>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>
        <footer className="text-center py-6 text-sm text-gray-500 border-t border-border mt-16">
          株式会社ホットスタッフ - 住所照合ツール
        </footer>
      </body>
    </html>
  );
}
