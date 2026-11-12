"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toonDag, toonUur } from "@/lib/datum";
import {
  MIN_OPDRACHTEN_VOOR_RANG,
  SOORTEN,
  bepaalRang,
  eisen,
  maakOpdracht,
  type Context,
  type Kandidaat,
} from "@/lib/spel";
import { Aftellen } from "./aftellen";
import { PijlRechts } from "./iconen";
import { Opdrachtkaart } from "./opdrachtkaart";
import { useCarriere, type Carriere } from "./scout-opslag";
import { hoofdknop, lijnErboven } from "./stijl";

export type Speeldagkeuze = {
  context: Context;
  status: "open" | "bezig" | "afgelopen"; // open = de deadline moet nog komen
};

type Speler = Kandidaat & { naam: string };

/** Je scoutprofiel, de opdracht van de volgende speeldag en de oefenopdrachten. */
export function OpdrachtOverzicht({ speeldagen, spelers }: { speeldagen: Speeldagkeuze[]; spelers: Speler[] }) {
  const carriere = useCarriere();

  if (!carriere) {
    return <Skelet />; // je gegevens staan in de browser: op de server kennen we ze nog niet
  }

  const echt = speeldagen.find((dag) => dag.status === "open");
  const oefeningen = speeldagen.filter((dag) => dag.status !== "open").reverse(); // de recentste eerst

  return (
    <div className="grid gap-8">
      <Scoutprofiel carriere={carriere} />
      {echt && <EchteOpdracht dag={echt} spelers={spelers} carriere={carriere} />}
      <Oefeningen speeldagen={oefeningen} spelers={spelers} carriere={carriere} />
      <p className="px-1 text-xs leading-relaxed text-secundair">
        Je keuzes en je scores worden voorlopig in deze browser bewaard. Op een ander toestel begin je opnieuw, met andere
        opdrachten. Accounts om met vrienden te spelen komen later.
      </p>
    </div>
  );
}

function Scoutprofiel({ carriere }: { carriere: Carriere }) {
  const scores = Object.values(carriere.keuzes)
    .map((keuze) => keuze.scoutscore)
    .filter((score) => score !== undefined);
  const { rang, gemiddelde, volgende, nogNodig } = bepaalRang(scores);

  return (
    <section aria-labelledby="profiel-titel" className="rounded-[22px] bg-kaart p-5">
      <h2 id="profiel-titel" className="text-[13px] font-semibold text-secundair">
        Jouw scoutprofiel
      </h2>
      <div className="mt-1 flex items-end justify-between gap-4">
        <div>
          <p className="text-[28px] font-bold leading-tight tracking-[-0.025em]">{rang.naam}</p>
          <p className="mt-0.5 text-[15px] text-secundair">
            {scores.length} {scores.length === 1 ? "opdracht" : "opdrachten"} beoordeeld
          </p>
        </div>
        <div className="text-right">
          <p className="text-[34px] font-bold leading-none tracking-[-0.025em]">{gemiddelde ?? "–"}</p>
          <p className="mt-1 text-xs text-secundair">gem. scoutscore</p>
        </div>
      </div>

      {/* Hoe ver ben je van de volgende rang? */}
      <div className="mt-4">
        <div
          role="meter"
          aria-label={nogNodig > 0 ? "Opdrachten tot je eerste rang" : "Gemiddelde scoutscore"}
          aria-valuemin={0}
          aria-valuemax={nogNodig > 0 ? MIN_OPDRACHTEN_VOOR_RANG : 100}
          aria-valuenow={nogNodig > 0 ? scores.length : (gemiddelde ?? 0)}
          className="h-2 overflow-hidden rounded-full bg-accent-zacht"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{
              width: `${Math.max(3, nogNodig > 0 ? (scores.length / MIN_OPDRACHTEN_VOOR_RANG) * 100 : (gemiddelde ?? 0))}%`,
            }}
          />
        </div>
        <p className="mt-1.5 text-[13px] text-secundair">
          {nogNodig > 0
            ? `Nog ${nogNodig} ${nogNodig === 1 ? "opdracht" : "opdrachten"} tot je eerste echte rang.`
            : volgende
              ? `${volgende.naam} vanaf een gemiddelde van ${volgende.vanaf}.`
              : "Hoger kan niet. Hou het zo."}
        </p>
      </div>
    </section>
  );
}

