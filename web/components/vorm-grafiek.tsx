"use client";

import { useState, type PointerEvent } from "react";
import type { Positie } from "@/lib/competitie";
import type { Wedstrijdcijfers } from "@/lib/profiel";
import { KOLOMMEN, formatteer, uitlegVan, type Statistiek } from "@/lib/statistieken";
import { PijlenOpNeer } from "./iconen";

// Welke statistiek we eerst tonen, hangt af van de positie
const EERSTE_KEUZE: Record<Positie, Statistiek> = { GKP: "saves", DEF: "tackles", MID: "xa", FWD: "xg" };

/** De bovenkant van de grafiek: een rond getal net boven de hoogste waarde. */
function bovengrens(statistiek: Statistiek, hoogste: number) {
  if (statistiek === "minuten") return 90;
  if (statistiek === "xg" || statistiek === "xa") return Math.max(0.2, Math.ceil(hoogste * 5) / 5); // stappen van 0,2
  return Math.max(2, Math.ceil(hoogste / 2) * 2); // een even getal, zo is de middelste lijn ook een heel getal
}

/**
 * Staafjes per wedstrijd voor één statistiek. Ga met je muis of vinger over de
 * grafiek: het getal erboven toont dan die ene wedstrijd, zoals in de Aandelen-app.
 */
