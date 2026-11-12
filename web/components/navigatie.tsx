"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Doelwit, Huis, Kalender, Persoon } from "./iconen";
import { useLaatsteZoekopdracht } from "./laatste-zoekopdracht";
import { Logo } from "./logo";

// "segment" is het eerste stuk van het adres: bij /spelers/123 is dat "spelers", bij / is het null
const PAGINAS = [
  { href: "/", segment: null, label: "Overzicht", Icoon: Huis },
  { href: "/opdracht", segment: "opdracht", label: "Opdracht", Icoon: Doelwit },
  { href: "/spelers", segment: "spelers", label: "Spelers", Icoon: Persoon },
  { href: "/speeldag", segment: "speeldag", label: "Speeldag", Icoon: Kalender },
];

/** De navigatie die weet op welke pagina je bent. */
export function Navigatie() {
  return <Balken actief={useSelectedLayoutSegment()} />;
}

/** Dezelfde navigatie, maar zonder aangeduide pagina. Die tonen we heel even tijdens het laden. */
export function NavigatieZonderRoute() {
  return <Balken actief={undefined} />;
}

function Balken({ actief }: { actief: string | null | undefined }) {
  // Net zoals een tab op een iPhone onthoudt de tab "Spelers" waar je was
  const spelers = useLaatsteZoekopdracht();
  const adres = (href: string) => (href === "/spelers" ? spelers : href);

  return (
    <>
      {/* Bovenbalk: doorschijnend, de pagina schuift er wazig onderdoor */}
      <header className="navigatiebalk materiaal sticky top-0 z-30">
        <div className="mx-auto flex h-12 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
            <Logo className="size-7 drop-shadow-[0_1px_1px_rgb(0_0_0/0.12)]" />
            <span className="text-[17px] font-semibold tracking-[-0.022em]">Voetbal Scout</span>
          </Link>

          <nav aria-label="Hoofdmenu" className="hidden items-center gap-1 md:flex">
            {PAGINAS.map((pagina) => {
              const hier = pagina.segment === actief;
              return (
                <Link
                  key={pagina.href}
                  href={adres(pagina.href)}
                  aria-current={hier ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 text-[14px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50 active:opacity-60 ${
                    hier ? "bg-vulling font-semibold text-primair" : "font-medium text-secundair hover:text-primair"
                  }`}
                >
                  {pagina.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Tabbalk onderaan, alleen op een gsm: daar zit je duim */}
      <nav
        aria-label="Hoofdmenu"
        className="tabbalk materiaal fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {PAGINAS.map(({ href, segment, label, Icoon }) => {
          const hier = segment === actief;
          return (
            <Link
              key={href}
              href={adres(href)}
              aria-current={hier ? "page" : undefined}
              className={`flex h-[52px] select-none flex-col items-center justify-center gap-0.5 text-[10px] font-medium outline-none transition-opacity active:opacity-50 ${
                hier ? "text-accent" : "text-secundair"
              }`}
            >
              <Icoon className="size-6" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
