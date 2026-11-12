"""
Speelt een oude speeldag opnieuw af ("replay"): wie was de beste keuze voor een opdracht?

Zo test je de puntentelling zonder op het weekend te wachten. Draai eerst ingest.py.

Voorbeelden:
    python score.py 10 balafpakker                      de top 10 van speeldag 10
    python score.py 10 balafpakker --max-leeftijd 23    alleen spelers tot en met 23 jaar
    python score.py 10 spits --speler Haaland           wat had deze aanbeveling opgeleverd?

Later gebruikt het spel dezelfde functies om na elke speeldag de punten
van alle aanbevelingen in de database te zetten.
"""

import argparse
import sqlite3
import sys
from datetime import date
from pathlib import Path

from fpl import bereken_leeftijd
from puntentelling import OPDRACHTEN, bereken_punten, controleer_eisen

DATABASE = Path(__file__).parent / "voetbal.db"

# Een naam als "Petrović" kan niet in elke Windows-terminal getoond worden.
# Met errors="replace" komt er dan een "?" in plaats van een foutmelding.
sys.stdout.reconfigure(errors="replace")


def laatste_seizoen(db):
    return db.execute("SELECT MAX(seizoen) FROM gameweeks").fetchone()[0]


def zoek_deadline(db, speeldag, seizoen):
    """Geeft de dag van de deadline terug, of None als de speeldag niet bestaat."""
    rij = db.execute(
        "SELECT deadline FROM gameweeks WHERE speeldag = ? AND seizoen = ?", (speeldag, seizoen)
    ).fetchone()
    if rij is None:
        return None
    return date.fromisoformat(rij["deadline"][:10])  # "2026-11-06T18:30:00Z" -> 6 november 2026


def rangschik(db, speeldag, opdracht, max_leeftijd=None, seizoen=None):
    """
    Geeft alle spelers terug die in die speeldag speelden én aan de eisen voldoen,
    met hun punten. De beste staat eerst.
    """
    seizoen = seizoen or laatste_seizoen(db)
    deadline = zoek_deadline(db, speeldag, seizoen)

    rijen = db.execute(
        """
        SELECT p.naam, p.geboortedatum, p.positie, t.afkorting AS team, s.*
        FROM player_gameweek_stats AS s
        JOIN gameweeks AS g ON g.id = s.gameweek_id
        JOIN players   AS p ON p.id = s.player_id
        JOIN teams     AS t ON t.id = p.team_id
        WHERE g.speeldag = ? AND g.seizoen = ?
        """,
        (speeldag, seizoen),
    ).fetchall()

    resultaat = []
    for rij in rijen:
        # De leeftijd telt op de dag van de deadline, niet vandaag
        leeftijd = bereken_leeftijd(rij["geboortedatum"], op=deadline)
        if controleer_eisen(rij["positie"], leeftijd, opdracht, max_leeftijd) is not None:
            continue
        punten, uitleg = bereken_punten(rij, opdracht)
        resultaat.append({
            "player_id": rij["player_id"],
            "naam": rij["naam"],
            "team": rij["team"],
            "leeftijd": leeftijd,
            "minuten": rij["minuten"],
            "punten": punten,
            "uitleg": uitleg,
        })

    # Meeste punten eerst. Bij gelijke punten: alfabetisch, zodat de volgorde altijd dezelfde is.
    resultaat.sort(key=lambda speler: (-speler["punten"], speler["naam"]))
    return resultaat


