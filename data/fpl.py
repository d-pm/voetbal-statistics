"""
Haalt Premier League-data op bij de (onofficiële) Fantasy Premier League API
en zet die om naar een eenvoudige lijst met spelers.

Snel testen:  python fpl.py
"""

from datetime import date

import requests

BASIS_URL = "https://fantasy.premierleague.com/api"


def haal_basisdata_op():
    """Alle teams, spelers en speeldagen van dit seizoen in één keer."""
    antwoord = requests.get(f"{BASIS_URL}/bootstrap-static/", timeout=30)
    antwoord.raise_for_status()  # stopt met een duidelijke fout als de API niet antwoordt
    return antwoord.json()


def haal_wedstrijden_op():
    """Alle 380 wedstrijden van dit seizoen, gespeeld en nog te spelen."""
    antwoord = requests.get(f"{BASIS_URL}/fixtures/", timeout=30)
    antwoord.raise_for_status()
    return antwoord.json()


def bereken_leeftijd(geboortedatum):
    """'2001-03-24' -> 25. Geeft None terug als de geboortedatum onbekend is."""
    if not geboortedatum:
        return None
    geboren = date.fromisoformat(geboortedatum)
    vandaag = date.today()
    leeftijd = vandaag.year - geboren.year
    if (vandaag.month, vandaag.day) < (geboren.month, geboren.day):
        leeftijd -= 1  # dit jaar nog niet jarig geweest
    return leeftijd


def haal_spelers_op():
    """Geeft een lijst terug met één woordenboek (dict) per speler."""
    data = haal_basisdata_op()

    # Opzoektabellen: team-id -> "ARS", positie-id -> "DEF"
    teams = {team["id"]: team["short_name"] for team in data["teams"]}
    posities = {pos["id"]: pos["singular_name_short"] for pos in data["element_types"]}

    spelers = []
    for p in data["elements"]:
        spelers.append({
            "fpl_id": p["id"],
            "naam": p["web_name"],
            "team": teams[p["team"]],
            "positie": posities[p["element_type"]],  # GKP, DEF, MID of FWD
            "leeftijd": bereken_leeftijd(p["birth_date"]),
            "nieuws": p["news"],  # bv. blessures of schorsingen
            "minuten": p["minutes"],
            "goals": p["goals_scored"],
            "assists": p["assists"],
            # xG en xA komen binnen als tekst ("1.23"), dus omzetten naar een getal
            "xg": float(p["expected_goals"]),
            "xa": float(p["expected_assists"]),
            "tackles": p["tackles"],
            "recoveries": p["recoveries"],
            "cbi": p["clearances_blocks_interceptions"],
            "saves": p["saves"],
            "clean_sheets": p["clean_sheets"],
        })
    return spelers


# Dit stuk draait alleen als je dit bestand zelf uitvoert (python fpl.py),
# niet als een ander bestand het importeert.
if __name__ == "__main__":
    spelers = haal_spelers_op()
    print(f"{len(spelers)} spelers opgehaald. Voorbeeld:")
    print(spelers[0])
