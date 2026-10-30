import { ScoutingTabel } from "@/components/scouting-tabel";
import { haalSpelersOp } from "@/lib/spelers";

const datumEnTijd = new Intl.DateTimeFormat("nl-BE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Brussels",
});

// Deze pagina draait op de server: ze haalt de data op en geeft die door aan de tabel.
export default async function ScoutingPagina() {
  const { spelers, seizoen, speeldag, bijgewerktOp } = await haalSpelersOp();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-12">
      <header className="mb-6 sm:mb-8">
        <p className="text-[13px] font-semibold text-accent sm:text-[15px]">
          Premier League {seizoen}
          {speeldag !== null && ` · Speeldag ${speeldag}`}
        </p>
        <h1 className="mt-1 text-[34px] font-bold leading-[1.1] tracking-[-0.025em] sm:text-5xl sm:tracking-[-0.03em]">
          Scoutingdatabase
        </h1>
        <p className="mt-3 max-w-2xl text-[17px] leading-[1.45] text-secundair">
          Zoek spelers die passen bij de opdracht van je club. Met Per 90 vergelijk je eerlijk, ook als iemand minder
          speelde. Tik op een speler voor alle cijfers.
        </p>
      </header>

      <ScoutingTabel spelers={spelers} />

      <footer className="mt-12 text-xs text-secundair">
        Data: Fantasy Premier League · bijgewerkt op {datumEnTijd.format(new Date(bijgewerktOp))}
      </footer>
    </main>
  );
}
