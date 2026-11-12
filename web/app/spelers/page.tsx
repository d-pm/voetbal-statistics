import type { Metadata } from "next";
import { Suspense } from "react";
import { DeelKnop } from "@/components/deel-knop";
import { Scouting, ScoutingBijLaden } from "@/components/scouting-tabel";
import { haalCompetitieOp } from "@/lib/competitie";
import { toonDatumEnUur } from "@/lib/datum";

export const metadata: Metadata = {
  title: "Spelers",
  description: "Doorzoek alle Premier League-spelers op positie, leeftijd en statistieken.",
};

// Deze pagina draait op de server: ze haalt de data op en geeft die door aan de tabel.
export default async function ScoutingPagina() {
  const { spelers, seizoen, huidigeSpeeldag, bijgewerktOp } = await haalCompetitieOp();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-12">
      <header className="mb-6 sm:mb-8">
        <p className="text-[13px] font-semibold text-accent sm:text-[15px]">
          Premier League {seizoen}
          {huidigeSpeeldag !== null && ` · na speeldag ${huidigeSpeeldag}`}
        </p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-0.025em] sm:text-5xl sm:tracking-[-0.03em]">
            Scoutingdatabase
          </h1>
          {/* De filters staan in het adres: wie de link krijgt, ziet dezelfde lijst */}
          <DeelKnop />
        </div>
        <p className="mt-3 max-w-2xl text-[17px] leading-[1.45] text-secundair">
          Zoek spelers die passen bij de opdracht van je club. Met Per 90 vergelijk je eerlijk, ook als iemand minder
          speelde. Tik op een speler voor alle cijfers.
        </p>
      </header>

      {/*
        De filters staan in de URL, en die kent alleen de browser. Daarom tekent de server
        eerst de tabel met de standaardfilters (fallback) en neemt de browser het daarna over.
      */}
      <Suspense fallback={<ScoutingBijLaden spelers={spelers} />}>
        <Scouting spelers={spelers} />
      </Suspense>

      <footer className="mt-12 text-xs text-secundair">
        Data: Fantasy Premier League · bijgewerkt op {toonDatumEnUur(bijgewerktOp)}. Spelers die de competitie
        verlieten, staan er niet meer in.
      </footer>
    </main>
  );
}
