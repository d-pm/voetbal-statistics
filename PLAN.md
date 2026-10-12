# Plan: scoutingspel met echte voetbalstatistieken

> Werkdocument: pas het aan zodra jullie keuzes maken. Opgesteld op 12 oktober 2026.

## 1. Het idee in het kort

Je bent scout voor een voetbalclub. De club vertelt wat ze zoekt, bijvoorbeeld *"een jonge middenvelder die veel kansen creëert"*. Jij zoekt in echte, actuele statistieken een speler en raadt hem aan **vóór de deadline**. Daarna kijkt het spel hoe die speler **echt presteert** in de volgende speelweek.

Goed advies levert **geld** en **reputatie** op. Met geld kun je beter scouten, met reputatie kom je bij een grotere club of in een hogere divisie. Je speelt tegen vrienden in een eigen competitie met een ranglijst.

Competities: Premier League, Championship en League One, in die volgorde toegevoegd (zie §4).

## 2. Spelregels (eerste voorstel, nog te testen)

### De kern: de weekopdracht

1. Elke speelweek (maandag t/m zondag) krijgt **iedereen dezelfde opdracht**, bijvoorbeeld:
   > *"We zoeken een verdediger, max. 25 jaar, die veel ballen afpakt."*
2. Je raadt **één speler** aan vóór de **deadline** (bijvoorbeeld 1,5 uur voor de eerste wedstrijd van die week).
3. Na de speelweek krijgt je speler punten op basis van zijn **echte prestaties in die week**, vooral op de gevraagde eigenschap.
4. Voldoet hij niet aan de harde eisen (positie, leeftijd), dan krijg je 0 punten. Speelt hij niet, dan ook 0 punten: blessures checken hoort bij scouten.

**Waarom zo?** Als je beoordeeld wordt op wat een speler *al gedaan heeft*, is het spel gewoon een tabel filteren. De uitdaging zit in *voorspellen* wie gaat presteren. Daarom is er een deadline, en daarom moet die deadline **in de database** gecontroleerd worden en niet alleen in de website.

### Puntentelling (voorbeeld, gebaseerd op data die de FPL API geeft)

| Opdracht | Punten |
|---|---|
| "Een spits die scoort" | goals × 5 + xG × 3 |
| "Een creatieve middenvelder" | assists × 4 + xA × 3 |
| "Een verdediger die ballen afpakt" | tackles + clearances/blocks/interceptions + recoveries ÷ 2 |
| "Een keeper die de nul houdt" | clean sheet × 4 + saves |

Zet deze formules in **één configuratiebestand**, want jullie gaan ze vaak bijstellen.

### Later: carrière en geld (na de MVP)

- **Reputatie** stijgt met goede aanbevelingen. Daarmee krijg je aanbiedingen van grotere clubs: League One, dan Championship, dan Premier League. Een grotere club geeft moeilijkere opdrachten en meer beloning.
- Met **geld** (scoutingbudget) koop je upgrades:
  - **meer statistieken zien.** Je begint met goals, assists en minuten en speelt daarna xG/xA, defensieve stats enzovoort vrij. Zo worden de statistieken zelf de beloning.
  - **toegang tot extra competities** om in te scouten
  - **een tweede aanbeveling per week**
- **Let op:** een carrière en een eerlijke ranglijst bijten elkaar, want wie bij een grotere club zit krijgt andere opdrachten. De oplossing: de weekopdracht blijft voor iedereen gelijk en telt voor de ranglijst. De carrière is een aparte laag erbovenop.

### Open vragen (beslissen in sessie 1)

- Eén speler per week, of meerdere?
- Mag je dezelfde speler meerdere weken na elkaar aanraden?
- Wat als een speler in één week twee wedstrijden speelt (de Championship speelt vaak midweeks)? Totalen bevoordelen hem, gemiddelden per 90 minuten niet.
- Wie maakt de opdrachten? Voorstel: in het begin jullie zelf, handmatig in de database. Later automatisch uit sjablonen.
- Wat gebeurt er aan het einde van het seizoen?

## 3. MVP: wat er na ongeveer een maand moet werken

**Alleen de Premier League, nog geen geld of carrière.**

- Inloggen met Google of Discord
- Een competitie met vrienden aanmaken of joinen met een uitnodigingscode
- Een **scoutingdatabase**: alle PL-spelers doorzoeken, filteren (positie, team, leeftijd, minimum aantal minuten) en sorteren op statistiek (totaal en per 90 minuten)
- Een spelerspagina met cijfers per wedstrijd
- De weekopdracht bekijken en één speler aanraden vóór de deadline
- Na de speelweek automatisch punten en een ranglijst
- Werkt goed op de gsm

**Niet in de MVP:** geld, upgrades, carrière, Championship/League One, live-ticker en meldingen.

## 4. Data

