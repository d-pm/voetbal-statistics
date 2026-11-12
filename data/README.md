# Data (Python)

Hier staat alles wat met voetbaldata te maken heeft: ophalen, bewaren en de puntentelling. Zie [PLAN.md](../PLAN.md), §5.

| Bestand | Wat doet het |
|---|---|
| `fpl.py` | praat met de FPL API: teams, spelers, wedstrijden en de cijfers per speeldag |
| `schema.sql` | de tabellen van de database |
| `ingest.py` | haalt alles op en bewaart het in de database `voetbal.db` |
| `puntentelling.py` | de spelregels in cijfers: de soorten opdrachten en hoeveel punten elke statistiek waard is |
| `score.py` | speelt een oude speeldag opnieuw af: wie was de beste keuze voor een opdracht? |
| `query.py` | stel een vraag aan de database met SQL |
| `scout.py` | eerste scout-tool: zoekt spelers die passen bij een opdracht ("verdediger, max. 25 jaar, veel tackles") |
| `tests/` | automatische tests: controleren of de code nog doet wat ze moet doen |
| `requirements.txt` | de Python-pakketten die dit project nodig heeft (`requirements-dev.txt`: ook die voor de tests) |

## Starten (Windows)

1. Check of Python er is: `python --version` (3.12 of nieuwer). Zo niet: installeer het via [python.org](https://www.python.org/downloads/) en vink **"Add python.exe to PATH"** aan.
2. Open een terminal in de map `data` en voer uit:

   ```powershell
   python -m venv .venv
   .venv\Scripts\python -m pip install -r requirements-dev.txt
   .venv\Scripts\python scout.py
   ```

   `.venv` is een aparte "doos" met de pakketten voor dit project. Zo komen ze niet tussen de rest van je computer. De map staat in `.gitignore` en komt dus niet op GitHub.

3. **In VS Code:** installeer de extensie **Python** (van Microsoft). VS Code vindt `.venv` dan vanzelf, en je kunt een bestand starten met de ▶-knop rechtsboven.

Je zou zoiets moeten zien:

```
Opdracht: DEF, max. 25 jaar, veel tackles (min. 300 minuten)
42 spelers voldoen. Top 10:

Naam              Team   Leeftijd  Minuten     tackles  per 90
Khalaili          CRY          22      682          29    3.83
...
```

## De database

```powershell
.venv\Scripts\python ingest.py
```

Dit haalt alle teams, spelers, wedstrijden en speeldagen op, en de cijfers van elke speler per speeldag. Alles komt in `voetbal.db`. Dat is een SQLite-database: één bestand op je computer. Het bestand komt niet op GitHub: iedereen maakt het zelf aan.

- De eerste keer duurt het wat langer, want elke gespeelde speeldag wordt apart opgehaald.
- Daarna mag je het zo vaak draaien als je wilt. Bestaande rijen worden bijgewerkt en niet verdubbeld, en een speeldag die helemaal klaar is wordt niet opnieuw opgehaald. Wil je dat toch, gebruik dan `ingest.py --alles`.
- Pas je `schema.sql` aan, verhoog dan `SCHEMA_VERSIE` in `ingest.py`. De database wordt dan vanzelf opnieuw opgebouwd.

| Tabel | Wat staat erin |
|---|---|
| `competitions`, `teams`, `players`, `fixtures` | competities, teams, spelers en wedstrijden |
| `gameweeks` | één rij per speeldag, met de deadline |
| `player_gameweek_stats` | wat een speler in één speeldag deed. Wie niet speelde, heeft geen rij. |
| `player_totals` (view) | alles opgeteld per speler, ook per 90 minuten |

Een vraag stellen met SQL doe je zo:

```powershell
.venv\Scripts\python query.py "SELECT naam, team, tackles_per_90 FROM player_totals WHERE minuten >= 450 ORDER BY tackles_per_90 DESC LIMIT 10"
```

Wil je de tabellen liever bekijken door te klikken? Installeer dan in VS Code de extensie **SQLite Viewer** en open `voetbal.db`.

**Waarom eerst SQLite en nog niet Supabase?** Zo heb je nog geen account nodig en leer je SQL met precies dezelfde tabellen. Als het Supabase-project er is, verhuizen we.

## De puntentelling testen ("replay")

In het spel raad je een speler aan vóór de speeldag en krijg je punten voor wat hij daarna echt doet. Met `score.py` speel je een oude speeldag opnieuw af. Zo test je de regels zonder op het weekend te wachten.

```powershell
.venv\Scripts\python score.py 10 balafpakker
```

```
Speeldag 10 · Een verdediger die ballen afpakt

  #  Speler            Team   Lft  Min  Punten  Uitleg
  1  ...               ...     25   90      17  2 tackles × 1 + 13 CBI × 1 + 4 recoveries × 0.5
```

- `score.py 10 balafpakker --max-leeftijd 23`: de club wil niemand ouder dan 23. De leeftijd telt op de dag van de deadline.
- `score.py 10 spits --speler Haaland`: wat had deze aanbeveling opgeleverd, en op welke plaats stond hij?
- De soorten opdrachten zijn `spits`, `spelmaker`, `balafpakker` en `keeper`. Ze staan in `puntentelling.py`, samen met de punten per statistiek. **Dat is het enige bestand dat je aanpast om de regels bij te stellen.**

Iets om samen over na te denken: een verdediger haalt makkelijk 15 punten, een spelmaker zelden meer dan 5. Zolang iedereen dezelfde opdracht krijgt is dat geen probleem, maar tel je weken op in een ranglijst, dan weegt de ene week zwaarder dan de andere.

## Tests

```powershell
.venv\Scripts\python -m pytest
```

De tests in `tests/` gebruiken nepdata (een mini-competitie in `tests/conftest.py`) en gaan nooit naar het internet. Je moet `31 passed` zien. Faalt er een test nadat je iets veranderde? Dan heb je iets kapotgemaakt, of je moet de test mee aanpassen.

GitHub draait dezelfde tests bij elke pull request die iets in `data/` verandert. Je ziet het resultaat als een groen vinkje of een rood kruisje onderaan de pull request.

## Woorden die je in de code tegenkomt

- **variabele**: een naam voor een waarde, zoals `POSITIE = "DEF"`
- **lijst** `[...]`: een rij dingen na elkaar, zoals alle spelers
- **woordenboek** (dict) `{...}`: sleutel → waarde, zoals `speler["naam"]`
- **for-lus**: doe iets voor elk ding in een lijst
- **if**: doe iets alleen als een voorwaarde klopt
- **functie** (`def`): een stuk code met een naam dat je opnieuw kunt gebruiken
- **import**: code uit een ander bestand of pakket gebruiken
- **f-string** `f"..."`: tekst met waarden erin, zoals `f"{speler['naam']}"`
- **test**: een functie die controleert of andere code het juiste antwoord geeft (`assert`)

Wil je meer leren, gebruik dan de officiële [Python-tutorial](https://docs.python.org/3/tutorial/) of de gratis cursus [Python for Everybody](https://www.py4e.com/). SQL leer je snel met [SQLBolt](https://sqlbolt.com/).

## Oefeningen: dit doe je zelf

Doe ze in volgorde: elke oefening leert je iets nieuws. Probeer het eerst zelf, en vraag pas daarna om een hint, niet meteen om de oplossing.

1. **Andere opdracht:** zoek in `scout.py` een spits (`FWD`) van maximaal 23 jaar met veel xG. *(variabelen)*
2. **Extra kolom:** toon bij elke speler ook zijn aantal goals. *(f-strings, dict)*
3. **Extra filter:** voeg `TEAM = "ARS"` toe, zodat je alleen spelers van één team ziet. Met `TEAM = None` zie je alle teams. *(if, None)*
4. **Nieuwe statistiek:** voeg in `fpl.py` het veld `"g_plus_a"` toe (goals + assists) en zoek daarop. *(rekenen met dict-waarden)*
5. **Onderpresteerders:** maak een veld "goals min xG" en zoek de aanvallers die het meest **onder** hun xG zitten. Zij krijgen kansen maar scoren (nog) niet. Dat zijn interessante spelers om te scouten. *(sorteren)*
6. **Opslaan:** schrijf de kandidaten weg naar `kandidaten.csv` met de module `csv` en open het bestand in Excel. *(modules, bestanden)*
7. **Nieuwe opdracht:** voeg in `puntentelling.py` de opdracht `"muur"` toe: "Een verdediger die niets weggeeft", met punten voor clean sheets en CBI. Speel er een paar speeldagen mee na met `score.py`. Zijn de punten eerlijk? *(dict in een dict)*
8. **Je eerste test:** schrijf in `tests/test_puntentelling.py` een test voor je nieuwe opdracht. Kijk hoe de bestaande tests het doen. *(assert)*
9. **Uitdaging:** laat `score.py` met `--seizoen-top` de beste spelers over **alle** gespeelde speeldagen samen tonen. Hint: roep `rangschik` aan voor elke speeldag en tel de punten per speler op. *(lussen, dict)*

## SQL-oefeningen

Draai eerst `ingest.py`. Test je antwoorden daarna met `query.py`.

1. **Hoeveel spelers zijn er per positie?** *(GROUP BY)*
2. **Alle spelers van je favoriete team**, gesorteerd op naam. *(JOIN, ORDER BY)*
3. **De 10 jongste spelers** van de competitie. *(ORDER BY, LIMIT)*
4. **Alle spelers met blessurenieuws.** *(WHERE)*
5. **De volgende 5 wedstrijden**, met de namen van beide teams in plaats van hun id. Tip: je hebt twee keer een JOIN met `teams` nodig. *(aliassen)*
6. **Wie speelde elke speeldag?** Zoek in `player_totals` de spelers die in alle gespeelde speeldagen minuten maakten. *(views, WHERE)*
7. **Beste speeldag:** welke speler had in één speeldag de meeste tackles, en in welke speeldag? *(JOIN met `gameweeks`, ORDER BY)*
8. **Uitdaging: maak de stand.** Bereken de punten per team uit alle afgelopen wedstrijden. *(CASE, SUM)*
