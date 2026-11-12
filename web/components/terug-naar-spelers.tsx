"use client";

import Link from "next/link";
import { PijlLinks } from "./iconen";
import { useLaatsteZoekopdracht } from "./laatste-zoekopdracht";
import { tekstlink } from "./stijl";

/** "‹ Spelers": terug naar de lijst, met de filters die je had ingesteld. */
export function TerugNaarSpelers() {
  return (
    <Link
      href={useLaatsteZoekopdracht()}
      className={`-ml-1 inline-flex items-center gap-0.5 py-1 text-[17px] font-normal ${tekstlink}`}
    >
      <PijlLinks className="size-4" />
      Spelers
    </Link>
  );
}
