"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { leesFilters, schrijfFilters, type Filters } from "@/lib/filters";

/**
 * Houdt de filters bij én zet ze in het adres van de pagina (de URL).
 * Zo kun je een zoekopdracht delen, en werkt een link als /spelers?positie=DEF.
 *
 * Je gebruikt het zoals useState:  const [filters, wijzig] = useUrlFilters();
 * Met wijzig({ positie: "DEF" }) verander je één of meer filters.
 *
 * Het derde wat je terugkrijgt is een teller. Die gaat omhoog telkens als de filters
 * van buitenaf veranderen, bv. als je op een link naar een andere zoekopdracht klikt.
 */
export function useUrlFilters(): [Filters, (wijziging: Partial<Filters>) => void, number] {
  const zoek = useSearchParams().toString(); // wat er nu na het vraagteken in de URL staat
  const [filters, setFilters] = useState(() => leesFilters(zoek));

  // Verandert de URL van buitenaf (een link, of de terugknop van de browser)?
  // Dan nemen we de filters uit de URL over. Dit is het patroon van React om
  // "state aan te passen als een prop verandert", zonder useEffect.
  const [vorigeZoek, setVorigeZoek] = useState(zoek);
  const [vanBuitenaf, setVanBuitenaf] = useState(0);
  if (zoek !== vorigeZoek) {
    setVorigeZoek(zoek);
    const uitUrl = leesFilters(zoek);
    if (schrijfFilters(uitUrl) !== schrijfFilters(filters)) {
      setFilters(uitUrl);
      setVanBuitenaf(vanBuitenaf + 1);
    }
  }

  // Veranderen de filters? Dan werken we de URL bij, een kwart seconde nadat je
  // gestopt bent. Zo schrijven we niet bij elke toetsaanslag.
  const tekst = schrijfFilters(filters);
  useEffect(() => {
    const wekker = setTimeout(() => {
      const huidig = schrijfFilters(leesFilters(window.location.search));
      if (tekst !== huidig) {
        // replaceState verandert de URL zonder de pagina opnieuw te laden
        window.history.replaceState(null, "", tekst ? `?${tekst}` : window.location.pathname);
      }
    }, 250);
    return () => clearTimeout(wekker);
  }, [tekst]);

  function wijzig(wijziging: Partial<Filters>) {
    setFilters((huidig) => ({ ...huidig, ...wijziging }));
  }

  return [filters, wijzig, vanBuitenaf];
}
