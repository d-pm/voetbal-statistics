"use client";

import { useSyncExternalStore } from "react";

// De klok van de bezoeker, in hele minuten. useSyncExternalStore laat React opnieuw
// tekenen telkens als de minuut verandert. Op de server kennen we de klok van de
// bezoeker niet: daar is het antwoord null en tonen we streepjes.
function elkeHalveMinuut(seintje: () => void) {
  const wekker = setInterval(seintje, 30_000);
  return () => clearInterval(wekker);
}
const minutenNu = () => Math.floor(Date.now() / 60_000);
const opDeServer = () => null;

/** Telt af naar een tijdstip: "8 dagen 23 uur 12 min". */
export function Aftellen({ tot, voorbij }: { tot: string; voorbij: string }) {
  const nu = useSyncExternalStore(elkeHalveMinuut, minutenNu, opDeServer);
  const rest = nu === null ? null : Math.floor(new Date(tot).getTime() / 60_000) - nu;

  if (rest !== null && rest <= 0) {
    return <p className="text-[17px] font-semibold">{voorbij}</p>;
  }

  const delen = [
    { getal: rest === null ? null : Math.floor(rest / 1440), label: "dagen" },
    { getal: rest === null ? null : Math.floor((rest % 1440) / 60), label: "uur" },
    { getal: rest === null ? null : rest % 60, label: "min" },
  ];

  return (
    <dl className="grid grid-cols-3 gap-2">
      {delen.map((deel) => (
        <div key={deel.label} className="rounded-xl bg-vlak px-3 py-2.5">
          {/* De cijfers staan boven hun label, maar een schermlezer leest eerst het label */}
          <dt className="sr-only">{deel.label}</dt>
          <dd className="text-[28px] font-bold leading-none tracking-[-0.02em]">{deel.getal ?? "–"}</dd>
          <dd aria-hidden className="mt-1 text-xs text-secundair">
            {deel.label}
          </dd>
        </div>
      ))}
    </dl>
  );
}
