"use client";

import { useEffect, useState } from "react";
import { Delen, Vinkje } from "./iconen";

/**
 * Deelt het adres van deze pagina. Op een gsm opent het deelmenu van de gsm zelf
 * (WhatsApp, berichten, ...). Op een computer wordt de link gekopieerd.
 */
export function DeelKnop() {
  const [gekopieerd, setGekopieerd] = useState(false);

  // "Gekopieerd" verdwijnt na 2 seconden vanzelf
  useEffect(() => {
    if (!gekopieerd) {
      return;
    }
    const wekker = setTimeout(() => setGekopieerd(false), 2000);
    return () => clearTimeout(wekker);
  }, [gekopieerd]);

  async function deel() {
    const adres = window.location.href;
    const aanraakscherm = window.matchMedia("(pointer: coarse)").matches;
    if (aanraakscherm && navigator.share) {
      try {
        await navigator.share({ title: document.title, url: adres });
      } catch {
        // je sloot het deelmenu zonder te kiezen: niets aan de hand
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(adres);
      setGekopieerd(true);
    } catch {
      // kopiëren mocht niet (bv. geen toestemming): dan laten we de knop zoals hij was
    }
  }

  return (
    <button
      type="button"
      onClick={deel}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-kaart px-3.5 text-[15px] font-semibold text-accent outline-none transition-[opacity,transform] duration-100 focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.96] active:opacity-70"
    >
      {gekopieerd ? <Vinkje className="size-4" /> : <Delen className="size-4" />}
      {/* aria-live: een schermlezer zegt het ook als de link gekopieerd is */}
      <span aria-live="polite">{gekopieerd ? "Gekopieerd" : "Deel"}</span>
    </button>
  );
}
