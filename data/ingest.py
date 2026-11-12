"""
Laadt de Premier League-data in de lokale database (voetbal.db):
teams, spelers, wedstrijden, speeldagen en de cijfers van elke speler per speeldag.

Je mag dit zo vaak draaien als je wilt: bestaande rijen worden bijgewerkt, niet verdubbeld.
Een speeldag die helemaal klaar is wordt maar één keer opgehaald.

Uitvoeren:  python ingest.py
            python ingest.py --alles    (haalt ook de afgewerkte speeldagen opnieuw op)
"""

import argparse
import sqlite3
from pathlib import Path

from fpl import haal_basisdata_op, haal_speeldag_op, haal_wedstrijden_op

MAP = Path(__file__).parent
DATABASE = MAP / "voetbal.db"
SCHEMA = MAP / "schema.sql"

# Verhoog dit getal als je schema.sql aanpast. De database wordt dan opnieuw opgebouwd.
# Dat kan zonder verlies, want alles wat erin staat halen we opnieuw op bij de FPL API.
SCHEMA_VERSIE = 2

TABELLEN = ("competitions", "teams", "players", "fixtures", "gameweeks", "player_gameweek_stats")


def open_database(pad=DATABASE):
    """Opent de database en maakt de tabellen aan als ze nog niet bestaan."""
    db = sqlite3.connect(pad)

    # "user_version" is een getal dat SQLite voor ons bijhoudt. Wij bewaren er de schemaversie in.
    versie = db.execute("PRAGMA user_version").fetchone()[0]
    oude_onderdelen = db.execute(
        "SELECT type, name FROM sqlite_master WHERE type IN ('view', 'table') AND name NOT LIKE 'sqlite_%'"
    ).fetchall()
    if oude_onderdelen and versie != SCHEMA_VERSIE:
        print("De tabellen zijn veranderd sinds de vorige keer: ik bouw de database opnieuw op.")
        for soort, naam in oude_onderdelen:
            db.execute(f"DROP {soort.upper()} IF EXISTS {naam}")

    db.execute("PRAGMA foreign_keys = ON")  # SQLite controleert verwijzingen tussen tabellen pas als je dit aanzet
    db.executescript(SCHEMA.read_text(encoding="utf-8"))
    db.execute(f"PRAGMA user_version = {SCHEMA_VERSIE}")
    return db


def bepaal_seizoen(data):
    """De eerste speeldag van 2026 betekent seizoen "2026/27"."""
    startjaar = int(data["events"][0]["deadline_time"][:4])
    return f"{startjaar}/{(startjaar + 1) % 100:02d}"


def bewaar_competitie(db, naam):
    """Voegt de competitie toe als ze nog niet bestaat en geeft haar id terug."""
    db.execute("INSERT INTO competitions (naam) VALUES (?) ON CONFLICT (naam) DO NOTHING", (naam,))
    return db.execute("SELECT id FROM competitions WHERE naam = ?", (naam,)).fetchone()[0]


def bewaar_teams(db, teams, competitie_id):
    """
    Bewaart de teams en geeft een woordenboek terug: FPL-id -> ons eigen id.
    Dat hebben we nodig om spelers en wedstrijden aan het juiste team te koppelen.
    """
    for team in teams:
        # "ON CONFLICT ... DO UPDATE" = bestaat het team al (zelfde fpl_code), werk het dan bij.
        db.execute(
            """
            INSERT INTO teams (naam, afkorting, competition_id, fpl_code)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (fpl_code) DO UPDATE SET
                naam = excluded.naam,
                afkorting = excluded.afkorting,
                competition_id = excluded.competition_id
            """,
            (team["name"], team["short_name"], competitie_id, team["code"]),
        )

    eigen_id_per_code = dict(db.execute("SELECT fpl_code, id FROM teams").fetchall())
    return {team["id"]: eigen_id_per_code[team["code"]] for team in teams}


def bewaar_spelers(db, spelers, posities, team_ids):
    """
    Bewaart de spelers en geeft een woordenboek terug: FPL-id -> ons eigen id.
    Dat hebben we nodig om de cijfers per speeldag aan de juiste speler te koppelen.
    """
    for p in spelers:
        db.execute(
            """
            INSERT INTO players (naam, volledige_naam, geboortedatum, positie, team_id, nieuws, fpl_code)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (fpl_code) DO UPDATE SET
                naam = excluded.naam,
                volledige_naam = excluded.volledige_naam,
                geboortedatum = excluded.geboortedatum,
                positie = excluded.positie,
                team_id = excluded.team_id,
                nieuws = excluded.nieuws
            """,
            (
                p["web_name"],
                f"{p['first_name']} {p['second_name']}",
                p["birth_date"],
                posities[p["element_type"]],
                team_ids[p["team"]],
                p["news"],
                p["code"],
            ),
        )

    eigen_id_per_code = dict(db.execute("SELECT fpl_code, id FROM players").fetchall())
    return {p["id"]: eigen_id_per_code[p["code"]] for p in spelers}


