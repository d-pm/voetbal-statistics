"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { useEffect, useEffectEvent, useRef, useSyncExternalStore, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import type { Positie, Speler } from "@/lib/spelers";
import { KOLOMMEN, POSITIE_NAMEN, formatteer, waarde, type Statistiek } from "@/lib/statistieken";
import { Kruis, Waarschuwing } from "./iconen";
import { lijnErboven } from "./stijl";

// Een veer zoals Apple ze gebruikt: "bounce: 0" = geen overschot, rustig tot stilstand.
const VEER = { type: "spring", bounce: 0, duration: 0.4 } as const;

const GSM = "(max-width: 767px)";

const TEGELS: { sleutel: Statistiek; label: string }[] = [
  { sleutel: "minuten", label: "Minuten" },
  { sleutel: "goals", label: "Goals" },
  { sleutel: "assists", label: "Assists" },
];

type Groep = { titel: string; kolommen: Statistiek[] };
const AANVAL: Groep = { titel: "Aanval", kolommen: ["goals", "assists", "xg", "xa"] };
const VERDEDIGING: Groep = { titel: "Verdediging", kolommen: ["tackles", "recoveries", "cbi", "cleanSheets"] };
const KEEPER: Groep = { titel: "Keeper", kolommen: ["saves"] };

// Wat het belangrijkst is voor een positie, staat bovenaan
const GROEPEN: Record<Positie, Groep[]> = {
  GKP: [KEEPER, VERDEDIGING, AANVAL],
  DEF: [VERDEDIGING, AANVAL],
  MID: [AANVAL, VERDEDIGING],
  FWD: [AANVAL, VERDEDIGING],
};

/**
 * Waar komt een veeg tot stilstand? Dezelfde formule als het uitbollen van het
 * scrollen op een iPhone. Snelheid in pixels per seconde.
 */
function projecteer(snelheid: number, vertraging = 0.998) {
  return ((snelheid / 1000) * vertraging) / (1 - vertraging);
}

function luisterNaarScherm(verandering: () => void) {
  const query = window.matchMedia(GSM);
  query.addEventListener("change", verandering);
  return () => query.removeEventListener("change", verandering);
}

function geenAbonnement() {
  return () => {};
}

/**
 * Laat de cijfers van één speler zien. Op een gsm schuift de kaart van onderen
 * omhoog en veeg je ze weer naar beneden weg. Op een computer verschijnt ze in het midden.
 */
