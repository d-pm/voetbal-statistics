# Website (Next.js)

De website van het spel. Voorlopig is er één pagina: de **scoutingdatabase** met alle Premier League-spelers. Je kunt er filteren op positie, team, leeftijd en minuten, sorteren op elke kolom, en schakelen tussen totalen en cijfers per 90 minuten.

| Bestand | Wat doet het |
|---|---|
| `app/page.tsx` | de scoutingpagina. Draait op de server en haalt de data op. |
| `app/layout.tsx` | wat rond elke pagina staat, zoals de bovenbalk |
| `components/scouting-tabel.tsx` | de tabel met filters en sorteren. Draait in de browser. |
| `lib/spelers.ts` | haalt de spelers op en zet ze om |

## Starten

Open een terminal in de map `web`. De eerste keer installeer je de pakketten:

```powershell
npm install
```

Daarna start je de website, elke keer dat je eraan werkt:

```powershell
npm run dev
```

Open dan http://localhost:3000 in je browser. Als je de code aanpast en opslaat, ververst de pagina vanzelf. Stoppen doe je met **Ctrl+C** in de terminal.

## Waar komt de data vandaan?

Voorlopig haalt `lib/spelers.ts` de data rechtstreeks bij de FPL API. Dat gebeurt alleen op de server, en hoogstens ongeveer één keer per uur (dat regelt `"use cache"`).

Zodra Supabase er is, lezen we hier uit onze eigen database. De rest van de website hoeft daarvoor niet te veranderen.

## Handige commando's

- `npm run lint`: controleert de code op veelgemaakte fouten
- `npm run build`: maakt de versie die online komt. Zo zie je of alles werkt.

## Leren

- React (de bouwstenen van de pagina): [react.dev/learn](https://react.dev/learn)
- Next.js: [nextjs.org/learn](https://nextjs.org/learn)
- Tailwind CSS, de opmaak met classes zoals `text-sm` en `bg-white`: [tailwindcss.com/docs](https://tailwindcss.com/docs)

## Oefeningen

1. **Tekst aanpassen:** verander de titel of de uitleg bovenaan in `app/page.tsx`, en kijk hoe de pagina meteen verandert.
2. **Andere standaard:** laat de tabel standaard sorteren op goals in plaats van op xG. *(useState in `scouting-tabel.tsx`)*
3. **Minder spelers:** zet de standaardwaarde van "Min. minuten" op 450.
4. **Nieuwe kolom:** voeg G+A (goals + assists) toe. Tip: begin bij het type `Speler` in `lib/spelers.ts`, en voeg daarna een regel toe aan `KOLOMMEN`.
5. **Uitdaging:** maak een knop "Wis filters" die alle filters terugzet.
