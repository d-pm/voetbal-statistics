import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Navigatie, NavigatieZonderRoute } from "@/components/navigatie";
import "./globals.css";

export const metadata: Metadata = {
  // Elke pagina kiest haar eigen titel. "%s" is de plek waar die komt: "Spelers · Voetbal Scout"
  title: { default: "Voetbal Scout", template: "%s · Voetbal Scout" },
  description: "Scout spelers met echte voetbalstatistieken en speel tegen je vrienden.",
};

// De kleur van de statusbalk op een gsm, gelijk aan de achtergrond van de pagina
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  viewportFit: "cover", // de pagina mag tot onder de inkeping van een gsm lopen
};

// De layout staat rond elke pagina: hier komt alles wat overal hetzelfde is, zoals de navigatie.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className="h-full antialiased">
      {/* Op een gsm laten we onderaan plaats voor de tabbalk */}
      <body className="flex min-h-full flex-col bg-grond pb-[calc(52px+env(safe-area-inset-bottom))] font-sans text-primair md:pb-0">
        {/* Op welke pagina je bent weet de server niet altijd op voorhand, daarom Suspense */}
        <Suspense fallback={<NavigatieZonderRoute />}>
          <Navigatie />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
