// Stijlen die op meerdere plekken terugkomen.

/**
 * Dun lijntje boven elke rij behalve de eerste, met wat ruimte links:
 * zoals in de lijsten van een iPhone. Zet dit op een <li>.
 */
export const lijnErboven =
  "relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-4 not-first:before:h-px not-first:before:bg-lijn";

/** Kleine kop boven een blok, zoals boven een lijst in de Instellingen van een iPhone. */
export const blokTitel = "px-4 pb-1.5 text-[13px] font-semibold text-secundair";

/** De groene hoofdknop. Reageert al terwijl je hem indrukt. */
export const hoofdknop =
  "inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-accent px-6 text-[17px] font-semibold text-op-accent outline-none transition-[opacity,transform] duration-100 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-grond active:scale-[0.97] active:opacity-80";

/** Een link in de accentkleur. */
export const tekstlink =
  "rounded font-semibold text-accent outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-accent/50 active:opacity-50";