def bewaar_wedstrijden(db, wedstrijden, competitie_id, seizoen, team_ids):
    for w in wedstrijden:
        if w["finished"]:
            status = "afgelopen"
        elif w["started"]:
            status = "bezig"
        else:
            status = "gepland"

        db.execute(
            """
            INSERT INTO fixtures (competition_id, seizoen, speeldag, thuis_team_id, uit_team_id,
                                  aftrap, thuis_score, uit_score, status, fpl_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (fpl_code) DO UPDATE SET
                speeldag = excluded.speeldag,
                aftrap = excluded.aftrap,
                thuis_score = excluded.thuis_score,
                uit_score = excluded.uit_score,
                status = excluded.status
            """,
            (
                competitie_id,
                seizoen,
                w["event"],
                team_ids[w["team_h"]],
                team_ids[w["team_a"]],
                w["kickoff_time"],
                w["team_h_score"],
                w["team_a_score"],
                status,
                w["code"],
            ),
        )


def bewaar_speeldagen(db, speeldagen, competitie_id, seizoen):
    for dag in speeldagen:
        # Pas als FPL alles nagekeken heeft ("data_checked") veranderen de cijfers niet meer
        afgelopen = dag["finished"] and dag["data_checked"]
        db.execute(
            """
            INSERT INTO gameweeks (competition_id, seizoen, speeldag, deadline, afgelopen)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (competition_id, seizoen, speeldag) DO UPDATE SET
                deadline = excluded.deadline,
                afgelopen = excluded.afgelopen
            """,
            (competitie_id, seizoen, dag["id"], dag["deadline_time"], int(afgelopen)),
        )


def bewaar_speeldagstats(db, gameweek_id, cijfers, speler_ids):
    """Bewaart de cijfers van één speeldag en geeft terug hoeveel spelers er speelden."""
    # Eerst de oude rijen van deze speeldag weg: zo blijft er niets staan dat FPL intussen verbeterd heeft
    db.execute("DELETE FROM player_gameweek_stats WHERE gameweek_id = ?", (gameweek_id,))

    aantal = 0
    for speler in cijfers:
        stats = speler["stats"]
        if stats["minutes"] == 0 or speler["id"] not in speler_ids:
            continue  # speelde niet (of FPL kent de speler niet meer)

        db.execute(
            """
            INSERT INTO player_gameweek_stats (player_id, gameweek_id, wedstrijden, minuten, goals, assists,
                                               xg, xa, tackles, recoveries, cbi, saves, clean_sheets, goals_tegen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                speler_ids[speler["id"]],
                gameweek_id,
                len(speler["explain"]),  # één blokje uitleg per wedstrijd in deze speeldag
                stats["minutes"],
                stats["goals_scored"],
                stats["assists"],
                float(stats["expected_goals"]),  # komt binnen als tekst, bv. "0.50"
                float(stats["expected_assists"]),
                stats["tackles"],
                stats["recoveries"],
                stats["clearances_blocks_interceptions"],
                stats["saves"],
                stats["clean_sheets"],
                stats["goals_conceded"],
            ),
        )
        aantal += 1
    return aantal


def laad_alles(db, data, wedstrijden, haal_speeldag, alles=False):
    """
    Zet alle data in de database.

    "haal_speeldag" is de functie die de cijfers van één speeldag ophaalt. Die geven we mee
    als argument, zodat de tests een nepversie kunnen gebruiken die niet naar het internet gaat.
    """
    posities = {pos["id"]: pos["singular_name_short"] for pos in data["element_types"]}
    seizoen = bepaal_seizoen(data)

    # "with db" = alles hierbinnen wordt samen opgeslagen. Gaat er iets mis, dan wordt niets opgeslagen.
    with db:
        competitie_id = bewaar_competitie(db, "Premier League")
        team_ids = bewaar_teams(db, data["teams"], competitie_id)
        speler_ids = bewaar_spelers(db, data["elements"], posities, team_ids)
        bewaar_wedstrijden(db, wedstrijden, competitie_id, seizoen, team_ids)
        bewaar_speeldagen(db, data["events"], competitie_id, seizoen)

    for dag in data["events"]:
        begonnen = dag["finished"] or dag["is_current"]
        if not begonnen:
            continue

        gameweek_id, stats_geladen = db.execute(
            "SELECT id, stats_geladen FROM gameweeks WHERE competition_id = ? AND seizoen = ? AND speeldag = ?",
            (competitie_id, seizoen, dag["id"]),
        ).fetchone()
        if stats_geladen and not alles:
            continue  # de definitieve cijfers hebben we al

        cijfers = haal_speeldag(dag["id"])
        definitief = dag["finished"] and dag["data_checked"]
        with db:
            aantal = bewaar_speeldagstats(db, gameweek_id, cijfers["elements"], speler_ids)
            db.execute("UPDATE gameweeks SET stats_geladen = ? WHERE id = ?", (int(definitief), gameweek_id))
        print(f"  Speeldag {dag['id']}: {aantal} spelers" + ("" if definitief else " (nog niet definitief)"))


def main():
    parser = argparse.ArgumentParser(description="Laadt de Premier League-data in voetbal.db.")
    parser.add_argument("--alles", action="store_true", help="haal ook de afgewerkte speeldagen opnieuw op")
    opties = parser.parse_args()

    print("Data ophalen bij de FPL API...")
    data = haal_basisdata_op()
    wedstrijden = haal_wedstrijden_op()

    db = open_database()
    laad_alles(db, data, wedstrijden, haal_speeldag_op, alles=opties.alles)

    print(f"Opgeslagen in {DATABASE.name}:")
    for tabel in TABELLEN:
        aantal = db.execute(f"SELECT COUNT(*) FROM {tabel}").fetchone()[0]
        print(f"  {tabel:<23}{aantal:>6} rijen")
    db.close()


if __name__ == "__main__":
    main()
