"""
Haalt Premier League-data op bij de (onofficiële) Fantasy Premier League API
en zet die om naar een eenvoudige lijst met spelers.

Snel testen:  python fpl.py
"""

import time
from datetime import date

import requests

BASIS_URL = "https://fantasy.premierleague.com/api"

# Zo weet de FPL-server wie er aanklopt. Dat is beleefd bij een API zonder sleutel.
KOPTEKST = {"User-Agent": "voetbal-statistics (studentenproject, github.com/d-pm/voetbal-statistics)"}

POGINGEN = 3  # zo vaak proberen we het opnieuw als de API even niet antwoordt


def haal_op(pad):
    """Vraagt één adres van de FPL API op, bv. "fixtures", en geeft het antwoord terug."""
    for poging in range(1, POGINGEN + 1):
        try:
            antwoord = requests.get(f"{BASIS_URL}/{pad}/", headers=KOPTEKST, timeout=30)
            antwoord.raise_for_status()  # maakt er een fout van als de API bv. "404" antwoordt
            return antwoord.json()
        except requests.RequestException as fout:
            if poging == POGINGEN:
                raise  # na de laatste poging geven we de fout door
            wachttijd = 2 * poging
            print(f"  De FPL API antwoordde niet ({fout}). Nieuwe poging over {wachttijd} seconden...")
            time.sleep(wachttijd)


def haal_basisdata_op():
    """Alle teams, spelers en speeldagen van dit seizoen in één keer."""
    return haal_op("bootstrap-static")


def haal_wedstrijden_op():
    """Alle 380 wedstrijden van dit seizoen, gespeeld en nog te spelen."""
    return haal_op("fixtures")


def haal_speeldag_op(speeldag):
    """Wat elke speler deed in één speeldag: minuten, goals, xG, tackles, ..."""
    return haal_op(f"event/{speeldag}/live")


def bereken_leeftijd(geboortedatum, op=None):
    """
    '2001-03-24' -> 25. Geeft None terug als de geboortedatum onbekend is.

    Met "op" kies je de dag waarop je de leeftijd wilt weten, bv. de deadline van
    een speeldag. Zonder "op" is dat vandaag.
    """
    if not geboortedatum:
        return None
    geboren = date.fromisoformat(geboortedatum)
    dag = op or date.today()
    leeftijd = dag.year - geboren.year
    if (dag.month, dag.day) < (geboren.month, geboren.day):
        leeftijd -= 1  # dat jaar nog niet jarig geweest
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