function EchteOpdracht({ dag, spelers, carriere }: { dag: Speeldagkeuze; spelers: Speler[]; carriere: Carriere }) {
  const opdracht = useMemo(() => maakOpdracht(carriere.scoutId, dag.context, spelers), [carriere.scoutId, dag, spelers]);
  const keuze = carriere.keuzes[dag.context.speeldag];
  const gekozen = keuze ? spelers.find((s) => s.id === keuze.spelerId) : undefined;

  return (
    <section aria-label="Opdracht voor de volgende speeldag" className="grid gap-3">
      <Opdrachtkaart opdracht={opdracht} label={`Speeldag ${dag.context.speeldag} · jouw opdracht`} />

      <div className="rounded-[22px] bg-kaart p-5">
        <p className="text-[13px] font-semibold text-secundair">Deadline</p>
        <p className="mt-0.5 text-[15px]">
          {toonDag(dag.context.deadline)} om {toonUur(dag.context.deadline)}
        </p>
        <div className="mt-3">
          <Aftellen tot={dag.context.deadline} voorbij="De deadline is voorbij." />
        </div>

        {gekozen ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-vlak px-4 py-3">
            <div className="min-w-0">
              <p className="text-[13px] text-secundair">Jij raadt aan</p>
              <p className="truncate text-[17px] font-semibold">
                {gekozen.naam} <span className="font-normal text-secundair">({gekozen.team})</span>
              </p>
            </div>
            <Link
              href={`/opdracht/${dag.context.speeldag}`}
              className="shrink-0 rounded-lg text-[15px] font-semibold text-accent outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:opacity-50"
            >
              Wijzig
            </Link>
          </div>
        ) : (
          <Link href={`/opdracht/${dag.context.speeldag}`} className={`mt-4 w-full ${hoofdknop}`}>
            Kies je speler
          </Link>
        )}
      </div>
    </section>
  );
}

function Oefeningen({ speeldagen, spelers, carriere }: { speeldagen: Speeldagkeuze[]; spelers: Speler[]; carriere: Carriere }) {
  if (speeldagen.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="oefenen-titel">
      <h2 id="oefenen-titel" className="text-[22px] font-bold tracking-[-0.02em]">
        Oefenen op afgelopen speeldagen
      </h2>
      <p className="mt-1 text-[15px] leading-[1.45] text-secundair">
        Je ziet alleen de cijfers van vóór de speeldag. Kies, en je ziet meteen hoe je keuze het deed.
      </p>
      <ul className="mt-4 overflow-hidden rounded-2xl bg-kaart">
        {speeldagen.map((dag) => (
          <Oefening key={dag.context.speeldag} dag={dag} spelers={spelers} carriere={carriere} />
        ))}
      </ul>
    </section>
  );
}

function Oefening({ dag, spelers, carriere }: { dag: Speeldagkeuze; spelers: Speler[]; carriere: Carriere }) {
  const opdracht = useMemo(() => maakOpdracht(carriere.scoutId, dag.context, spelers), [carriere.scoutId, dag, spelers]);
  const keuze = carriere.keuzes[dag.context.speeldag];
  // Gekozen vóór de deadline? Dan was het een echte opdracht, geen oefening.
  const echt = keuze !== undefined && keuze.gekozenOp < dag.context.deadline;

  return (
    <li className={lijnErboven}>
      <Link
        href={`/opdracht/${dag.context.speeldag}`}
        className="flex items-center gap-3 py-3 pl-4 pr-3 outline-none transition-colors hover:bg-kaart-hover focus-visible:bg-kaart-hover active:bg-kaart-druk"
      >
        <span className="w-9 shrink-0 text-center">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-secundair">Sd</span>
          <span className="block text-[20px] font-bold leading-tight tabular-nums">{dag.context.speeldag}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold tracking-[-0.022em]">{SOORTEN[opdracht.soort].titel}</span>
          <span className="block truncate text-[13px] text-secundair">
            {eisen(opdracht).join(" · ")}
            {echt && " · echte opdracht"}
            {dag.status === "bezig" && " · speeldag bezig"}
          </span>
        </span>
        {keuze?.scoutscore !== undefined ? (
          <span className="shrink-0 text-right">
            <span className="block text-[20px] font-bold leading-tight tabular-nums">{keuze.scoutscore}</span>
            <span className="block text-[11px] text-secundair">scoutscore</span>
          </span>
        ) : (
          <span className="shrink-0 text-[15px] font-semibold text-accent">{keuze ? "Uitslag" : "Speel"}</span>
        )}
        <PijlRechts className="size-3.5 shrink-0 text-tertiair" />
      </Link>
    </li>
  );
}

function Skelet() {
  return (
    <div aria-busy="true" aria-label="Je opdrachten worden geladen" className="grid gap-8">
      <div className="skelet h-40 rounded-[22px]" />
      <div className="skelet h-56 rounded-[22px]" />
      <div className="skelet h-72 rounded-2xl" />
    </div>
  );
}
