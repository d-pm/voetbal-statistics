# Website (Next.js)

De website van het spel. Dit zijn de pagina's:

| Adres | Wat zie je |
|---|---|
| `/` | de startpagina: de volgende deadline, snelle zoekopdrachten en uitleg over het spel |
| `/opdracht` | **het spel**: je scoutprofiel, je eigen opdracht voor de volgende speeldag, en oefenopdrachten op afgelopen speeldagen |
| `/opdracht/11` | één opdracht spelen: een speler kiezen en je beoordeling zien |
| `/spelers` | de **scoutingdatabase**: alle Premier League-spelers, met filters en sorteren |
| `/spelers/223094` | het **profiel** van één speler: cijfers per wedstrijd, een grafiek en een vergelijking met spelers op dezelfde positie |
| `/speeldag` en `/speeldag/12` | de wedstrijden en uitslagen van een speeldag |

## Het spel

1. **Elke scout krijgt een eigen opdracht.** Bij je eerste bezoek krijg je een eigen scoutnummer. Daarmee gooit `maakOpdracht()` in `lib/spel.ts` de dobbelsteen: welke soort speler de club zoekt, en of er een leeftijdsgrens is of de club geen speler van een topclub kan betalen. Twee vrienden krijgen dus meestal een andere opdracht, maar jij krijgt voor dezelfde speeldag altijd dezelfde. Je krijgt nooit twee keer na elkaar dezelfde soort.
2. **Je raadt één speler aan** vóór de deadline. Tot dan kun je je keuze nog wijzigen.
3. **Je keuze wordt beoordeeld** na de speeldag, door `beoordeel()`. Je speler krijgt punten volgens de regels van de opdracht (dezelfde als in `data/puntentelling.py`). Daarna vergelijken we met álle spelers die bij de opdracht pasten: **scoutscore 80** betekent dat je keuze het beter deed dan 80% van hen. Zo kun je verschillende opdrachten eerlijk vergelijken. Speelde je speler niet, dan is je score 0.
4. **Je rang** (Stagiair, Jeugdscout, Scout, Hoofdscout, Technisch directeur) hangt af van je gemiddelde scoutscore, vanaf 3 opdrachten.

**Oefenen:** op een afgelopen speeldag zie je alleen de cijfers van vóór die speeldag (`lib/speeldagspel.ts` telt de speeldagen ervoor op). Je keuze is meteen definitief, en je ziet meteen je score.

**Waar wordt dit bewaard?** Voorlopig in je browser (`components/scout-opslag.ts`, met localStorage). Op een ander toestel begin je dus opnieuw. Een ranglijst met vrienden en een account dat je overal meeneemt, komen er met Supabase. Dan verhuizen de keuzes naar de database, en controleert de database ook de deadline.

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

## Wat staat waar

**`app/`: de pagina's.** Elke map is een stuk van het adres, en `page.tsx` is de pagina zelf.

| Bestand | Wat doet het |
|---|---|
| `app/layout.tsx` | wat rond elke pagina staat: de navigatie |
| `app/page.tsx` | de startpagina |
| `app/opdracht/page.tsx`, `app/opdracht/[nr]/page.tsx` | het overzicht van je opdrachten, en één opdracht spelen |
| `app/icon.svg`, `app/apple-icon.tsx`, `app/opengraph-image.tsx` | het logo als icoon in je browser, op je iPhone-beginscherm, en de afbeelding als je een link deelt |
| `app/spelers/page.tsx` | de scoutingdatabase |
| `app/spelers/[id]/page.tsx` | het spelersprofiel. `[id]` is de plek in het adres waar de code van de speler staat. |
| `app/speeldag/page.tsx`, `app/speeldag/[nr]/page.tsx` | de speeldag van nu, en een speeldag naar keuze |
| `app/error.tsx`, `app/not-found.tsx` | wat je ziet als er iets misloopt, of als een pagina niet bestaat |
| `app/globals.css` | alle kleuren (licht en donker) en de basisopmaak |

**`lib/`: de data en de rekenregels.** Geen opmaak, alleen gegevens.