| Competitie | Bron | Wat | Kost |
|---|---|---|---|
| Premier League | **FPL API** (`fantasy.premierleague.com/api`) | spelers (incl. geboortedatum en positie), wedstrijden, minuten, goals, assists, xG, xA, tackles, recoveries, clearances/blocks/interceptions, saves. **Geen passes.** | gratis, geen key nodig (onofficieel) |
| Championship, League One | **API-Football** (api-sports.io, league-id 40 en 41) | per speler per wedstrijd: minuten, goals, assists, schoten, passes, key passes, tackles, interceptions, duels, dribbels, rating. **Geen xG per speler.** | gratis: 100 calls per dag. **Niet bevestigd of het huidige seizoen in het gratis plan zit, dus testen in sessie 1.** Het goedkoopste betaalde plan kost ongeveer $19 per maand. |

**Rekensom voor API-Football gratis:**
- Per speelronde zijn er 12 + 12 wedstrijden, dus ongeveer 24 calls voor spelersstats.
- De spelerslijst haal je één keer op, in pagina's van 20 spelers: ongeveer 70 calls.
- Dat past binnen 100 calls per dag, zolang je de data na de wedstrijden ophaalt en niet live.

**Gevolgen:**
- **xG is alleen voor de PL gratis.** Kies statistieken voor de punten die in alle competities bestaan, of laat de opdrachten per competitie verschillen.
- **Spelers hebben per bron een ander id.** Maak dus één eigen `players`-tabel met een koppeltabel (`player_sources`). Een speler die transfereert of promoveert moet hetzelfde id houden.
- **"Live" is niet nodig om te scouten.** Het volstaat om de stats na elke wedstrijddag bij te werken, een paar keer per dag. Een live-ticker ("hoe doet mijn speler het nu?") kan later, alleen voor de PL.
- **Niet scrapen bij FotMob, Sofascore of Transfermarkt.** Dat mag niet volgens hun voorwaarden en ze blokkeren je. Echte transferwaardes heb je dus niet. Wil je "prijzen" voor spelers, bereken die dan zelf.

## 5. Technologie

**Waarom dit anders is dan het eerste plan:** login, vrienden en een online database zijn veel extra werk als je ze zelf bouwt. Zelf wachtwoorden veilig opslaan is voor beginners geen goed idee.

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Website + spellogica | **Next.js** (TypeScript) | pagina's én servercode in één project, veel tutorials |
| Database + login | **Supabase** (PostgreSQL + Auth) | gratis plan, login met Google/Discord kant-en-klaar, officieel Next.js-startproject |
| Data ophalen + punten berekenen | **Python**-scripts | sterk in data (pandas), en zo leren jullie statistiek |
| Scripts automatisch laten draaien | **GitHub Actions** (cron) | gratis, geen eigen server nodig |
| Website online zetten | **Vercel** | gratis voor hobbyprojecten, koppelt met GitHub |

```
  FPL API (PL)          API-Football (Championship, League One)
         \                      /
   Python-scripts via GitHub Actions (een paar keer per dag)
     - stats ophalen     - punten berekenen
                    |
         Supabase: PostgreSQL + login
                    |
     Next.js-website op Vercel  <-->  spelers (gsm / laptop)
```

**Taakverdeling:**
- **Data:** Python, SQL, databaseontwerp, puntentelling en GitHub Actions
- **Web:** Next.js, login, pagina's en grafieken
- **Spelregels:** altijd samen

## 6. Database (eerste versie)

**Voetbaldata**
- `competitions`: PL, Championship, League One
- `teams`: id, naam, competition_id
- `players`: id, naam, geboortedatum, positie, team_id
- `player_sources`: player_id, bron, extern_id
- `fixtures`: id, competition_id, thuis, uit, aftrap, score, status
- `player_match_stats`: player_id, fixture_id, minuten, goals, assists, xg, xa, tackles, recoveries, …

**Spel**
- `profiles`: user_id, weergavenaam
- `leagues`: id, naam, uitnodigingscode (een groep vrienden met een ranglijst)
- `league_members`: league_id, user_id
- `assignments`: id, week_start, deadline, positie, max_leeftijd, gevraagde_stat (één opdracht per week, voor iedereen dezelfde)
- `recommendations`: assignment_id, user_id, player_id, tijdstip (uniek per gebruiker en opdracht)
- `scores`: recommendation_id, punten, uitleg

## 7. Planning voor maand 1 (8 sessies)

### Sessie 1: spelregels en data checken (samen)

- **Regels vastleggen.** Lees dit plan samen, beslis de open vragen uit §2 en schrijf de regels in `GAME.md` (max. 1 pagina).
- **Vriend toevoegen.** Voeg je vriend toe als collaborator: GitHub → Settings → Collaborators.
- **Installeren:** Node.js (LTS), Python 3.12+, VS Code en Git.
- **Code niet in OneDrive.** Clone de repo naar bijvoorbeeld `C:\dev\voetbal-statistics`. OneDrive die `node_modules` en `.git` synchroniseert is traag en kan bestanden beschadigen.
- **FPL API testen** met dit script (`pip install requests`):

  ```python
  import requests

  data = requests.get("https://fantasy.premierleague.com/api/bootstrap-static/").json()
  teams = {t["id"]: t["short_name"] for t in data["teams"]}

  spelers = []
  for p in data["elements"]:
      xg = float(p["expected_goals"])
      spelers.append({
          "naam": p["web_name"],
          "team": teams[p["team"]],
          "goals": p["goals_scored"],
          "xg": xg,
          "verschil": p["goals_scored"] - xg,
      })

  print("Grootste overpresteerders (goals - xG):")
  for s in sorted(spelers, key=lambda s: s["verschil"], reverse=True)[:10]:
      print(f'{s["naam"]:<15} {s["team"]}  {s["goals"]} goals  xG {s["xg"]:.2f}  ({s["verschil"]:+.2f})')
  ```

