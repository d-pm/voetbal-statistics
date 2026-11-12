import Link from "next/link";
import { Aftellen } from "@/components/aftellen";
import { PijlRechts } from "@/components/iconen";
import { hoofdknop, lijnErboven, tekstlink } from "@/components/stijl";
import { haalCompetitieOp, type Speler } from "@/lib/competitie";
import { toonDag, toonKorteDag, toonUur } from "@/lib/datum";
import { pasToe } from "@/lib/filters";
import { OPDRACHTEN, linkNaarKandidaten, type Opdracht } from "@/lib/opdrachten";
import { KOLOMMEN, POSITIE_NAMEN, formatteer, waarde, type Statistiek } from "@/lib/statistieken";
import { haalWedstrijdenOp } from "@/lib/wedstrijden";

const STAPPEN = [
  {
    titel: "De club geeft een opdracht",
    tekst: "Elke speeldag zoekt de club iets anders. Bijvoorbeeld een jonge verdediger die veel ballen afpakt.",
  },
  {
    titel: "Jij raadt één speler aan",
    tekst: "Zoek in de echte cijfers wie past, en let op blessures. Kiezen kan tot de deadline van de speeldag.",
  },
  {
    titel: "De speeldag beslist",
    tekst: "Wat je speler daarna echt doet, levert punten op. Speelt je keuze niet, dan krijg je niets.",
  },
];

