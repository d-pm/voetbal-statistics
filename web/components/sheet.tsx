"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { useEffect, useEffectEvent, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Kruis } from "./iconen";

// Een veer zoals Apple ze gebruikt: "bounce: 0" = geen overschot, rustig tot stilstand.
const VEER = { type: "spring", bounce: 0, duration: 0.4 } as const;

const GSM = "(max-width: 767px)";

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

/** Is het scherm zo smal als een gsm? Op de server weten we dat niet: dan "nee". */
export function useIsGsm() {
  return useSyncExternalStore(luisterNaarScherm, () => window.matchMedia(GSM).matches, () => false);
}

/**
 * Een kaart die boven de pagina verschijnt, zoals een "sheet" op een iPhone.
 * Op een gsm schuift ze van onderen omhoog en veeg je ze aan de bovenkant weer weg.
 * Op een computer verschijnt ze in het midden. Esc of naast de kaart klikken sluit ze ook.
 *
 * - kop: wat bovenaan staat, naast de sluitknop. Geef de titel daarin het id "titelId".
 * - sluitTekst: een woord als "Klaar" in plaats van een kruisje
 * - children: de inhoud. Die kan scrollen als ze niet past.
 */
export function Sheet({
  open,
  onSluit,
  titelId,
  kop,
  sluitTekst,
  children,
}: {
  open: boolean;
  onSluit: () => void;
  titelId: string;
  kop: ReactNode;
  sluitTekst?: string;
  children: ReactNode;
}) {
  const gsm = useIsGsm();
  // Op de server bestaat document.body niet: daar tekenen we niets
  const inDeBrowser = useSyncExternalStore(geenAbonnement, () => true, () => false);
  const minderBeweging = useReducedMotion();
  const sleep = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
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
          {open && (
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
          {open && (
            <div
              key="sheet"
              className="pointer-events-none fixed inset-0 z-50 flex items-end md:items-center md:justify-center md:p-6"
            >
              <motion.div
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titelId}
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
                {/* De kop: hier pak je de kaart vast om ze weg te vegen */}
                <div
                  onPointerDown={gsm ? (event) => sleep.start(event) : undefined}
                  className={`shrink-0 px-5 pb-4 pt-2 md:pt-5 ${gsm ? "touch-none" : ""}`}
                >
                  {gsm && <div aria-hidden className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-tertiair" />}
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">{kop}</div>
                    <button
                      type="button"
                      onClick={onSluit}
                      onPointerDown={(event) => event.stopPropagation()} // op de knop tikken is geen vegen
                      aria-label={sluitTekst ? undefined : "Sluiten"}
                      className={
                        sluitTekst
                          ? "-mr-1 shrink-0 rounded-lg px-1 py-0.5 text-[17px] font-semibold text-accent outline-none transition-opacity active:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/50"
                          : "grid size-[30px] shrink-0 place-items-center rounded-full bg-vulling text-secundair outline-none transition-opacity active:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/50"
                      }
                    >
                      {sluitTekst ?? <Kruis className="size-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  {children}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>,
    document.body,
  );
}
