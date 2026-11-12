import type { Speler } from "@/lib/competitie";
import { Kruisje, Waarschuwing } from "./iconen";

/**
 * Het blessure- of schorsingsnieuws van een speler, op één regel.
 * Oranje = twijfelachtig, rood = hij speelt zeker niet. Toont niets als er geen nieuws is.
 */
export function Nieuws({ speler, className = "" }: { speler: Speler; className?: string }) {
  if (!speler.nieuws) {
    return null;
  }
  const afwezig = speler.beschikbaarheid === "afwezig";
  const Icoon = afwezig ? Kruisje : Waarschuwing;
  return (
    <span
      title={speler.nieuws}
      className={`flex items-center gap-1 ${afwezig ? "text-gevaar" : "text-waarschuwing"} ${className}`}
    >
      <Icoon className="size-[1.1em] shrink-0" />
      <span className="truncate">{speler.nieuws}</span>
    </span>
  );
}

/** Hetzelfde nieuws als een opvallend blok, voor de spelerskaart en het profiel. */
export function NieuwsBlok({ speler, className = "" }: { speler: Speler; className?: string }) {
  if (!speler.nieuws) {
    return null;
  }
  const afwezig = speler.beschikbaarheid === "afwezig";
  const Icoon = afwezig ? Kruisje : Waarschuwing;
  return (
    <p
      className={`flex gap-2.5 rounded-xl px-3.5 py-3 text-[15px] leading-snug ${
        afwezig ? "bg-gevaar-zacht text-gevaar" : "bg-waarschuwing-zacht text-waarschuwing"
      } ${className}`}
    >
      <Icoon className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="font-semibold">{afwezig ? "Niet beschikbaar" : "Twijfelachtig"}</span>
        <span className="block">{speler.nieuws}</span>
      </span>
    </p>
  );
}
