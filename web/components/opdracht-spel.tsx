"use client";

import { MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { berekenLeeftijd } from "@/lib/datum";
import {
  SOORTEN,
  beoordeel,
  maakOpdracht,
  oordeel,
  voldoet,
  type Beoordeling,
  type Opdracht,
} from "@/lib/spel";
import type { Kandidaat, Speeldagspel } from "@/lib/speeldagspel";
import { POSITIE_NAMEN, formatteer, uitlegVan, waarde, type Statistiek } from "@/lib/statistieken";
import { Aftellen } from "./aftellen";
import { PijlLinks, PijlRechts, Vergrootglas, Waarschuwing } from "./iconen";
import { useIsVoorbij } from "./klok";
import { Opdrachtkaart } from "./opdrachtkaart";
import { bewaarKeuze, bewaarScore, useCarriere, type Carriere } from "./scout-opslag";
import { SegmentKeuze } from "./segment-keuze";
import { Sheet } from "./sheet";
import { blokTitel, hoofdknop, lijnErboven, tekstlink } from "./stijl";

const EERST_ZICHTBAAR = 40;

/** Eén opdracht spelen: kiezen, wachten op de speeldag en je beoordeling zien. */
/** "oefenbaar" = de speeldagen die al gespeeld zijn: daar kun je meteen op oefenen. */
export function OpdrachtSpel({ spel, oefenbaar }: { spel: Speeldagspel; oefenbaar: number[] }) {
  const carriere = useCarriere();
  const deadlineVoorbij = useIsVoorbij(spel.context.deadline);

  return (
    <>
      <Link href="/opdracht" className={`-ml-1 inline-flex items-center gap-0.5 py-1 text-[17px] font-normal ${tekstlink}`}>
        <PijlLinks className="size-4" />
        Opdrachten
      </Link>
      <header className="mb-5 mt-3">
        <p className="text-[13px] font-semibold text-accent sm:text-[15px]">Premier League {spel.seizoen}</p>
        <h1 className="mt-1 text-[34px] font-bold leading-[1.1] tracking-[-0.025em] sm:text-5xl sm:tracking-[-0.03em]">
          Speeldag {spel.context.speeldag}
        </h1>
      </header>

      {/* Je opdracht en je keuzes staan in de browser: op de server tonen we de grijze blokjes */}
      {carriere && deadlineVoorbij !== null ? (
        <Spel spel={spel} oefenbaar={oefenbaar} carriere={carriere} deadlineVoorbij={deadlineVoorbij} />
      ) : (
        <div aria-busy="true" aria-label="Je opdracht wordt geladen">
          <div className="skelet h-48 rounded-[22px]" />
          <div className="skelet mt-6 h-96 rounded-2xl" />
        </div>
      )}
    </>
  );
}

function Spel({
  spel,
  oefenbaar,
  carriere,
  deadlineVoorbij,
}: {
  spel: Speeldagspel;
  oefenbaar: number[];
  carriere: Carriere;
  deadlineVoorbij: boolean;
}) {
  const nr = spel.context.speeldag;
  const opdracht = useMemo(() => maakOpdracht(carriere.scoutId, spel.context, spel.spelers), [carriere.scoutId, spel]);
  const keuze = carriere.keuzes[nr];
  const [wijzigen, setWijzigen] = useState(false);

  const beoordeling = useMemo(
    () => (keuze && spel.uitslag ? beoordeel(keuze.spelerId, opdracht, spel.context, spel.spelers, spel.uitslag) : null),
    [keuze, opdracht, spel],
  );

  // Is de speeldag helemaal klaar? Dan onthouden we je score voor je scoutprofiel.
  useEffect(() => {
    if (beoordeling && spel.afgelopen) {
      bewaarScore(nr, beoordeling.scoutscore);
    }
  }, [beoordeling, spel.afgelopen, nr]);

  // Gekozen na de deadline: dat is een oefening
  const oefening = deadlineVoorbij && (!keuze || keuze.gekozenOp >= spel.context.deadline);
  const label = oefening ? "Oefening · de speeldag is al gespeeld" : "Jouw opdracht";

  if (keuze && beoordeling) {
    return (
      <Resultaat
        spel={spel}
        opdracht={opdracht}
        beoordeling={beoordeling}
        keuzeId={keuze.spelerId}
        oefenbaar={oefenbaar}
        carriere={carriere}
        label={label}
      />
    );
  }

  const gekozen = keuze ? spel.spelers.find((s) => s.id === keuze.spelerId) : undefined;

  if (keuze && !wijzigen) {
    return (
      <div className="grid gap-4">
        <Opdrachtkaart opdracht={opdracht} label={label} />
        <section className="rounded-[22px] bg-kaart p-5">
          <p className="text-[13px] font-semibold text-secundair">Jij raadt aan</p>
          <p className="mt-0.5 text-[28px] font-bold leading-tight tracking-[-0.025em]">{gekozen?.naam ?? "Onbekende speler"}</p>
          {gekozen && <p className="text-[15px] text-secundair">{gekozen.teamNaam}</p>}

          {deadlineVoorbij ? (
            <p className="mt-4 rounded-xl bg-vlak px-4 py-3 text-[15px] leading-snug">
              De deadline is voorbij. Na de wedstrijden van deze speeldag zie je hier hoe goed je keuze was.
            </p>
          ) : (
            <>
              <p className="mt-4 text-[13px] font-semibold text-secundair">Je kunt nog wijzigen tot de deadline</p>
              <div className="mt-2">
                <Aftellen tot={spel.context.deadline} voorbij="De deadline is voorbij." />
              </div>
              <button
                type="button"
                onClick={() => setWijzigen(true)}
                className="mt-4 h-11 w-full rounded-xl bg-vlak text-[17px] font-semibold text-accent outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-accent/50 active:opacity-60"
              >
                Andere speler kiezen
              </button>
            </>
          )}
        </section>
      </div>
    );
  }

  if (deadlineVoorbij && !spel.uitslag) {
    // Net na de deadline, vóór de eerste aftrap: kiezen kan niet meer, oefenen nog niet
    return (
      <div className="grid gap-4">
        <Opdrachtkaart opdracht={opdracht} label={label} />
        <p className="rounded-[22px] bg-kaart p-5 text-[15px] leading-[1.45] text-secundair">
          De deadline voor deze speeldag is voorbij. Zodra de eerste wedstrijden gespeeld zijn, kun je ze als oefening
          spelen.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Opdrachtkaart opdracht={opdracht} label={label} />
      <Kiezen
        spel={spel}
        opdracht={opdracht}
        oefening={oefening}
        huidigeKeuze={keuze?.spelerId ?? null}
        onGekozen={() => setWijzigen(false)}
      />
    </div>
  );
}

// ---- Kiezen ----

function Kiezen({
  spel,
  opdracht,
  oefening,
  huidigeKeuze,
  onGekozen,
}: {
  spel: Speeldagspel;
  opdracht: Opdracht;
  oefening: boolean;
  huidigeKeuze: number | null;
  onGekozen: () => void;
}) {
  const soort = SOORTEN[opdracht.soort];
  const nr = spel.context.speeldag;
  const opties = Object.keys(soort.punten) as Statistiek[];
  const [cijfer, setCijfer] = useState<Statistiek>(soort.hoofdcijfer);
  const [zoekterm, setZoekterm] = useState("");
  const [toonAlles, setToonAlles] = useState(false);
  const [bekeken, setBekeken] = useState<Kandidaat | null>(null);

  // Vroeg in het seizoen heeft niemand veel minuten: dan is de drempel lager
  const drempel = Math.min(270, Math.round(67.5 * (nr - 1)));

  const kandidaten = useMemo(() => {
    const zoek = zoekterm.trim().toLowerCase();
    return spel.spelers
      .filter((s) => voldoet(s, opdracht, spel.context))
      .filter((s) => zoek === "" || `${s.naam} ${s.teamNaam}`.toLowerCase().includes(zoek))
      .sort((a, b) => {
        // Wie genoeg speelde, eerst. Daarbinnen: hoogste cijfer per 90 minuten bovenaan.
        const genoegA = a.minuten >= drempel ? 1 : 0;
        const genoegB = b.minuten >= drempel ? 1 : 0;
        return genoegB - genoegA || waarde(b, cijfer, true) - waarde(a, cijfer, true) || b.minuten - a.minuten;
      });
  }, [spel, opdracht, zoekterm, cijfer, drempel]);

  const aantalPassend = useMemo(
    () => spel.spelers.filter((s) => voldoet(s, opdracht, spel.context)).length,
    [spel, opdracht],
  );
  const zichtbaar = toonAlles ? kandidaten : kandidaten.slice(0, EERST_ZICHTBAAR);

  function raadAan(speler: Kandidaat) {
    bewaarKeuze(nr, speler.id);
    navigator.vibrate?.(12); // een klein tikje op een Android-gsm: je keuze is bewaard
    setBekeken(null);
    onGekozen();
    const minderBeweging = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: minderBeweging ? "auto" : "smooth" });
  }

  return (
    <section aria-labelledby="kiezen-titel">
      <h2 id="kiezen-titel" className="text-[22px] font-bold tracking-[-0.02em]">
        Kies je speler
      </h2>
      <p className="mt-1 text-[15px] leading-[1.45] text-secundair">
        {aantalPassend} spelers passen bij de opdracht. Je ziet hun cijfers van vóór speeldag {nr}
        {oefening ? ": wat er daarna gebeurde, zie je pas als je gekozen hebt." : "."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative flex h-10 items-center rounded-[10px] bg-vulling has-focus-visible:ring-2 has-focus-visible:ring-accent/50">
          <Vergrootglas className="pointer-events-none absolute left-2.5 size-4 text-secundair" />
          <span className="sr-only">Zoek een speler</span>
          <input
            type="search"
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
            placeholder="Zoek een speler of team"
            className="h-full w-full bg-transparent pl-8 pr-3 text-[17px] outline-none placeholder:text-secundair sm:text-[15px]"
          />
        </label>
        <SegmentKeuze
          label="Sorteer op"
          className="sm:w-72"
          opties={[...opties, "minuten" as Statistiek].map((sleutel) => ({
            waarde: sleutel,
            label: kortLabel(sleutel),
            uitleg: `Sorteer op ${uitlegVan(sleutel).toLowerCase()}`,
          }))}
          gekozen={cijfer}
          onKies={setCijfer}
        />
      </div>

      {kandidaten.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-kaart px-6 py-10 text-center text-[15px] text-secundair">
          Niemand die past heeft een naam met “{zoekterm}”.
        </p>
      ) : (
        <ul className="mt-3 overflow-hidden rounded-2xl bg-kaart">
          {zichtbaar.map((s) => {
            const weinig = s.minuten < drempel;
            return (
              <li key={s.id} className={lijnErboven}>
                <button
                  type="button"
                  onClick={() => setBekeken(s)}
                  className="flex w-full items-center gap-3 py-2.5 pl-4 pr-3 text-left transition-colors hover:bg-kaart-hover active:bg-kaart-druk"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[17px] font-semibold tracking-[-0.022em]">{s.naam}</span>
                      {s.id === huidigeKeuze && (
                        <span className="shrink-0 rounded-full bg-accent-zacht px-2 py-0.5 text-[11px] font-semibold text-accent">
                          Jouw keuze
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-[13px] text-secundair">
                      {s.team} · {leeftijdOpDeadline(s, spel)} jaar · {s.minuten} min
                    </span>
                    {s.nieuws && (
                      <span className="mt-0.5 flex items-center gap-1 text-[13px] text-waarschuwing">
                        <Waarschuwing className="size-3.5 shrink-0" />
                        <span className="truncate">{s.nieuws}</span>
                      </span>
                    )}
                  </span>
                  <span className={`shrink-0 text-right ${weinig ? "text-secundair" : ""}`}>
                    <span className="block text-[17px] font-semibold tabular-nums">
                      {formatteer(cijfer, waarde(s, cijfer, cijfer !== "minuten"), cijfer !== "minuten")}
                    </span>
                    <span className="block text-[11px] text-secundair">
                      {cijfer === "minuten" ? "minuten" : weinig ? "weinig minuten" : `${kortLabel(cijfer)} /90`}
                    </span>
                  </span>
                  <PijlRechts className="size-3.5 shrink-0 text-tertiair" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!toonAlles && kandidaten.length > EERST_ZICHTBAAR && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setToonAlles(true)}
            className="h-11 rounded-full bg-kaart px-5 text-[15px] font-semibold text-accent outline-none transition-[opacity,transform] duration-100 focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.97] active:opacity-70"
          >
            Toon alle {kandidaten.length} spelers
          </button>
        </div>
      )}

      <Sheet
        open={bekeken !== null}
        onSluit={() => setBekeken(null)}
        titelId="kandidaat-naam"
        kop={
          bekeken && (
            <>
              <p className="text-[13px] font-semibold text-accent">{bekeken.teamNaam}</p>
              <h2 id="kandidaat-naam" className="mt-0.5 text-[28px] font-bold leading-tight tracking-[-0.025em]">
                {bekeken.naam}
              </h2>
              <p className="mt-0.5 text-[15px] text-secundair">
                {POSITIE_NAMEN[bekeken.positie]} · {leeftijdOpDeadline(bekeken, spel)} jaar
              </p>
            </>
          )
        }
      >
        {bekeken && (
          <Kandidaatkaart
            speler={bekeken}
            opdracht={opdracht}
            nr={nr}
            oefening={oefening}
            alGekozen={bekeken.id === huidigeKeuze}
            onRaadAan={() => raadAan(bekeken)}
          />
        )}
      </Sheet>
    </section>
  );
}

function Kandidaatkaart({
  speler,
  opdracht,
  nr,
  oefening,
  alGekozen,
  onRaadAan,
}: {
  speler: Kandidaat;
  opdracht: Opdracht;
  nr: number;
  oefening: boolean;
  alGekozen: boolean;
  onRaadAan: () => void;
}) {
  const cijfers = Object.keys(SOORTEN[opdracht.soort].punten) as Statistiek[];
  return (
    <>
      {speler.nieuws && (
        <p className="mb-4 flex gap-2.5 rounded-xl bg-waarschuwing-zacht px-3.5 py-3 text-[15px] leading-snug text-waarschuwing">
          <Waarschuwing className="mt-0.5 size-4 shrink-0" />
          {speler.nieuws}
        </p>
      )}
      <p className={blokTitel + " px-1"}>Vóór speeldag {nr}</p>
      <ul className="rounded-xl bg-vlak">
        <li className={`flex min-h-11 items-center px-4 py-2.5 text-[15px] ${lijnErboven}`}>
          <span className="flex-1">Gespeelde minuten</span>
          <span className="font-semibold tabular-nums">{formatteer("minuten", speler.minuten, false)}</span>
        </li>
        {cijfers.map((sleutel) => (
          <li key={sleutel} className={`flex min-h-11 items-center px-4 py-2.5 text-[15px] ${lijnErboven}`}>
            <span className="flex-1">{uitlegVan(sleutel)}</span>
            <span className="w-16 text-right font-semibold tabular-nums">{formatteer(sleutel, speler[sleutel], false)}</span>
            <span className="w-20 text-right tabular-nums text-secundair">
              {formatteer(sleutel, waarde(speler, sleutel, true), true)} /90
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onRaadAan}
        disabled={alGekozen}
        className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-accent text-[17px] font-semibold text-op-accent outline-none transition-[opacity,transform] duration-100 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-kaart active:scale-[0.98] active:opacity-80 disabled:opacity-40"
      >
        {alGekozen ? "Dit is al je keuze" : `Raad ${speler.naam} aan`}
      </button>
      <p className="mt-2 text-center text-xs text-secundair">
        {oefening ? "Bij een oefening is je keuze meteen definitief." : "Je kunt je keuze nog wijzigen tot de deadline."}
      </p>
    </>
  );
}

// ---- De beoordeling ----

function Resultaat({
  spel,
  opdracht,
  beoordeling,
  keuzeId,
  oefenbaar,
  carriere,
  label,
}: {
  spel: Speeldagspel;
  opdracht: Opdracht;
  beoordeling: Beoordeling;
  keuzeId: number;
  oefenbaar: number[];
  carriere: Carriere;
  label: string;
}) {
  const perId = useMemo(() => new Map(spel.spelers.map((s) => [s.id, s])), [spel]);
  const jij = perId.get(keuzeId);
  const anderen = beoordeling.aantal - 1;

  // De volgende oefening: de recentste speeldag waar je nog niets koos
  const volgende = [...oefenbaar].reverse().find((dag) => dag !== spel.context.speeldag && !carriere.keuzes[dag]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid gap-4">
        <motion.section
          aria-labelledby="score-titel"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="rounded-[22px] bg-kaart p-5"
        >
          <p id="score-titel" className="text-[13px] font-semibold text-secundair">
            {spel.afgelopen ? "Scoutscore" : "Voorlopige scoutscore"}
          </p>
          <div className="mt-1 flex items-end gap-3">
            <p className="text-[64px] font-bold leading-none tracking-[-0.04em]">{beoordeling.scoutscore}</p>
            <p className="pb-2 text-[20px] font-semibold tracking-[-0.02em]">{oordeel(beoordeling)}</p>
          </div>

          <div
            role="meter"
            aria-label="Scoutscore"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={beoordeling.scoutscore}
            className="mt-4 h-2 overflow-hidden rounded-full bg-accent-zacht"
          >
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.max(2, beoordeling.scoutscore)}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.9, delay: 0.15 }}
            />
          </div>

          <p className="mt-4 text-[17px] leading-[1.45]">
            Je raadde <span className="font-semibold">{jij?.naam ?? "een onbekende speler"}</span> aan
            {jij && <span className="text-secundair"> ({jij.teamNaam})</span>}.{" "}
            {beoordeling.speelde
              ? `Je keuze deed het beter dan ${beoordeling.scoutscore}% van de ${anderen} andere spelers die bij de opdracht pasten.`
              : "Je speler speelde niet, en wie niet speelt, levert niets op. Blessures en schorsingen checken hoort bij scouten."}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-vlak px-3.5 py-3">
              <dt className="text-xs text-secundair">Punten</dt>
              <dd className="text-[22px] font-bold tracking-[-0.02em]">{String(beoordeling.punten).replace(".", ",")}</dd>
            </div>
            <div className="rounded-xl bg-vlak px-3.5 py-3">
              <dt className="text-xs text-secundair">Plaats</dt>
              <dd className="text-[22px] font-bold tracking-[-0.02em]">
                {beoordeling.plaats} <span className="text-[15px] font-semibold text-secundair">van {beoordeling.aantal}</span>
              </dd>
            </div>
          </dl>
          {beoordeling.speelde && <p className="mt-2 px-1 text-[13px] text-secundair">{beoordeling.uitleg}</p>}
          {!spel.afgelopen && (
            <p className="mt-3 rounded-xl bg-vlak px-3.5 py-2.5 text-[13px] text-secundair">
              De speeldag is nog bezig. Je score kan nog veranderen.
            </p>
          )}
        </motion.section>

        <Opdrachtkaart opdracht={opdracht} label={label} />

        <section aria-labelledby="besten-titel">
          <h2 id="besten-titel" className={blokTitel}>
            De beste keuzes deze speeldag
          </h2>
          <ol className="overflow-hidden rounded-2xl bg-kaart">
            {beoordeling.besten.map((beste, index) => {
              const speler = perId.get(beste.id);
              const isJij = beste.id === keuzeId;
              return (
                <li key={beste.id} className={`flex items-center gap-3 px-4 py-2.5 ${lijnErboven} ${isJij ? "bg-accent-zacht" : ""}`}>
                  <span aria-hidden className="w-4 text-[15px] font-semibold tabular-nums text-secundair">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-semibold tracking-[-0.022em]">
                      {speler?.naam ?? "Onbekend"}
                      {isJij && <span className="ml-2 text-[13px] font-semibold text-accent">jouw keuze</span>}
                    </span>
                    <span className="block truncate text-[13px] text-secundair">{speler?.teamNaam}</span>
                  </span>
                  <span className="text-[17px] font-semibold tabular-nums">{String(beste.punten).replace(".", ",")}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
          {volgende !== undefined && (
            <Link href={`/opdracht/${volgende}`} className={hoofdknop}>
              Volgende oefening
            </Link>
          )}
          <Link href="/opdracht" className={`text-[17px] ${tekstlink}`}>
            Al je opdrachten
          </Link>
        </div>
      </div>
    </MotionConfig>
  );
}

// ---- Hulpjes ----

function leeftijdOpDeadline(speler: Kandidaat, spel: Speeldagspel) {
  return berekenLeeftijd(speler.geboortedatum, new Date(spel.context.deadline)) ?? "?";
}

function kortLabel(sleutel: Statistiek) {
  const labels: Partial<Record<Statistiek, string>> = {
    minuten: "Minuten",
    goals: "Goals",
    assists: "Assists",
    xg: "xG",
    xa: "xA",
    tackles: "Tackles",
    recoveries: "Recov.",
    cbi: "CBI",
    saves: "Saves",
    cleanSheets: "CS",
  };
  return labels[sleutel] ?? sleutel;
}
