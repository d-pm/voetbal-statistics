import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SpeeldagOverzicht, SpeeldagSkelet } from "@/components/speeldag-overzicht";
import { haalCompetitieOp } from "@/lib/competitie";

// De map heet [nr]: wat op die plek in het adres staat, krijgen we als "nr".
// /speeldag/12 geeft dus nr = "12".

/** Vertelt Next.js welke speeldagen er bestaan, zodat het die pagina's op voorhand kan maken. */
export async function generateStaticParams() {
  const { speeldagen } = await haalCompetitieOp();
  return speeldagen.map((dag) => ({ nr: String(dag.nr) }));
}

export async function generateMetadata({ params }: PageProps<"/speeldag/[nr]">): Promise<Metadata> {
  const { nr } = await params;
  return { title: `Speeldag ${nr}` };
}

export default function SpeeldagPagina({ params }: PageProps<"/speeldag/[nr]">) {
  // Welke speeldag het is, weet Next.js pas als het adres bekend is. Tot dan toont Suspense de grijze blokjes.
  return (
    <Suspense fallback={<SpeeldagSkelet />}>
      <Inhoud params={params} />
    </Suspense>
  );
}

async function Inhoud({ params }: Pick<PageProps<"/speeldag/[nr]">, "params">) {
  const { nr } = await params;
  if (!/^\d{1,2}$/.test(nr)) {
    notFound(); // bv. /speeldag/abc
  }
  return <SpeeldagOverzicht nr={Number(nr)} />;
}
