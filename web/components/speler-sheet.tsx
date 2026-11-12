"use client";

import Link from "next/link";
import type { Speler } from "@/lib/competitie";
import { GROEPEN, POSITIE_NAMEN, formatteer, uitlegVan, waarde, type Statistiek } from "@/lib/statistieken";
import { PijlRechts } from "./iconen";
import { NieuwsBlok } from "./nieuws";
import { Sheet } from "./sheet";
import { lijnErboven } from "./stijl";

const TEGELS: { sleutel: Statistiek; label: string }[] = [
  { sleutel: "minuten", label: "Minuten" },
  { sleutel: "goals", label: "Goals" },
  { sleutel: "assists", label: "Assists" },
];

/** De kaart met de cijfers van één speler. Ze is open zolang "speler" niet null is. */
export function SpelerSheet({ speler, onSluit }: { speler: Speler | null; onSluit: () => void }) {
  return (
    <Sheet
      open={speler !== null}
      onSluit={onSluit}
      titelId="speler-naam"
      kop={
        speler && (
          <>
            <p className="text-[13px] font-semibold text-accent">{speler.teamNaam}</p>
            <h2 id="speler-naam" className="mt-0.5 text-[28px] font-bold leading-tight tracking-[-0.025em]">
              {speler.naam}
            </h2>
            <p className="mt-0.5 text-[15px] text-secundair">
              {POSITIE_NAMEN[speler.positie]}
              {speler.leeftijd !== null && ` · ${speler.leeftijd} jaar`}
            </p>
          </>
        )
      }
    >
      {speler && <Cijfers speler={speler} onSluit={onSluit} />}
    </Sheet>
  );
}

function Cijfers({ speler, onSluit }: { speler: Speler; onSluit: () => void }) {
  return (
    <>
      <NieuwsBlok speler={speler} className="mb-4" />

      <dl className="grid grid-cols-3 gap-2">
        {TEGELS.map((tegel) => (
          <div key={tegel.sleutel} className="rounded-xl bg-vlak px-3 py-2.5">
            <dt className="text-xs text-secundair">{tegel.label}</dt>
            <dd className="text-[22px] font-bold tabular-nums tracking-[-0.02em]">
              {formatteer(tegel.sleutel, speler[tegel.sleutel], false)}
            </dd>
          </div>
        ))}
      </dl>

      {GROEPEN[speler.positie].map((groep) => (
        <section key={groep.titel} className="mt-6">
          <div className="flex items-baseline px-4 pb-1.5 text-[13px] text-secundair">
            <h3 className="flex-1 font-semibold">{groep.titel}</h3>
            <span className="w-16 text-right">Totaal</span>
            <span className="w-16 text-right">Per 90</span>
          </div>
          <ul className="rounded-xl bg-vlak">
            {groep.kolommen.map((sleutel) => (
              <li key={sleutel} className={`flex min-h-11 items-center px-4 py-2.5 text-[15px] leading-snug ${lijnErboven}`}>
                <span className="flex-1">{uitlegVan(sleutel)}</span>
                <span className="w-16 text-right font-semibold tabular-nums">
                  {formatteer(sleutel, speler[sleutel], false)}
                </span>
                <span className="w-16 text-right tabular-nums text-secundair">
                  {formatteer(sleutel, waarde(speler, sleutel, true), true)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-4 px-4 text-xs text-secundair">Per 90 = gemiddeld per 90 gespeelde minuten, één volle wedstrijd.</p>

      {/* onClick sluit de kaart, zodat ze niet meer openstaat als je later terugkomt */}
      <Link
        href={`/spelers/${speler.id}`}
        onClick={onSluit}
        className="mt-5 flex h-12 items-center justify-center gap-1.5 rounded-xl bg-accent text-[17px] font-semibold text-op-accent outline-none transition-[opacity,transform] duration-100 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-kaart active:scale-[0.98] active:opacity-80"
      >
        Volledig profiel
        <PijlRechts className="size-4" />
      </Link>
      <p className="mt-2 text-center text-xs text-secundair">Met de cijfers per wedstrijd en de volgende tegenstanders.</p>
    </>
  );
}