| Bestand | Wat doet het |
|---|---|
| `lib/fpl.ts` | de enige plek die met de FPL API praat |
| `lib/competitie.ts` | spelers, teams en speeldagen ophalen en omzetten naar onze eigen vorm |
| `lib/wedstrijden.ts` | alle wedstrijden van het seizoen |
| `lib/profiel.ts` | alles voor het profiel van één speler |
| `lib/statistieken.ts` | welke cijfers er zijn, hoe ze heten, en het vergelijken met andere spelers |
| `lib/filters.ts` | de filters van de scoutingdatabase, en hoe ze in de URL staan |
| `lib/spel.ts` | **de spelregels**: de soorten opdrachten, je opdracht maken, punten tellen en je keuze beoordelen |
| `lib/speeldagspel.ts` | de cijfers van vóór een speeldag, en de uitslag ervan |
| `lib/stand.ts` | de stand van de competitie, uitgerekend uit de uitslagen (voor de topclubs) |
| `lib/opdrachten.ts` | de snelle zoekopdrachten op de startpagina |
| `lib/datum.ts` | datums en uren tonen in het Nederlands en in Belgische tijd |

**`components/`: de bouwstenen van de pagina's.**

| Bestand | Wat doet het |
|---|---|
| `navigatie.tsx` | de bovenbalk, en op een gsm de tabbalk onderaan |
| `logo.tsx` | het logo: een vergrootglas met de middencirkel van een voetbalveld |
| `opdracht-overzicht.tsx` | je scoutprofiel, je echte opdracht en de lijst met oefeningen |
| `opdracht-spel.tsx` | één opdracht: kiezen, wachten en je beoordeling |
| `opdrachtkaart.tsx` | de kaart met wat de club zoekt en hoe je punten verdient |
| `scout-opslag.ts` | bewaart je scoutnummer, je keuzes en je scores in de browser |
| `klok.ts` | de klok van de bezoeker, om te weten of een deadline voorbij is |
| `scouting-tabel.tsx` | de filters, de lijst (gsm) en de tabel (tablet en computer) |
| `gebruik-url-filters.ts` | houdt de filters bij en zet ze in de URL |
| `laatste-zoekopdracht.ts`, `terug-naar-spelers.tsx` | onthouden je laatste zoekopdracht, zodat "‹ Spelers" en de tab je daar terugbrengen |
| `deel-knop.tsx` | deelt de link naar je zoekopdracht |
| `sheet.tsx` | een kaart die boven de pagina verschijnt. Op een gsm veeg je ze weg. |
| `speler-sheet.tsx` | die kaart met de cijfers van één speler |
| `vorm-grafiek.tsx` | de grafiek per wedstrijd op het spelersprofiel |
| `speeldag-overzicht.tsx` | de wedstrijden van een speeldag |
| `aftellen.tsx` | de klok die aftelt naar de deadline |
| `segment-keuze.tsx`, `schakelaar.tsx`, `nieuws.tsx`, `iconen.tsx`, `stijl.ts` | kleine bouwstenen: keuzeknop, aan/uit-schakelaar, blessurenieuws, icoontjes en gedeelde stijlen |

Bovenaan sommige bestanden staat `"use client"`. Dat bestand draait dan (ook) in de browser, omdat het reageert op klikken of typen. Al de rest draait alleen op de server.

## Waar komt de data vandaan?

Voorlopig haalt `lib/` de data rechtstreeks bij de FPL API. Dat gebeurt alleen op de server, en hoogstens ongeveer één keer per uur. Dat regelen `"use cache"` en `cacheLife("hours")` in elke functie die data ophaalt.

- Spelers die de competitie verlieten (verkocht of uitgeleend) tonen we niet.
- Het profiel van een speler wordt pas opgehaald als iemand het opent, en daarna een uur bewaard.
- Lukt het ophalen niet, dan zie je de foutpagina uit `app/error.tsx` met een knop om het opnieuw te proberen.

Zodra Supabase er is, lezen we in `lib/` uit onze eigen database. De pagina's en de bouwstenen hoeven daarvoor niet te veranderen.

## De filters staan in de URL

Kies je in de scoutingdatabase een positie of een leeftijd, dan verandert het adres mee:

```
/spelers?positie=DEF&leeftijd=23&per90=1&sorteer=tackles
```

Zo kun je een zoekopdracht doorsturen of als bladwijzer bewaren. De oefenopdrachten op de startpagina zijn gewoon zulke links. Welke namen er in de URL mogen staan, lees je in `lib/filters.ts`.

## Het ontwerp

Het ontwerp volgt de regels die Apple gebruikt voor de iPhone, vertaald naar een website:

