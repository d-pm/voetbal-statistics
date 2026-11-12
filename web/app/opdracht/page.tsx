import type { Metadata } from "next";
import { OpdrachtOverzicht, type Speeldagkeuze } from "@/components/opdracht-overzicht";
import { haalCompetitieOp } from "@/lib/competitie";
import { berekenStand } from "@/lib/stand";
import { haalWedstrijdenOp } from "@/lib/wedstrijden";

export const metadata: Metadata = {
  title: "Jouw opdracht",
  description: "Je eigen scoutingopdracht voor de volgende speeldag, en oefenopdrachten op afgelopen speeldagen.",
};

// Deze pagina draait op de server: ze zet de speeldagen en de spelers klaar.
// Welke opdracht jij krijgt, rekent je browser uit met je eigen scoutnummer.
export default async function OpdrachtPagina() {
  const [competitie, wedstrijden] = await Promise.all([haalCompetitieOp(), haalWedstrijdenOp()]);
  const huidige = competitie.huidigeSpeeldag ?? 0;

  // De echte opdracht (de volgende speeldag) en de afgelopen speeldagen om op te oefenen.
  // Speeldag 1 laten we weg: toen waren er nog geen cijfers om mee te kiezen.
  const speeldagen: Speeldagkeuze[] = competitie.speeldagen
    .filter((dag) => dag.nr >= 2 && (dag.nr <= huidige || dag.nr === competitie.volgendeSpeeldag))
    .map((dag) => ({
      context: {
        speeldag: dag.nr,
        deadline: dag.deadline,
        topclubs: berekenStand(wedstrijden, dag.nr)
          .filter((rij) => rij.gespeeld > 0)
          .slice(0, 6)
          .map((rij) => rij.team),
      },
      status: dag.nr > huidige ? "open" : dag.afgelopen ? "afgelopen" : "bezig",
    }));

  const spelers = competitie.spelers.map((s) => ({
    id: s.id,
    naam: s.naam,
    team: s.team,
    positie: s.positie,
    geboortedatum: s.geboortedatum,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-12">
      <header className="mb-6 sm:mb-8">
        <p className="text-[13px] font-semibold text-accent sm:text-[15px]">Premier League {competitie.seizoen}</p>
        <h1 className="mt-1 text-[34px] font-bold leading-[1.1] tracking-[-0.025em] sm:text-5xl sm:tracking-[-0.03em]">
          Jouw opdracht
        </h1>
        <p className="mt-3 text-[17px] leading-[1.45] text-secundair">
          Elke speeldag geeft de club jou een eigen opdracht. Raad één speler aan vóór de deadline. Na de speeldag zie
          je hoe goed je keuze was.
        </p>
      </header>

      <OpdrachtOverzicht speeldagen={speeldagen} spelers={spelers} />
    </main>
  );
}