export function VormGrafiek({ wedstrijden, positie }: { wedstrijden: Wedstrijdcijfers[]; positie: Positie }) {
  const [statistiek, setStatistiek] = useState<Statistiek>(EERSTE_KEUZE[positie]);
  const [actief, setActief] = useState<number | null>(null); // de wedstrijd die je aanwijst

  const top = bovengrens(statistiek, Math.max(0, ...wedstrijden.map((w) => w[statistiek])));
  const gespeeld = wedstrijden.filter((w) => w.minuten > 0);
  const totaal = gespeeld.reduce((som, w) => som + w[statistiek], 0);
  const gekozen = actief === null ? null : wedstrijden[actief];

  // Bij veel wedstrijden zetten we niet onder elk staafje een nummer
  const stap = Math.ceil(wedstrijden.length / 12);

  /** Welke wedstrijd ligt onder de muis of de vinger? */
  function wijsAan(event: PointerEvent<HTMLDivElement>) {
    const vak = event.currentTarget.getBoundingClientRect();
    const plaats = (event.clientX - vak.left) / vak.width; // 0 = helemaal links, 1 = helemaal rechts
    setActief(Math.min(wedstrijden.length - 1, Math.max(0, Math.floor(plaats * wedstrijden.length))));
  }

  return (
    <section aria-labelledby="vorm-titel" className="rounded-2xl bg-kaart p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 id="vorm-titel" className="shrink-0 text-[13px] font-semibold text-secundair">
          Per wedstrijd
        </h2>
        <label className="relative -mt-1.5 flex min-w-0 items-center">
          <span className="sr-only">Statistiek</span>
          <select
            value={statistiek}
            onChange={(e) => setStatistiek(e.target.value as Statistiek)}
            className="h-8 w-full appearance-none truncate rounded-full bg-vulling pl-3 pr-7 text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:text-[13px]"
          >
            {KOLOMMEN.map((kolom) => (
              <option key={kolom.sleutel} value={kolom.sleutel}>
                {kolom.uitleg}
              </option>
            ))}
          </select>
          <PijlenOpNeer className="pointer-events-none absolute right-2.5 size-3 text-secundair" />
        </label>
      </div>

      {/* Het grote getal: het seizoenstotaal, of de wedstrijd die je aanwijst */}
      <p className="mt-1 text-[34px] font-bold leading-tight tracking-[-0.025em]" aria-live="polite">
        {gekozen
          ? gekozen.minuten > 0
            ? formatteer(statistiek, gekozen[statistiek], false)
            : "–"
          : formatteer(statistiek, totaal, false)}
      </p>
      <p className="truncate text-[13px] text-secundair">
        {gekozen
          ? `Speeldag ${gekozen.speeldag} · ${gekozen.thuis ? "thuis tegen" : "uit bij"} ${gekozen.tegenstanderNaam} · ${
              gekozen.minuten > 0 ? `${gekozen.minuten} min` : "speelde niet"
            }`
          : `${uitlegVan(statistiek)} dit seizoen, in ${gespeeld.length} ${gespeeld.length === 1 ? "wedstrijd" : "wedstrijden"}`}
      </p>

      <div className="mt-5 flex gap-2">
        <div className="min-w-0 flex-1">
          {/* Het tekenvlak. touch-pan-y: opzij vegen wijst aan, omhoog en omlaag scrolt de pagina. */}
          <div
            className="relative flex h-36 touch-pan-y items-end"
            onPointerDown={wijsAan}
            onPointerMove={wijsAan}
            onPointerLeave={(event) => event.pointerType === "mouse" && setActief(null)}
          >
            {/* Hulplijnen: bovenaan, in het midden en onderaan */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-lijn" />
            <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-lijn" />
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-lijn" />

            {wedstrijden.map((w, index) => (
              <div
                key={w.speeldag + w.aftrap}
                role="img"
                tabIndex={0}
                aria-label={`Speeldag ${w.speeldag}, ${w.thuis ? "thuis tegen" : "uit bij"} ${w.tegenstanderNaam}: ${
                  w.minuten > 0 ? `${formatteer(statistiek, w[statistiek], false)} ${uitlegVan(statistiek).toLowerCase()}` : "speelde niet"
                }`}
                onFocus={() => setActief(index)}
                onBlur={() => setActief(null)}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
              >
                {/* Een zacht vlak achter de wedstrijd die je aanwijst */}
                <span
                  aria-hidden
                  className={`absolute inset-x-px inset-y-0 rounded-md group-focus-visible:ring-2 group-focus-visible:ring-accent/50 ${
                    actief === index ? "bg-vulling" : ""
                  }`}
                />
                {w.minuten > 0 ? (
                  <span
                    aria-hidden
                    style={{ height: `${(w[statistiek] / top) * 100}%` }}
                    // Een staafje is hoogstens 24px breed, boven afgerond en onderaan recht.
                    // min-h-0.5: ook bij 0 zie je dat de speler wel speelde.
                    className={`relative min-h-0.5 w-3/5 max-w-6 rounded-t-[4px] bg-accent transition-[height,opacity] duration-300 ease-out motion-reduce:transition-none ${
                      actief !== null && actief !== index ? "opacity-35" : ""
                    }`}
                  />
                ) : (
                  // Speelde niet: een klein grijs bolletje op de onderlijn
                  <span aria-hidden className="relative mb-[-3px] size-1.5 rounded-full bg-tertiair" />
                )}
              </div>
            ))}
          </div>

          {/* Onder de staafjes: het nummer van de speeldag */}
          <div aria-hidden className="mt-1.5 flex text-center text-[11px] tabular-nums text-secundair">
            {wedstrijden.map((w, index) => (
              <span key={w.speeldag + w.aftrap} className={`flex-1 ${actief === index ? "font-semibold text-primair" : ""}`}>
                {index % stap === 0 || actief === index ? w.speeldag : ""}
              </span>
            ))}
          </div>
        </div>

        {/* De schaal rechts: de waarde van de bovenste, middelste en onderste lijn */}
        <div aria-hidden className="flex h-36 flex-col justify-between text-right text-[11px] tabular-nums leading-none text-secundair">
          <span className="-translate-y-1/2">{formatteer(statistiek, top, false)}</span>
          <span>{formatteer(statistiek, top / 2, false)}</span>
          <span className="translate-y-1/2">0</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-secundair">Elk staafje is één wedstrijd, met onderaan de speeldag. Een bolletje = speelde niet.</p>
    </section>
  );
}