// De startpagina. Ze draait op de server: die haalt de data op en maakt er HTML van.
export default async function Startpagina() {
  const [competitie, wedstrijden] = await Promise.all([haalCompetitieOp(), haalWedstrijdenOp()]);

  const volgende = competitie.speeldagen.find((dag) => dag.nr === competitie.volgendeSpeeldag);
  const komend = volgende ? wedstrijden.filter((w) => w.speeldag === volgende.nr) : [];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center lg:gap-12">
        <header>
          <p className="text-[13px] font-semibold text-accent sm:text-[15px]">Premier League {competitie.seizoen}</p>
          <h1 className="mt-1 max-w-xl text-[34px] font-bold leading-[1.08] tracking-[-0.025em] sm:text-[56px] sm:leading-[1.04] sm:tracking-[-0.035em]">
            Vind de speler die je club zoekt.
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-[1.45] text-secundair sm:text-[19px]">
            Jij bent de scout. De club zegt wat ze nodig heeft, jij zoekt het uit in de echte cijfers van{" "}
            {competitie.spelers.length} spelers.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/spelers" className={hoofdknop}>
              Begin met scouten
            </Link>
            <a href="#zo-werkt-het" className={`text-[17px] ${tekstlink}`}>
              Zo werkt het spel
            </a>
          </div>
        </header>

        {volgende && (
          <section aria-labelledby="deadline-titel" className="rounded-[22px] bg-kaart p-5">
            <p className="text-[13px] font-semibold text-secundair">Volgende deadline</p>
            <h2 id="deadline-titel" className="mt-0.5 text-[22px] font-bold tracking-[-0.02em]">
              Speeldag {volgende.nr}
            </h2>
            <p className="mt-0.5 text-[15px] text-secundair">
              {toonDag(volgende.deadline)} om {toonUur(volgende.deadline)}
            </p>
            <div className="mt-4">
              <Aftellen tot={volgende.deadline} voorbij="De speeldag is begonnen." />
            </div>
            {komend.length > 0 && (
              <Link
                href={`/speeldag/${volgende.nr}`}
                className="-mx-2 -mb-2 mt-3 flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-[15px] outline-none transition-colors hover:bg-kaart-hover focus-visible:ring-2 focus-visible:ring-accent/50 active:bg-kaart-druk"
              >
                <span>
                  <span className="font-semibold text-accent">{komend.length} wedstrijden</span>
                  {komend[0].aftrap && (
                    <span className="block text-[13px] text-secundair">
                      Eerste aftrap: {komend[0].thuisNaam} – {komend[0].uitNaam}, {toonKorteDag(komend[0].aftrap)}{" "}
                      {toonUur(komend[0].aftrap)}
                    </span>
                  )}
                </span>
                <PijlRechts className="size-3.5 shrink-0 text-tertiair" />
              </Link>
            )}
          </section>
        )}
      </div>

      {/* ---- Oefenopdrachten ---- */}
      <section aria-labelledby="oefenen-titel" className="mt-12 sm:mt-16">
        <h2 id="oefenen-titel" className="text-[28px] font-bold tracking-[-0.025em]">
          Oefen op een opdracht
        </h2>
        <p className="mt-1 max-w-2xl text-[17px] leading-[1.45] text-secundair">
          Zo ziet een opdracht van een club eruit. Bij elke opdracht staan de drie spelers die er nu het best bij
          passen.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {OPDRACHTEN.map((opdracht) => (
            <Opdrachtkaart key={opdracht.sleutel} opdracht={opdracht} spelers={competitie.spelers} />
          ))}
        </div>
      </section>

      {/* ---- Uitleg ---- */}
      <section id="zo-werkt-het" aria-labelledby="uitleg-titel" className="mt-12 scroll-mt-16 sm:mt-16">
        <h2 id="uitleg-titel" className="text-[28px] font-bold tracking-[-0.025em]">
          Zo werkt het spel
        </h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {STAPPEN.map((stap, index) => (
            <li key={stap.titel} className="rounded-2xl bg-kaart p-5">
              <span
                aria-hidden
                className="grid size-8 place-items-center rounded-full bg-accent-zacht text-[15px] font-bold text-accent"
              >
                {index + 1}
              </span>
              <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.02em]">{stap.titel}</h3>
              <p className="mt-1 text-[15px] leading-[1.45] text-secundair">{stap.tekst}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 px-1 text-[13px] leading-relaxed text-secundair">
          Scouten kan nu al. Aanraden, punten en de ranglijst met je vrienden zijn in de maak.
        </p>
      </section>
    </main>
  );
}

// Het lijntje tussen de rijen begint hier wat verder naar rechts, gelijk met de tekst
const lijn = `${lijnErboven} not-first:before:left-5!`;

function Opdrachtkaart({ opdracht, spelers }: { opdracht: Opdracht; spelers: Speler[] }) {
  const { filters } = opdracht;
  const kandidaten = pasToe(spelers, filters);
  // Bij een oefenopdracht sorteren we altijd op een statistiek, nooit op naam of leeftijd
  const statistiek = filters.sorteer as Statistiek;
  const label = KOLOMMEN.find((kolom) => kolom.sleutel === statistiek)!.uitleg.toLowerCase();

  return (
    <article className="flex flex-col rounded-2xl bg-kaart pt-5">
      <div className="px-5">
        <p className="text-[13px] font-semibold text-accent">
          {filters.positie !== "ALLE" && POSITIE_NAMEN[filters.positie]}
          {filters.maxLeeftijd !== null && ` · hoogstens ${filters.maxLeeftijd} jaar`}
        </p>
        <h3 className="mt-0.5 text-[20px] font-bold tracking-[-0.02em]">{opdracht.titel}</h3>
        <p className="mt-1 text-[15px] leading-[1.45] text-secundair">“{opdracht.club}”</p>
      </div>

      <p className="mt-4 px-5 pb-1.5 text-[13px] font-semibold text-secundair">Meeste {label} per 90 minuten</p>
      <ol className="flex-1">
        {kandidaten.slice(0, 3).map((speler, index) => (
          <li key={speler.id} className={lijn}>
            <Link
              href={`/spelers/${speler.id}`}
              className="flex items-center gap-3 py-2.5 pl-5 pr-4 outline-none transition-colors hover:bg-kaart-hover focus-visible:bg-kaart-hover active:bg-kaart-druk"
            >
              <span aria-hidden className="w-4 text-[15px] font-semibold tabular-nums text-secundair">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-semibold tracking-[-0.022em]">{speler.naam}</span>
                <span className="block truncate text-[13px] text-secundair">
                  {speler.teamNaam}
                  {speler.leeftijd !== null && ` · ${speler.leeftijd} jaar`}
                </span>
              </span>
              <span className="text-[17px] font-semibold tabular-nums">
                {formatteer(statistiek, waarde(speler, statistiek, true), true)}
              </span>
              <PijlRechts className="size-3.5 shrink-0 text-tertiair" />
            </Link>
          </li>
        ))}
      </ol>

      <Link
        href={linkNaarKandidaten(opdracht)}
        className={`${lijn} flex h-12 items-center justify-between rounded-b-2xl pl-5 pr-4 text-[15px] font-semibold text-accent outline-none transition-colors hover:bg-kaart-hover focus-visible:bg-kaart-hover active:bg-kaart-druk`}
      >
        Alle {kandidaten.length} kandidaten
        <PijlRechts className="size-3.5" />
      </Link>
    </article>
  );
}
