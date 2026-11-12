import type { Metadata } from "next";
import { SpeeldagOverzicht } from "@/components/speeldag-overzicht";

export const metadata: Metadata = {
  title: "Speeldag",
  description: "De wedstrijden en uitslagen van de huidige Premier League-speeldag.",
};

// /speeldag toont de speeldag die nu bezig is of als volgende komt
export default function SpeeldagPagina() {
  return <SpeeldagOverzicht />;
}
