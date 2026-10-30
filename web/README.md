# Website (Next.js)

De website van het spel. Voorlopig is er één pagina: de **scoutingdatabase** met alle Premier League-spelers. Je kunt er filteren op positie, team, leeftijd en minuten, sorteren op elke kolom, en schakelen tussen totalen en cijfers per 90 minuten. Tik op een speler voor een kaart met alle cijfers.

| Bestand | Wat doet het |
|---|---|
| `app/page.tsx` | de scoutingpagina. Draait op de server en haalt de data op. |
| `app/layout.tsx` | wat rond elke pagina staat, zoals de doorschijnende bovenbalk |
| `app/globals.css` | alle kleuren (licht en donker) en de basisopmaak |
| `components/scouting-tabel.tsx` | de filters, de lijst (gsm) en de tabel (tablet en computer). Draait in de browser. |
| `components/speler-sheet.tsx` | de kaart met alle cijfers van één speler. Op een gsm veeg je ze weg. |
| `components/segment-keuze.tsx` | de keuzeknop met vakjes, zoals "Alle / Keepers / ..." |
| `components/iconen.tsx`, `components/stijl.ts` | kleine icoontjes, en stijlen die vaker terugkomen |
| `lib/spelers.ts` | haalt de spelers op en zet ze om |
| `lib/statistieken.ts` | welke cijfers er zijn, hoe ze heten en hoe we ze tonen |

## Starten

Open een terminal in de map `web`. De eerste keer, en telkens als er een nieuw pakket bij is gekomen, installeer je de pakketten:

```powershell
npm install
```

Daarna start je de website, elke keer dat je eraan werkt:

```powershell
npm run dev
```

Open dan http://localhost:3000 in je browser. Als je de code aanpast en opslaat, ververst de pagina vanzelf. Stoppen doe je met **Ctrl+C** in de terminal.

Wil je zien hoe de site op een gsm werkt? Druk in de browser op **F12** en daarna op **Ctrl+Shift+M**.

## Het ontwerp

Het ontwerp volgt de regels die Apple gebruikt voor de iPhone, vertaald naar een website:

- **Kleuren:** alle kleuren staan bovenaan in `app/globals.css`, in een lichte en een donkere versie. De site volgt vanzelf de instelling van je toestel. In de code gebruik je de namen, bv. `bg-kaart` of `text-secundair`, nooit een losse kleurcode.
- **Lettertype:** het systeemlettertype van het toestel (San Francisco op een iPhone of Mac, Segoe UI op Windows). Grote titels krijgen iets minder ruimte tussen de letters, kleine tekst niet.
- **Doorschijnende bovenbalk:** de pagina schuift er wazig onder. Het lijntje eronder verschijnt pas als je scrolt.
- **Meteen reageren:** een knop reageert al zodra je hem indrukt (`active:` in de classes), niet pas als je loslaat.
- **Lijst op een gsm, tabel op een groter scherm:** een gsm is te smal voor twaalf kolommen. Daar toont elke rij het cijfer waarop je sorteert.
- **Spelerskaart met veren:** de kaart volgt je vinger. Laat je los, dan berekent `projecteer()` waar je veeg naartoe ging: een snelle korte veeg sluit de kaart ook. De animaties komen van [Motion](https://motion.dev).
- **Rekening houden met je instellingen:** wie "Minder beweging" aanzet, krijgt rustige overgangen in plaats van schuivende kaarten. Ook "Minder transparantie" en "Meer contrast" werken.

## Waar komt de data vandaan?

Voorlopig haalt `lib/spelers.ts` de data rechtstreeks bij de FPL API. Dat gebeurt alleen op de server, en hoogstens ongeveer één keer per uur (dat regelt `"use cache"`).

Zodra Supabase er is, lezen we hier uit onze eigen database. De rest van de website hoeft daarvoor niet te veranderen.

## Handige commando's

- `npm run lint`: controleert de code op veelgemaakte fouten
- `npm run build`: maakt de versie die online komt. Zo zie je of alles werkt.

## Leren

- React (de bouwstenen van de pagina): [react.dev/learn](https://react.dev/learn)
- Next.js: [nextjs.org/learn](https://nextjs.org/learn)
- Tailwind CSS, de opmaak met classes zoals `text-sm` en `bg-kaart`: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- Motion, voor de animaties: [motion.dev/docs/react](https://motion.dev/docs/react)
- De ontwerpregels van Apple: [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)

## Oefeningen

1. **Tekst aanpassen:** verander de titel of de uitleg bovenaan in `app/page.tsx`, en kijk hoe de pagina meteen verandert.
2. **Andere standaard:** laat de tabel standaard sorteren op goals in plaats van op xG. *(useState in `components/scouting-tabel.tsx`)*
3. **Minder spelers:** zet de standaardwaarde van "Min. minuten" op 450.
4. **Eigen kleur:** maak de accentkleur blauw in plaats van groen. Verander `--accent` in `app/globals.css`, in licht én donker. Tip: Apple gebruikt `#007aff` en `#0a84ff`.
5. **Nieuwe kolom:** voeg G+A (goals + assists) toe. Tip: begin bij het type `Speler` in `lib/spelers.ts`, en voeg daarna een regel toe aan `KOLOMMEN` in `lib/statistieken.ts`.
6. **Uitdaging:** maak een knop "Wis filters" die alle filters terugzet. Zet hem bij "Geen spelers gevonden", daar heb je hem het meest nodig.
