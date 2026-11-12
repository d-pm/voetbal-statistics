"use client"; // een foutpagina moet in de browser draaien

import { useEffect } from "react";
import { hoofdknop } from "@/components/stijl";

// Deze pagina zie je als er iets misloopt bij het maken van een pagina,
// bijvoorbeeld als de FPL API even niet antwoordt.
export default function Foutpagina({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error); // zo vind je de fout terug in de console van de browser
  }, [error]);

  return (
    <main className="mx-auto grid w-full max-w-md flex-1 place-items-center px-6 py-16 text-center">
      <div>
        <p className="text-[13px] font-semibold text-waarschuwing">Even geen verbinding</p>
        <h1 className="mt-1 text-[34px] font-bold leading-[1.1] tracking-[-0.025em]">De cijfers laden niet</h1>
        <p className="mt-3 text-[17px] leading-[1.45] text-secundair">
          We krijgen de voetbaldata nu niet te pakken. Meestal is dat na een paar seconden opgelost.
        </p>
        <button type="button" onClick={() => retry()} className={`mt-6 ${hoofdknop}`}>
          Probeer opnieuw
        </button>
      </div>
    </main>
  );
}
