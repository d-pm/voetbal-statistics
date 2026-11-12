import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { NieuwsBlok } from "@/components/nieuws";
import { blokTitel, lijnErboven, tekstlink } from "@/components/stijl";
import { TerugNaarSpelers } from "@/components/terug-naar-spelers";
import { VormGrafiek } from "@/components/vorm-grafiek";
import { haalCompetitieOp } from "@/lib/competitie";
import { toonKorteDag, toonUur } from "@/lib/datum";
import { haalProfielOp, type KomendeWedstrijd, type Profiel, type Wedstrijdcijfers } from "@/lib/profiel";
import {
  GROEPEN,
  KOLOMMEN,
  MIN_MINUTEN_VERGELIJKING,
  POSITIE_MEERVOUD,
  POSITIE_NAMEN,
  formatteer,
  uitlegVan,
  waarde,
  type Statistiek,
} from "@/lib/statistieken";

// De map heet [id]: /spelers/223094 geeft id = "223094", de vaste code van de speler.

/**
 * De spelers die het meest speelden krijgen hun pagina al bij het bouwen van de site.
 * Alle andere pagina's maakt Next.js de eerste keer dat iemand ze opent, en bewaart ze dan.
 */
export async function generateStaticParams() {
  const { spelers } = await haalCompetitieOp();
  return [...spelers]
    .sort((a, b) => b.minuten - a.minuten)
    .slice(0, 5)
    .map((speler) => ({ id: String(speler.id) }));
}

export async function generateMetadata({ params }: PageProps<"/spelers/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { spelers } = await haalCompetitieOp();
  const speler = spelers.find((s) => s.id === Number(id));
  if (!speler) {
    return { title: "Speler niet gevonden" };
  }
  return {
    title: speler.naam,
    description: `De cijfers van ${speler.volledigeNaam} (${speler.teamNaam}), per wedstrijd en vergeleken met andere ${POSITIE_MEERVOUD[speler.positie]}.`,
  };
}

export default function SpelerPagina({ params }: PageProps<"/spelers/[id]">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-4 sm:px-6 sm:pt-8">
      <TerugNaarSpelers />

      {/* Terwijl de data van deze speler geladen wordt, toont Suspense de grijze blokjes (fallback) */}
      <Suspense fallback={<Skelet />}>
        <Inhoud params={params} />
      </Suspense>
    </main>
  );
}

async function Inhoud({ params }: Pick<PageProps<"/spelers/[id]">, "params">) {
  const { id } = await params;
  const profiel = /^\d+$/.test(id) ? await haalProfielOp(Number(id)) : null;
  if (!profiel) {
    notFound();
  }

  const { speler, wedstrijden, komend } = profiel;
  const gespeeld = wedstrijden.filter((w) => w.minuten > 0);
  // De cijfers die bij deze positie horen, de belangrijkste eerst
  const kolommen = GROEPEN[speler.positie].flatMap((groep) => groep.kolommen);

  const tegels: { label: string; waarde: string; extra?: string }[] = [
    {
      label: "Gespeeld",
      waarde: String(gespeeld.length),
      extra: `${speler.basisplaatsen} in de basis`,
    },
    { label: "Minuten", waarde: formatteer("minuten", speler.minuten, false) },
    ...kolommen.slice(0, 2).map((sleutel) => ({
      label: uitlegVan(sleutel),
      waarde: formatteer(sleutel, speler[sleutel], false),
      extra: `${formatteer(sleutel, waarde(speler, sleutel, true), true)} per 90`,
    })),
  ];

  return (
    <>
      <header className="mt-3">
        <Link href={`/spelers?team=${speler.team}`} className={`text-[13px] sm:text-[15px] ${tekstlink}`}>
          {speler.teamNaam}
        </Link>
        <h1 className="mt-1 text-[34px] font-bold leading-[1.1] tracking-[-0.025em] sm:text-5xl sm:tracking-[-0.03em]">
          {speler.naam}
        </h1>
        <p className="mt-2 text-[17px] text-secundair">
          {speler.volledigeNaam !== speler.naam && `${speler.volledigeNaam} · `}
          {POSITIE_NAMEN[speler.positie]}
          {speler.leeftijd !== null && ` · ${speler.leeftijd} jaar`}
        </p>
      </header>

      <NieuwsBlok speler={speler} className="mt-5 max-w-2xl" />

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {tegels.map((tegel) => (
          <div key={tegel.label} className="rounded-2xl bg-kaart px-4 py-3.5">
            <dt className="truncate text-[13px] text-secundair">{tegel.label}</dt>
            <dd className="mt-0.5 text-[28px] font-bold leading-tight tracking-[-0.02em]">{tegel.waarde}</dd>
            {tegel.extra && <dd className="text-xs text-secundair">{tegel.extra}</dd>}
          </div>
        ))}
      </dl>

      {wedstrijden.length === 0 ? (
        <>
          <p className="mt-6 rounded-2xl bg-kaart px-6 py-10 text-center text-[15px] text-secundair">
            Van deze speler zijn er dit seizoen nog geen wedstrijden.
          </p>
          <div className="mt-6 max-w-2xl">
            <Komend wedstrijden={komend} />
          </div>
        </>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
            <div className="grid grid-cols-1 gap-6">
              <VormGrafiek wedstrijden={wedstrijden} positie={speler.positie} />
              <Komend wedstrijden={komend} />
            </div>
            <Vergelijking profiel={profiel} />
          </div>
          <Wedstrijdtabel wedstrijden={wedstrijden} kolommen={kolommen} />
        </>
      )}
    </>
  );
}