export function SpelerSheet({ speler, onSluit }: { speler: Speler | null; onSluit: () => void }) {
  const gsm = useSyncExternalStore(luisterNaarScherm, () => window.matchMedia(GSM).matches, () => false);
  // Op de server bestaat document.body niet: daar tekenen we niets
  const inDeBrowser = useSyncExternalStore(geenAbonnement, () => true, () => false);
  const minderBeweging = useReducedMotion();
  const sleep = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  const open = speler !== null;
  const sluit = useEffectEvent(onSluit);

  useEffect(() => {
    if (!open) {
      return;
    }
    // De rest van de pagina even uitzetten: niet scrollen, niet klikken, niet tabben
    const vorigeFocus = document.activeElement as HTMLElement | null;
    const rest = document.querySelectorAll("body > :not([data-sheet])");
    rest.forEach((element) => element.setAttribute("inert", ""));
    document.documentElement.style.overflow = "hidden";
    sheetRef.current?.focus({ preventScroll: true });

    function opToets(event: KeyboardEvent) {
      if (event.key === "Escape") {
        sluit();
      }
    }
    document.addEventListener("keydown", opToets);

    return () => {
      document.removeEventListener("keydown", opToets);
      document.documentElement.style.overflow = "";
      rest.forEach((element) => element.removeAttribute("inert"));
      vorigeFocus?.focus({ preventScroll: true });
    };
  }, [open]);

  function naVegen(_event: unknown, info: PanInfo) {
    const hoogte = sheetRef.current?.offsetHeight ?? 0;
    // Kijk waar de veeg naartoe gaat, niet alleen waar je vinger loslaat:
    // een snelle korte veeg sluit de kaart ook.
    if (info.offset.y + projecteer(info.velocity.y) > hoogte / 2) {
      onSluit();
    }
  }

  // Gsm: van onderen omhoog. Computer: zacht groter worden in het midden.
  const beweging = !gsm
    ? { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96 } }
    : minderBeweging
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
      : { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } };

  if (!inDeBrowser) {
    return null;
  }

  return createPortal(
    <div data-sheet>
      <MotionConfig reducedMotion="user" transition={VEER}>
        <AnimatePresence>
          {speler && (
            <motion.div
              key="scrim"
              aria-hidden
              className="fixed inset-0 z-40 bg-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onSluit}
            />
          )}
          {speler && (
            <div
              key="sheet"
              className="pointer-events-none fixed inset-0 z-50 flex items-end md:items-center md:justify-center md:p-6"
            >
              <motion.div
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="speler-naam"
                tabIndex={-1}
                {...beweging}
                drag={gsm ? "y" : false}
                dragListener={false} // alleen slepen aan de bovenkant, de rest kan scrollen
                dragControls={sleep}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.05, bottom: 1 }} // naar boven: veel weerstand, naar beneden: volgt je vinger
                dragTransition={{ bounceStiffness: 440, bounceDamping: 34 }} // Apple: damping 0.8, response 0.3
                onDragEnd={naVegen}
                className="pointer-events-auto flex max-h-[92dvh] w-full flex-col rounded-t-[20px] bg-kaart shadow-[0_-8px_40px_rgb(0_0_0/0.16)] outline-none md:max-h-[min(46rem,88dvh)] md:max-w-md md:rounded-[22px] md:shadow-[0_24px_80px_rgb(0_0_0/0.28)]"
              >
                <SpelerKaart
                  speler={speler}
                  onSluit={onSluit}
                  onVastpakken={gsm ? (event) => sleep.start(event) : undefined}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>,
    document.body,
  );
}

function SpelerKaart({
  speler,
  onSluit,
  onVastpakken,
}: {
  speler: Speler;
  onSluit: () => void;
  onVastpakken?: (event: PointerEvent) => void;
}) {
  return (
    <>
      {/* De kop: hier pak je de kaart vast om ze weg te vegen */}
      <div
        onPointerDown={onVastpakken}
        className={`shrink-0 px-5 pb-4 pt-2 md:pt-5 ${onVastpakken ? "touch-none" : ""}`}
      >
        {onVastpakken && <div aria-hidden className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-tertiair" />}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-accent">{speler.teamNaam}</p>
            <h2 id="speler-naam" className="mt-0.5 text-[28px] font-bold leading-tight tracking-[-0.025em]">
              {speler.naam}
            </h2>
            <p className="mt-0.5 text-[15px] text-secundair">
              {POSITIE_NAMEN[speler.positie]}
              {speler.leeftijd !== null && ` · ${speler.leeftijd} jaar`}
            </p>
          </div>
          <button
            type="button"
            onClick={onSluit}
            onPointerDown={(event) => event.stopPropagation()} // op het kruisje tikken is geen vegen
            aria-label="Sluiten"
            className="grid size-[30px] shrink-0 place-items-center rounded-full bg-vulling text-secundair outline-none transition-opacity active:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <Kruis className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {speler.nieuws && (
          <p className="mb-4 flex gap-2.5 rounded-xl bg-waarschuwing-zacht px-3.5 py-3 text-[15px] leading-snug text-waarschuwing">
            <Waarschuwing className="mt-0.5 size-4 shrink-0" />
            {speler.nieuws}
          </p>
        )}

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
                  <span className="flex-1">{KOLOMMEN.find((k) => k.sleutel === sleutel)?.uitleg}</span>
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
      </div>
    </>
  );
}