def beoordeel(db, speeldag, opdracht, zoekterm, max_leeftijd=None, seizoen=None):
    """
    Wat had het opgeleverd als je deze speler had aangeraden?

    Geeft een lijst terug met één woordenboek per speler die bij de zoekterm past.
    """
    seizoen = seizoen or laatste_seizoen(db)
    deadline = zoek_deadline(db, speeldag, seizoen)
    ranglijst = rangschik(db, speeldag, opdracht, max_leeftijd, seizoen)

    spelers = db.execute(
        """
        SELECT p.id, p.naam, p.geboortedatum, p.positie, t.afkorting AS team
        FROM players AS p
        JOIN teams AS t ON t.id = p.team_id
        WHERE p.naam LIKE ? OR p.volledige_naam LIKE ?
        ORDER BY p.naam
        """,
        (f"%{zoekterm}%", f"%{zoekterm}%"),
    ).fetchall()

    oordelen = []
    for speler in spelers:
        oordeel = {"naam": speler["naam"], "team": speler["team"], "punten": 0, "plaats": None, "uitleg": ""}
        leeftijd = bereken_leeftijd(speler["geboortedatum"], op=deadline)
        reden = controleer_eisen(speler["positie"], leeftijd, opdracht, max_leeftijd)

        if reden is not None:
            oordeel["uitleg"] = reden
        else:
            # Staat hij in de ranglijst? Dan speelde hij en voldoet hij aan de eisen.
            for plaats, kandidaat in enumerate(ranglijst, start=1):
                if kandidaat["player_id"] == speler["id"]:
                    oordeel["punten"] = kandidaat["punten"]
                    oordeel["plaats"] = plaats
                    oordeel["uitleg"] = kandidaat["uitleg"]
                    break
            else:  # deze "else" hoort bij de for-lus: ze draait als de lus niets vond
                oordeel["uitleg"] = "speelde niet in deze speeldag"

        oordelen.append(oordeel)
    return oordelen


def main():
    parser = argparse.ArgumentParser(description="Speel een oude speeldag opnieuw af.")
    parser.add_argument("speeldag", type=int, help="het nummer van de speeldag, bv. 10")
    parser.add_argument("opdracht", choices=OPDRACHTEN.keys(), help="het soort opdracht")
    parser.add_argument("--max-leeftijd", type=int, help="de club wil niemand die ouder is")
    parser.add_argument("--speler", help="toon wat deze aanbeveling had opgeleverd")
    parser.add_argument("--top", type=int, default=10, help="hoeveel spelers je wilt zien (standaard 10)")
    opties = parser.parse_args()

    if not DATABASE.exists():
        sys.exit("Er is nog geen database. Draai eerst: python ingest.py")

    db = sqlite3.connect(f"{DATABASE.as_uri()}?mode=ro", uri=True)  # mode=ro = alleen lezen
    db.row_factory = sqlite3.Row  # zo kun je een kolom opvragen met haar naam: rij["naam"]

    opdracht = OPDRACHTEN[opties.opdracht]
    ranglijst = rangschik(db, opties.speeldag, opdracht, opties.max_leeftijd)
    if not ranglijst:
        sys.exit(f"Geen cijfers gevonden voor speeldag {opties.speeldag}. Is ze al gespeeld, en draaide je ingest.py?")

    titel = f"Speeldag {opties.speeldag} · {opdracht['titel']}"
    if opties.max_leeftijd is not None:
        titel += f" (max. {opties.max_leeftijd} jaar)"
    print(titel)
    print()

    if opties.speler:
        oordelen = beoordeel(db, opties.speeldag, opdracht, opties.speler, opties.max_leeftijd)
        if not oordelen:
            print(f'Geen speler gevonden met "{opties.speler}" in de naam.')
        for oordeel in oordelen:
            print(f"{oordeel['naam']} ({oordeel['team']}): {oordeel['punten']:g} punten")
            print(f"    {oordeel['uitleg']}")
            if oordeel["plaats"] is not None:
                print(f"    Plaats {oordeel['plaats']} van {len(ranglijst)}")
    else:
        print(f"{'#':>3}  {'Speler':<18}{'Team':<6}{'Lft':>4}{'Min':>5}{'Punten':>8}  Uitleg")
        for plaats, speler in enumerate(ranglijst[: opties.top], start=1):
            leeftijd = "?" if speler["leeftijd"] is None else speler["leeftijd"]
            print(
                f"{plaats:>3}  {speler['naam']:<18}{speler['team']:<6}{leeftijd:>4}"
                f"{speler['minuten']:>5}{speler['punten']:>8g}  {speler['uitleg']}"
            )
        print()
        print(f"{len(ranglijst)} spelers voldeden aan de eisen en speelden.")

    db.close()


if __name__ == "__main__":
    main()
