"""
Nepdata voor de tests: een mini-competitie met 2 teams, 5 spelers en 3 speeldagen.

De tests gaan nooit naar het internet. Zo zijn ze snel en geven ze altijd hetzelfde resultaat.
pytest leest dit bestand vanzelf: elke functie met @pytest.fixture kun je in een test
gebruiken door haar naam als argument te schrijven.
"""

import sqlite3

import pytest

from ingest import laad_alles, open_database


def maak_speler(id, naam, team, positie, geboortedatum):
    return {
        "id": id,  # het id van dit seizoen
        "code": 1000 + id,  # het vaste nummer
        "web_name": naam,
        "first_name": "Voornaam",
        "second_name": naam,
        "team": team,
        "element_type": positie,
        "birth_date": geboortedatum,
        "news": "",
    }


def maak_cijfers(id, minuten, **stats):
    """De cijfers van één speler in één speeldag, in de vorm van de FPL API."""
    alles = {
        "minutes": minuten,
        "goals_scored": 0,
        "assists": 0,
        "expected_goals": "0.00",
        "expected_assists": "0.00",
        "tackles": 0,
        "recoveries": 0,
        "clearances_blocks_interceptions": 0,
        "saves": 0,
        "clean_sheets": 0,
        "goals_conceded": 0,
    }
    alles.update(stats)
    wedstrijden = [{"fixture": 1, "stats": []}] if minuten > 0 else []
    return {"id": id, "stats": alles, "explain": wedstrijden}


@pytest.fixture
def nep_data():
    return {
        "events": [
            # speeldag 1 is helemaal klaar, speeldag 2 is bezig, speeldag 3 moet nog beginnen
            {"id": 1, "deadline_time": "2026-08-21T17:30:00Z", "finished": True, "data_checked": True, "is_current": False},
            {"id": 2, "deadline_time": "2026-08-28T17:30:00Z", "finished": False, "data_checked": False, "is_current": True},
            {"id": 3, "deadline_time": "2026-09-11T17:30:00Z", "finished": False, "data_checked": False, "is_current": False},
        ],
        "teams": [
            {"id": 1, "code": 3, "name": "Arsenal", "short_name": "ARS"},
            {"id": 2, "code": 7, "name": "Aston Villa", "short_name": "AVL"},
        ],
        "element_types": [
            {"id": 1, "singular_name_short": "GKP"},
            {"id": 2, "singular_name_short": "DEF"},
            {"id": 3, "singular_name_short": "MID"},
            {"id": 4, "singular_name_short": "FWD"},
        ],
        "elements": [
            maak_speler(1, "Doelman", team=1, positie=1, geboortedatum="1995-01-01"),
            maak_speler(2, "Jonge Back", team=1, positie=2, geboortedatum="2004-06-15"),
            maak_speler(3, "Oude Back", team=2, positie=2, geboortedatum="1992-03-10"),
            maak_speler(4, "Spits", team=2, positie=4, geboortedatum="2000-12-31"),
            maak_speler(5, "Bankzitter", team=1, positie=2, geboortedatum=None),
        ],
    }


@pytest.fixture
def nep_wedstrijden():
    return [
        {"code": 501, "event": 1, "finished": True, "started": True, "kickoff_time": "2026-08-22T14:00:00Z",
         "team_h": 1, "team_a": 2, "team_h_score": 2, "team_a_score": 1},
        {"code": 502, "event": 2, "finished": False, "started": True, "kickoff_time": "2026-08-29T14:00:00Z",
         "team_h": 2, "team_a": 1, "team_h_score": 0, "team_a_score": 0},
        {"code": 503, "event": 3, "finished": False, "started": False, "kickoff_time": "2026-09-12T14:00:00Z",
         "team_h": 1, "team_a": 2, "team_h_score": None, "team_a_score": None},
    ]


class NepSpeeldagen:
    """Doet alsof het de FPL API is, en onthoudt welke speeldagen er opgevraagd werden."""

    def __init__(self):
        self.opgevraagd = []

    def __call__(self, speeldag):
        self.opgevraagd.append(speeldag)
        if speeldag == 1:
            cijfers = [
                maak_cijfers(1, 90, saves=4, goals_conceded=1),
                maak_cijfers(2, 90, tackles=5, clearances_blocks_interceptions=3, recoveries=4),
                maak_cijfers(3, 90, tackles=2, clearances_blocks_interceptions=9, recoveries=6),
                maak_cijfers(4, 78, goals_scored=1, expected_goals="0.50"),
                maak_cijfers(5, 0),  # zat op de bank
            ]
        else:
            cijfers = [
                maak_cijfers(1, 45, saves=1),
                maak_cijfers(4, 45, expected_goals="0.25"),
            ]
        return {"elements": cijfers}


@pytest.fixture
def nep_speeldagen():
    return NepSpeeldagen()


@pytest.fixture
def db():
    """Een lege database in het geheugen: ze verdwijnt na elke test."""
    database = open_database(":memory:")
    yield database
    database.close()


@pytest.fixture
def gevulde_db(db, nep_data, nep_wedstrijden, nep_speeldagen):
    laad_alles(db, nep_data, nep_wedstrijden, nep_speeldagen)
    db.row_factory = sqlite3.Row  # zo kun je een kolom opvragen met haar naam: rij["naam"]
    return db
