import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OpdrachtSpel } from "@/components/opdracht-spel";
import { haalCompetitieOp } from "@/lib/competitie";
import { haalSpeeldagspelOp } from "@/lib/speeldagspel";

// /opdracht/11 = je opdracht voor speeldag 11. De map heet [nr]: wat op die plek staat, krijgen we als "nr".

/**
 * De speeldagen waarvoor je een opdracht kunt spelen: de volgende (de echte opdracht)
 * en de speeldagen die al begonnen zijn (om op te oefenen).
 */
async function speelbareSpeeldagen() {
  const competitie = await haalCompetitieOp();
  const huidige = competitie.huidigeSpeeldag ?? 0;
  const laatste = competitie.volgendeSpeeldag ?? huidige;
  const alle = competitie.speeldagen.filter((dag) => dag.nr >= 2 && dag.nr <= laatste).map((dag) => dag.nr);
  return { alle, oefenbaar: alle.filter((nr) => nr <= huidige) };
}

export async function generateStaticParams() {
  return (await speelbareSpeeldagen()).alle.map((nr) => ({ nr: String(nr) }));
}

export async function generateMetadata({ params }: PageProps<"/opdracht/[nr]">): Promise<Metadata> {
  const { nr } = await params;
  return { title: `Opdracht speeldag ${nr}` };
}

export default function OpdrachtSpeeldagPagina({ params }: PageProps<"/opdracht/[nr]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4 sm:px-6 sm:pt-8">
      <Suspense fallback={<Skelet />}>
        <Inhoud params={params} />
      </Suspense>
    </main>
  );
}

async function Inhoud({ params }: Pick<PageProps<"/opdracht/[nr]">, "params">) {
  const { nr } = await params;
  const { alle, oefenbaar } = await speelbareSpeeldagen();
  if (!/^\d{1,2}$/.test(nr) || !alle.includes(Number(nr))) {
    notFound();
  }
  const spel = await haalSpeeldagspelOp(Number(nr));
  if (!spel) {
    notFound();
  }
  return <OpdrachtSpel spel={spel} oefenbaar={oefenbaar} />;
}

function Skelet() {
  return (
    <div aria-busy="true" aria-label="De opdracht wordt geladen">
      <div className="skelet mt-4 h-5 w-32" />
      <div className="skelet mt-3 h-11 w-64 max-w-full" />
      <div className="skelet mt-6 h-48 rounded-[22px]" />
      <div className="skelet mt-6 h-96 rounded-2xl" />
    </div>
  );
}
