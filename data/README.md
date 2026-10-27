# Data (Python)

Hier komt alles wat met voetbaldata te maken heeft: ophalen, omzetten en later de puntentelling. Zie [PLAN.md](../PLAN.md), §5.

| Bestand | Wat doet het |
|---|---|
| `fpl.py` | haalt alle Premier League-spelers op bij de FPL API en zet ze om naar een eenvoudige lijst |
| `scout.py` | eerste scout-tool: zoekt spelers die passen bij een opdracht ("verdediger, max. 25 jaar, veel tackles") |
| `schema.sql` | de tabellen van de database: competities, teams, spelers en wedstrijden |
| `ingest.py` | haalt teams, spelers en wedstrijden op en bewaart ze in de database `voetbal.db` |
| `query.py` | stel een vraag aan de database met SQL |
| `requirements.txt` | de Python-pakketten die dit project nodig heeft |

## Starten (Windows)

1. Check of Python er is: `python --version` (3.12 of nieuwer). Zo niet: installeer het via [python.org](https://www.python.org/downloads/) en vink **"Add python.exe to PATH"** aan.
2. Open een terminal in de map `data` en voer uit:

   ```powershell
   python -m venv .venv
   .venv\Scripts\python -m pip install -r requirements.txt
   .venv\Scripts\python scout.py
   ```

   `.venv` is een aparte "doos" met de pakketten voor dit project. Zo komen ze niet tussen de rest van je computer. De map staat in `.gitignore` en komt dus niet op GitHub.

3. **In VS Code:** installeer de extensie **Python** (van Microsoft). VS Code vindt `.venv` dan vanzelf, en je kunt een bestand starten met de ▶-knop rechtsboven.

Je zou zoiets moeten zien:

```
Opdracht: DEF, max. 25 jaar, veel tackles (min. 300 minuten)
34 spelers voldoen. Top 10:

Naam              Team   Leeftijd  Minuten     tackles  per 90
Khalaili          CRY          22      559          25    4.03
...
```

## De database

```powershell
.venv\Scripts\python ingest.py
```

Dit haalt alle teams, spelers en wedstrijden op en bewaart ze in `voetbal.db`. Dat is een SQLite-database: één bestand op je computer. Je mag het zo vaak draaien als je wilt, want bestaande rijen worden bijgewerkt en niet verdubbeld. Het bestand komt niet op GitHub: iedereen maakt het zelf aan.

Een vraag stellen met SQL doe je zo:

```powershell
.venv\Scripts\python query.py "SELECT naam, afkorting FROM teams"
```

Wil je de tabellen liever bekijken door te klikken? Installeer dan in VS Code de extensie **SQLite Viewer** en open `voetbal.db`.

**Waarom eerst SQLite en nog niet Supabase?** Zo heb je nog geen account nodig en leer je SQL met precies dezelfde tabellen. Als het Supabase-project er is, verhuizen we.

## Woorden die je in de code tegenkomt

- **variabele**: een naam voor een waarde, zoals `POSITIE = "DEF"`
- **lijst** `[...]`: een rij dingen na elkaar, zoals alle spelers
- **woordenboek** (dict) `{...}`: sleutel → waarde, zoals `speler["naam"]`
- **for-lus**: doe iets voor elk ding in een lijst
- **if**: doe iets alleen als een voorwaarde klopt
- **functie** (`def`): een stuk code met een naam dat je opnieuw kunt gebruiken
- **import**: code uit een ander bestand of pakket gebruiken
- **f-string** `f"..."`: tekst met waarden erin, zoals `f"{speler['naam']}"`

Wil je meer leren, gebruik dan de officiële [Python-tutorial](https://docs.python.org/3/tutorial/) of de gratis cursus [Python for Everybody](https://www.py4e.com/). SQL leer je snel met [SQLBolt](https://sqlbolt.com/).

## Oefeningen: dit doe je zelf

Doe ze in volgorde: elke oefening leert je iets nieuws. Probeer het eerst zelf, en vraag pas daarna om een hint, niet meteen om de oplossing.

1. **Andere opdracht:** zoek een spits (`FWD`) van maximaal 23 jaar met veel xG. *(variabelen)*
2. **Extra kolom:** toon bij elke speler ook zijn aantal goals. *(f-strings, dict)*
3. **Extra filter:** voeg `TEAM = "ARS"` toe, zodat je alleen spelers van één team ziet. Met `TEAM = None` zie je alle teams. *(if, None)*
4. **Nieuwe statistiek:** voeg in `fpl.py` het veld `"g_plus_a"` toe (goals + assists) en zoek daarop. *(rekenen met dict-waarden)*
5. **Onderpresteerders:** maak een veld "goals min xG" en zoek de aanvallers die het meest **onder** hun xG zitten. Zij krijgen kansen maar scoren (nog) niet. Dat zijn interessante spelers om te scouten. *(sorteren)*
6. **Opslaan:** schrijf de kandidaten weg naar `kandidaten.csv` met de module `csv` en open het bestand in Excel. *(modules, bestanden)*
7. **Uitdaging (voorbereiding op sessie 3 en 6):** haal met `f"{BASIS_URL}/event/8/live/"` de stats van één speeldag op en toon wie die week de meeste tackles had. Dit wordt de basis van de puntentelling. Hint: open de URL eerst in Firefox en kijk hoe de data eruitziet. *(zelf een API verkennen)*

## SQL-oefeningen

Draai eerst `ingest.py`. Test je antwoorden daarna met `query.py`.

1. **Hoeveel spelers zijn er per positie?** *(GROUP BY)*
2. **Alle spelers van je favoriete team**, gesorteerd op naam. *(JOIN, ORDER BY)*
3. **De 10 jongste spelers** van de competitie. *(ORDER BY, LIMIT)*
4. **Alle spelers met blessurenieuws.** *(WHERE)*
5. **De volgende 5 wedstrijden**, met de namen van beide teams in plaats van hun id. Tip: je hebt twee keer een JOIN met `teams` nodig. *(aliassen)*
6. **Uitdaging: maak de stand.** Bereken de punten per team uit alle afgelopen wedstrijden. *(CASE, SUM)*
