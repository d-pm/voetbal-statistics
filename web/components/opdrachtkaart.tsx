import { SOORTEN, eisen, puntenregel, type Opdracht } from "@/lib/spel";

/** De opdracht van de club: wat ze zoeken, de eisen en hoe je punten verdient. */
export function Opdrachtkaart({ opdracht, label }: { opdracht: Opdracht; label: string }) {
  const soort = SOORTEN[opdracht.soort];
  return (
    <section aria-labelledby={`opdracht-${opdracht.speeldag}`} className="rounded-[22px] bg-kaart p-5">
      <p className="text-[13px] font-semibold text-accent">{label}</p>
      <h2 id={`opdracht-${opdracht.speeldag}`} className="mt-0.5 text-[22px] font-bold leading-tight tracking-[-0.02em]">
        {soort.titel}
      </h2>
      <p className="mt-1.5 text-[15px] leading-[1.45] text-secundair">
        “{soort.wens}
        {opdracht.geenTopclub && " Een speler van een topclub kunnen we niet betalen."}”
      </p>
      <ul aria-label="Eisen" className="mt-3 flex flex-wrap gap-1.5">
        {eisen(opdracht).map((eis) => (
          <li key={eis} className="rounded-full bg-accent-zacht px-2.5 py-1 text-[13px] font-semibold text-accent">
            {eis}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-secundair">
        <span className="font-semibold text-primair">Punten:</span> {puntenregel(opdracht.soort)}
      </p>
    </section>
  );
}
