import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voetbal Scout",
  description: "Scout spelers met echte voetbalstatistieken en speel tegen je vrienden.",
};

// De kleur van de statusbalk op een gsm, gelijk aan de achtergrond van de pagina
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// De layout staat rond elke pagina: hier komt alles wat overal hetzelfde is, zoals de bovenbalk.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-grond font-sans text-primair">
        <header className="navigatiebalk materiaal sticky top-0 z-30">
          <div className="mx-auto flex h-12 w-full max-w-6xl items-center gap-2.5 px-4 sm:px-6">
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-[7px] bg-linear-to-b from-[#34c759] to-[#248a3d] text-[11px] font-bold tracking-[0.02em] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]"
            >
              VS
            </span>
            <span className="text-[17px] font-semibold tracking-[-0.022em]">Voetbal Scout</span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
