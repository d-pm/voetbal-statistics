import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { haalCompetitieOp } from "@/lib/competitie";
import { toonDag, toonDatumEnUur, toonUur } from "@/lib/datum";
import { haalWedstrijdenOp, type Wedstrijd } from "@/lib/wedstrijden";
import { PijlLinks, PijlRechts } from "./iconen";
import { blokTitel, lijnErboven } from "./stijl";

/**
 * Alle wedstrijden van één speeldag, per dag gegroepeerd. Zonder "nr" tonen we de
 * speeldag die nu bezig is of als volgende komt.
 */
export async function SpeeldagOverzicht({ nr }: { nr?: number }) {
  const [competitie, wedstrijden] = await Promise.all([haalCompetitieOp(), haalWedstrijdenOp()]);

  const huidige = competitie.speeldagen.find((dag) => dag.nr === competitie.huidigeSpeeldag);
  // Is de huidige speeldag afgelopen, dan kijken we al naar de volgende
  const standaard = huidige && !huidige.afgelopen ? huidige.nr : (competitie.volgendeSpeeldag ?? huidige?.nr ?? 1);

  const speeldag = competitie.speeldagen.find((dag) => dag.nr === (nr ?? standaard));
  if (!speeldag) {
    notFound(); // deze speeldag bestaat niet: toon de "niet gevonden"-pagina
  }

  const vanDezeSpeeldag = wedstrijden.filter((w) => w.speeldag === speeldag.nr);
  const laatste = competitie.speeldagen.length;

  // Groepeer per dag: "zaterdag 21 november" -> de wedstrijden van die dag
  const perDag = new Map<string, Wedstrijd[]>();
  for (const wedstrijd of vanDezeSpeeldag) {
    const dag = wedstrijd.aftrap ? toonDag(wedstrijd.aftrap) : "Datum nog niet bekend";
    perDag.set(dag, [...(perDag.get(dag) ?? []), wedstrijd]);
  }

  const begonnen = vanDezeSpeeldag.some((w) => w.status !== "gepland");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-12">
      <header className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <p className="text-[13px] font-semibold text-accent sm:text-[15px]">Premier League {competitie.seizoen}</p>
          <h1 className="mt-1 text-[34px] font-bold leading-[1.1] tracking-[-0.025em] sm:text-5xl sm:tracking-[-0.03em]">
            Speeldag {speeldag.nr}
          </h1>
          <p className="mt-2 text-[15px] text-secundair">
            {speeldag.afgelopen
              ? "Afgelopen"
              : begonnen
                ? "Bezig"
                : `Deadline: ${toonDag(speeldag.deadline)} om ${toonUur(speeldag.deadline)}`}
          </p>
        </div>
        <nav aria-label="Andere speeldag" className="flex gap-2">
          <Bladerknop naar={speeldag.nr - 1} laatste={laatste} label="Vorige speeldag">
            <PijlLinks className="size-4" />
          </Bladerknop>
          <Bladerknop naar={speeldag.nr + 1} laatste={laatste} label="Volgende speeldag">
            <PijlRechts className="size-4" />
          </Bladerknop>
        </nav>
      </header>

      {vanDezeSpeeldag.length === 0 && (
        <p className="rounded-2xl bg-kaart px-6 py-10 text-center text-[15px] text-secundair">
          Voor deze speeldag staan er geen wedstrijden op de kalender.
        </p>
      )}

      {[...perDag].map(([dag, lijst]) => (
        <section key={dag} className="mt-6 first-of-type:mt-0">
          <h2 className={`${blokTitel} first-letter:uppercase`}>{dag}</h2>
          <ul className="overflow-hidden rounded-2xl bg-kaart">
            {lijst.map((w) => (
              <li
                key={w.id}
                className={`grid min-h-[52px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 text-[17px] ${lijnErboven}`}
              >
                <Teamlink afkorting={w.thuis} naam={w.thuisNaam} className="justify-self-end text-right" />
                <Stand wedstrijd={w} />
                <Teamlink afkorting={w.uit} naam={w.uitNaam} className="justify-self-start" />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <footer className="mt-10 text-xs text-secundair">
        Uren in Belgische tijd. Tik op een team om de spelers te zien. Data: Fantasy Premier League · bijgewerkt op{" "}
        {toonDatumEnUur(competitie.bijgewerktOp)}.
      </footer>
    </main>
  );
}

/** In het midden van een rij: de uitslag, of het uur van de aftrap als er nog niet gespeeld is. */
function Stand({ wedstrijd }: { wedstrijd: Wedstrijd }) {
  if (wedstrijd.status === "gepland") {
    return (
      <span className="min-w-[4.5rem] text-center text-[15px] tabular-nums text-secundair">
        {wedstrijd.aftrap ? toonUur(wedstrijd.aftrap) : "–"}
      </span>
    );
  }
  return (
    <span className="min-w-[4.5rem] text-center">
      <span className="rounded-lg bg-vlak px-2.5 py-1 font-semibold tabular-nums">
        {wedstrijd.thuisScore ?? 0} – {wedstrijd.uitScore ?? 0}
      </span>
      {wedstrijd.status === "bezig" && <span className="block pt-1 text-[11px] font-semibold text-accent">Bezig</span>}
    </span>
  );
}

function Teamlink({ afkorting, naam, className }: { afkorting: string; naam: string; className: string }) {
  return (
    <Link
      href={`/spelers?team=${afkorting}`}
      className={`max-w-full truncate rounded py-3 font-semibold tracking-[-0.022em] outline-none transition-opacity hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/50 active:opacity-50 ${className}`}
    >
      {naam}
    </Link>
  );
}

function Bladerknop({
  naar,
  laatste,
  label,
  children,
}: {
  naar: number;
  laatste: number;
  label: string;
  children: ReactNode;
}) {
  const stijl = "grid size-11 place-items-center rounded-full bg-kaart outline-none";
  if (naar < 1 || naar > laatste) {
    // Geen vorige of volgende: toon de knop grijs, zodat de andere knop niet verspringt
    return (
      <span aria-hidden className={`${stijl} text-tertiair`}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={`/speeldag/${naar}`}
      aria-label={label}
      className={`${stijl} text-accent transition-[opacity,transform] duration-100 focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.94] active:opacity-70`}
    >
      {children}
    </Link>
  );
}

/** Grijze blokjes in de vorm van de pagina, zolang de speeldag laadt. */
export function SpeeldagSkelet() {
  return (
    <main
      aria-busy="true"
      aria-label="De speeldag wordt geladen"
      className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-12"
    >
      <div className="skelet h-4 w-40" />
      <div className="skelet mt-3 h-11 w-56" />
      <div className="skelet mt-3 h-5 w-64 max-w-full" />
      <div className="skelet mt-10 h-52 rounded-2xl" />
      <div className="skelet mt-6 h-52 rounded-2xl" />
    </main>
  );
}