- **Kleuren:** alle kleuren staan bovenaan in `app/globals.css`, in een lichte en een donkere versie. De site volgt vanzelf de instelling van je toestel. In de code gebruik je de namen, bv. `bg-kaart` of `text-secundair`, nooit een losse kleurcode.
- **Lettertype:** het systeemlettertype van het toestel (San Francisco op een iPhone of Mac, Segoe UI op Windows). Grote titels krijgen iets minder ruimte tussen de letters, kleine tekst niet.
- **Navigatie:** bovenaan een doorschijnende balk waar de pagina wazig onderdoor schuift. Op een gsm staan de tabs onderaan, waar je duim zit.
- **Meteen reageren:** een knop reageert al zodra je hem indrukt (`active:` in de classes), niet pas als je loslaat.
- **Lijst op een gsm, tabel op een groter scherm:** een gsm is te smal voor twaalf kolommen. Daar toont elke rij het cijfer waarop je sorteert.
- **Het belangrijkste eerst:** op een gsm zitten team, leeftijd, minuten en beschikbaarheid achter de knop "Filters". Een bolletje toont hoeveel er aanstaan, en de knop onderaan zegt hoeveel spelers je overhoudt terwijl je kiest.
- **Je weet altijd waar je bent en hoe je terugkomt:** "‹ Spelers" en de tab Spelers brengen je terug naar je eigen zoekopdracht, niet naar een lege lijst.
- **Waarschuwen voor het misgaat:** zet je Per 90 aan met minder dan 270 minuten, dan zegt de site dat die cijfers weinig betekenen, met een knop om het recht te zetten.
- **Spelerskaart met veren:** de kaart volgt je vinger. Laat je los, dan berekent `projecteer()` waar je veeg naartoe ging: een snelle korte veeg sluit de kaart ook. De animaties komen van [Motion](https://motion.dev).
- **Grafiek die je aanwijst:** ga met je vinger of muis over de staafjes en het grote getal erboven toont die ene wedstrijd.
- **Rood en oranje alleen voor blessures:** oranje is twijfelachtig, rood is zeker afwezig. Er staat altijd een icoon en tekst bij, nooit alleen een kleur.
- **Rekening houden met je instellingen:** wie "Minder beweging" aanzet, krijgt rustige overgangen in plaats van schuivende kaarten. Ook "Minder transparantie" en "Meer contrast" werken.

## Handige commando's

- `npm run lint`: controleert de code op veelgemaakte fouten
- `npm run build`: maakt de versie die online komt. Zo zie je of alles werkt.

GitHub draait beide bij elke pull request die iets in `web/` verandert. Je ziet het resultaat als een groen vinkje of een rood kruisje onderaan de pull request.

## Leren

- React (de bouwstenen van de pagina): [react.dev/learn](https://react.dev/learn)
- Next.js: [nextjs.org/learn](https://nextjs.org/learn)
- Tailwind CSS, de opmaak met classes zoals `text-sm` en `bg-kaart`: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- Motion, voor de animaties: [motion.dev/docs/react](https://motion.dev/docs/react)
- De ontwerpregels van Apple: [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)

## Oefeningen

1. **Tekst aanpassen:** verander de titel of de uitleg bovenaan in `app/page.tsx`, en kijk hoe de pagina meteen verandert.
2. **Andere standaard:** laat de tabel standaard sorteren op goals in plaats van op xG. *(`STANDAARD` in `lib/filters.ts`)*
3. **Minder spelers:** zet de standaardwaarde van "Min. minuten" op 450.
4. **Eigen kleur:** maak de accentkleur blauw in plaats van groen. Verander `--accent` in `app/globals.css`, in licht én donker. Tip: Apple gebruikt `#007aff` en `#0a84ff`.
5. **Nieuwe opdracht:** voeg in `lib/opdrachten.ts` een vijfde oefenopdracht toe, bv. "Verdediger die meevoetbalt" (verdedigers, gesorteerd op verwachte assists).
6. **Nieuwe kolom:** voeg G+A (goals + assists) toe. Tip: begin bij het type `Speler` in `lib/competitie.ts`, en voeg daarna een regel toe aan `KOLOMMEN` in `lib/statistieken.ts`.
7. **Uitdaging:** toon op de speeldagpagina bij elke afgelopen wedstrijd de winnaar in het vet.
8. **Spelregel aanpassen:** maak de kans op een keeperopdracht kleiner, of voeg een leeftijdsgrens van 19 jaar toe. *(`SOORT_KANSEN` en `maakOpdracht()` in `lib/spel.ts`)*
9. **Grote uitdaging:** maak een pagina `/stand` met de rangschikking van de competitie. Het rekenwerk doet `berekenStand()` in `lib/stand.ts` al: jij maakt de tabel. Voeg de pagina ook toe aan de navigatie.