- **API-Football testen.** Maak een gratis account en test of het huidige seizoen werkt met `GET /fixtures?league=40&season=2026&last=5`. Noteer het resultaat hier in het plan.
- **Speel het spel op papier.** Verzin een opdracht en kies allebei een speler vóór het weekend. Tel maandag de punten met de hand. Is het leuk? Wat voelt oneerlijk? Pas de regels aan **voordat** je ze programmeert.

### Sessie 2: fundament

- **Web:** maak een Supabase-project en een Next.js-project met `npx create-next-app@latest -e with-supabase web`. Zorg dat inloggen lokaal werkt en zet login met Google of Discord aan.
- **Data:** maak de tabellen voor de voetbaldata aan in Supabase (SQL). Schrijf `ingest.py`, dat de PL-teams en -spelers inlaadt. Zet de sleutels in `.env`.
- **Klaar als:** je kunt inloggen en alle PL-spelers in de database staan.

### Sessie 3: scoutingdatabase

- **Data:** laad de stats per wedstrijd van alle gespeelde speeldagen (`/api/event/{gw}/live/`). Maak een view met totalen en cijfers per 90 minuten.
- **Web:** maak de scoutingpagina: een tabel met filters en sorteren.

### Sessie 4: online zetten

- **Data:** maak een GitHub Actions-workflow die `ingest.py` elke dag automatisch draait, bijvoorbeeld om 6u en om 23u. Zet de sleutels in GitHub Secrets.
- **Web:** maak de spelerspagina en zet de site online op Vercel.
- **Mijlpaal:** de scoutingsite staat online en houdt zichzelf up-to-date.

### Sessie 5: het spel, deel 1

- **Samen:** maak de tabellen voor het spel.
- **Web:** competitie aanmaken of joinen met een code, de opdrachtpagina en de knop om een speler aan te raden.
- **Data:** laat de database aanbevelingen na de deadline weigeren (met een RLS-policy of een databasefunctie).

### Sessie 6: punten en ranglijst

- **Data:** `score.py` berekent na de speelweek de punten. **Test dit op oude speeldagen** ("replay"), dan hoef je niet op het weekend te wachten.
- **Web:** de ranglijst per competitie en een overzicht "mijn aanbevelingen".

### Sessie 7: echte test

- Nodig 3 tot 5 vrienden uit voor een echte speelweek. Verzamel hun feedback en los bugs op.

### Sessie 8: afwerken en vooruitkijken

- Werk de gsm-weergave, een pagina met de regels en de foutmeldingen af.
- Blik kort terug: wat ging goed, wat niet? Kies de prioriteiten voor maand 2.

## 8. Daarna (grote lijnen)

- **Maand 2:** geld en upgrades (statistieken vrijspelen) en de eerste carrièrestap
- **Maand 3:** Championship en League One via API-Football, clubs per divisie en automatisch gemaakte opdrachten
- **Later:**
  - een live-ticker van je aanbevolen spelers tijdens de wedstrijd (PL)
  - meldingen via een Discord-bot of e-mail
  - radargrafieken om spelers te vergelijken
  - scoutrapporten
  - een archief per seizoen

## 9. Risico's en dingen die je niet mag vergeten

- **Data van de lagere divisies** (§4) is het grootste risico. Test het in sessie 1.
- **Valsspelen:** de deadline en "één aanbeveling per week" controleer je in de database, niet alleen met de knoppen in de website.
- **Testen zonder te wachten:** bouw van in het begin een manier om oude speeldagen opnieuw af te spelen.
- **Geheimen:** API-sleutels horen in `.env` (staat in `.gitignore`) en in GitHub Secrets, nooit in de code. **Deze repo is publiek.**
- **Logo's en spelersfoto's** zijn beschermd. Gebruik ze niet: namen en eigen kleuren zijn genoeg.
- **Geen echt geld in het spel**, alleen nepgeld. Betaalde loot boxes zijn in België verboden als kansspel.
- **Privacy (GDPR):** sla zo weinig mogelijk op (weergavenaam en login) en zorg dat iemand zijn account kan verwijderen.
- **Gratis plannen** veranderen en kunnen pauzeren als er niets gebeurt (Supabase). De dagelijkse GitHub Action helpt om het project actief te houden.
- **Scope:** het volledige idee is eerder 3 tot 4 maanden werk aan 2 sessies per week. Houd maand 1 bij de MVP.
