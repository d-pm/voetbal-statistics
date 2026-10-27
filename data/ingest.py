"""
Laadt de Premier League-teams, -spelers en -wedstrijden in de lokale database (voetbal.db).

Je mag dit zo vaak draaien als je wilt: bestaande rijen worden bijgewerkt, niet verdubbeld.

Uitvoeren:  python ingest.py
"""

import sqlite3
from pathlib import Path

from fpl import haal_basisdata_op, haal_wedstrijden_op

MAP = Path(__file__).parent
DATABASE = MAP / "voetbal.db"
SCHEMA = MAP / "schema.sql"


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


def main():
    print("Data ophalen bij de FPL API...")
    data = haal_basisdata_op()
    wedstrijden = haal_wedstrijden_op()
    posities = {pos["id"]: pos["singular_name_short"] for pos in data["element_types"]}

    db = sqlite3.connect(DATABASE)
    db.execute("PRAGMA foreign_keys = ON")  # SQLite controleert verwijzingen tussen tabellen pas als je dit aanzet
    db.executescript(SCHEMA.read_text(encoding="utf-8"))  # maakt de tabellen als ze nog niet bestaan

    competitie_id = bewaar_competitie(db, "Premier League")
    team_ids = bewaar_teams(db, data["teams"], competitie_id)
    bewaar_spelers(db, data["elements"], posities, team_ids)
    bewaar_wedstrijden(db, wedstrijden, competitie_id, bepaal_seizoen(data), team_ids)
    db.commit()  # pas nu worden de wijzigingen echt opgeslagen

    print(f"Opgeslagen in {DATABASE.name}:")
    for tabel in ("competitions", "teams", "players", "fixtures"):
        aantal = db.execute(f"SELECT COUNT(*) FROM {tabel}").fetchone()[0]
        print(f"  {tabel:<13}{aantal:>4} rijen")
    db.close()


if __name__ == "__main__":
    main()
