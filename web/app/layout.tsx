import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voetbal Scout",
  description: "Scout spelers met echte voetbalstatistieken en speel tegen je vrienden.",
};

// De layout staat rond elke pagina: hier komt alles wat overal hetzelfde is, zoals de bovenbalk.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2.5 px-4 sm:px-6">
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white"
            >
              VS
            </span>
            <span className="font-semibold tracking-tight">Voetbal Scout</span>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