function Komend({ wedstrijden }: { wedstrijden: KomendeWedstrijd[] }) {
  if (wedstrijden.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="komend-titel">
      <h2 id="komend-titel" className={blokTitel}>
        Volgende wedstrijden
      </h2>
      <ul className="overflow-hidden rounded-2xl bg-kaart">
        {wedstrijden.map((w) => (
          <li
            key={`${w.speeldag}-${w.tegenstander}-${w.aftrap}`}
            className={`flex min-h-11 items-center gap-3 px-4 py-2.5 text-[15px] ${lijnErboven}`}
          >
            <span className="flex-1">
              <span className="font-semibold">{w.tegenstanderNaam}</span>{" "}
              <span className="text-secundair">({w.thuis ? "thuis" : "uit"})</span>
            </span>
            <span className="text-right text-[13px] tabular-nums text-secundair">
              {w.aftrap ? `${toonKorteDag(w.aftrap)} · ${toonUur(w.aftrap)}` : "Datum nog niet bekend"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Balkjes die tonen hoe de speler het doet tegenover de anderen op dezelfde positie. */
function Vergelijking({ profiel }: { profiel: Profiel }) {
  const { speler, vergelijking } = profiel;
  const soortgenoten = POSITIE_MEERVOUD[speler.positie];
  const kolommen = GROEPEN[speler.positie].flatMap((groep) => groep.kolommen);

  return (
    <section aria-labelledby="vergelijking-titel" className="rounded-2xl bg-kaart p-5">
      <h2 id="vergelijking-titel" className="text-[13px] font-semibold text-secundair">
        Tegenover andere {soortgenoten}
      </h2>

      {speler.minuten < MIN_MINUTEN_VERGELIJKING && (
        <p className="mt-2 rounded-xl bg-vlak px-3.5 py-2.5 text-[13px] leading-snug text-secundair">
          Nog geen {MIN_MINUTEN_VERGELIJKING} minuten gespeeld. Met zo weinig minuten zeggen cijfers per 90 niet
          veel: één goede invalbeurt geeft al een topcijfer.
        </p>
      )}

      <ul className="mt-3 grid gap-3.5">
        {kolommen.map((sleutel) => {
          const percentiel = vergelijking.percentielen[sleutel] ?? 0;
          return (
            <li key={sleutel}>
              <div className="flex items-baseline justify-between gap-3 text-[15px]">
                <span>{uitlegVan(sleutel)}</span>
                <span className="font-semibold tabular-nums">
                  {formatteer(sleutel, waarde(speler, sleutel, true), true)}
                </span>
              </div>
              {/* De baan is een lichtere tint van het balkje zelf */}
              <div
                role="meter"
                aria-label={`${uitlegVan(sleutel)}: beter dan ${percentiel}% van de ${soortgenoten}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentiel}
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-accent-zacht"
              >
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(percentiel, 2)}%` }} />
              </div>
              <p className="mt-1 text-xs text-secundair">Beter dan {percentiel}%</p>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-secundair">
        Cijfers per 90 minuten, vergeleken met de {vergelijking.aantal} andere {soortgenoten} die minstens{" "}
        {MIN_MINUTEN_VERGELIJKING} minuten speelden. 50% is het midden van de groep.
      </p>
    </section>
  );
}

function uitslag(w: Wedstrijdcijfers) {
  if (w.eigenScore === null || w.tegenScore === null) {
    return "–";
  }
  // W = winst, G = gelijk, V = verlies. De eigen ploeg staat altijd eerst.
  const letter = w.eigenScore > w.tegenScore ? "W" : w.eigenScore < w.tegenScore ? "V" : "G";
  return `${letter} ${w.eigenScore}–${w.tegenScore}`;
}

/** Dezelfde cijfers als de grafiek, maar allemaal samen in een tabel. De recentste wedstrijd staat bovenaan. */
function Wedstrijdtabel({ wedstrijden, kolommen }: { wedstrijden: Wedstrijdcijfers[]; kolommen: Statistiek[] }) {
  const koppen: Statistiek[] = ["minuten", ...kolommen];
  const cel = "border-t border-lijn px-3 py-2.5";

  return (
    <section aria-labelledby="tabel-titel" className="mt-8">
      <h2 id="tabel-titel" className={blokTitel}>
        Alle wedstrijden
      </h2>
      <div className="overflow-x-auto rounded-2xl bg-kaart">
        <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-xs text-secundair">
              <th scope="col" className="py-3 pl-5 pr-3 text-left font-semibold">
                Speeldag
              </th>
              <th scope="col" className="px-3 py-3 text-left font-semibold">
                Tegenstander
              </th>
              <th scope="col" className="px-3 py-3 text-left font-semibold">
                Uitslag
              </th>
              {koppen.map((sleutel) => (
                <th key={sleutel} scope="col" title={uitlegVan(sleutel)} className="px-3 py-3 text-right font-semibold last:pr-5">
                  {KOLOMMEN.find((kolom) => kolom.sleutel === sleutel)!.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...wedstrijden].reverse().map((w) => (
              <tr key={`${w.speeldag}-${w.aftrap}`} className={w.minuten === 0 ? "text-secundair" : ""}>
                <td className={`${cel} pl-5 tabular-nums`}>{w.speeldag}</td>
                <td className={`${cel} whitespace-nowrap`}>
                  <span className={w.minuten > 0 ? "font-semibold" : ""}>{w.tegenstanderNaam}</span>{" "}
                  <span className="text-secundair">({w.thuis ? "thuis" : "uit"})</span>
                </td>
                <td className={`${cel} whitespace-nowrap tabular-nums`}>{uitslag(w)}</td>
                {w.minuten === 0 ? (
                  <td colSpan={koppen.length} className={`${cel} pr-5 text-right`}>
                    Speelde niet
                  </td>
                ) : (
                  koppen.map((sleutel) => (
                    <td key={sleutel} className={`${cel} text-right tabular-nums last:pr-5`}>
                      {formatteer(sleutel, w[sleutel], false)}
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 hidden px-1 text-xs leading-relaxed text-secundair md:block">
        W = winst, G = gelijk, V = verlies ·{" "}
        {KOLOMMEN.filter((kolom) => koppen.includes(kolom.sleutel) && kolom.label !== kolom.uitleg)
          .map((kolom) => `${kolom.label} = ${kolom.uitleg.toLowerCase()}`)
          .join(" · ")}
      </p>
    </section>
  );
}

/** Grijze blokjes in de vorm van de pagina, zolang de data laadt. */
function Skelet() {
  return (
    <div aria-busy="true" aria-label="De speler wordt geladen">
      <div className="skelet mt-4 h-4 w-28" />
      <div className="skelet mt-3 h-11 w-64 max-w-full" />
      <div className="skelet mt-3 h-5 w-52" />
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((nr) => (
          <div key={nr} className="skelet h-[5.5rem] rounded-2xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="skelet h-80 rounded-2xl" />
        <div className="skelet h-80 rounded-2xl" />
      </div>
    </div>
  );
}
