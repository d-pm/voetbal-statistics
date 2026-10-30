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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          Premier League {seizoen}
          {speeldag !== null && ` · speeldag ${speeldag}`}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Scoutingdatabase
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Zoek spelers die passen bij de opdracht van je club. Filter op positie, team en leeftijd, en klik op een
          kolom om te sorteren. Met &quot;Per 90 min&quot; vergelijk je spelers eerlijk, ook als ze minder speelden.
        </p>
      </header>

      <ScoutingTabel spelers={spelers} />

      <footer className="mt-10 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
        Data: Fantasy Premier League · bijgewerkt op {datumEnTijd.format(new Date(bijgewerktOp))}
      </footer>
    </main>
  );
}
