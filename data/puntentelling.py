"""
De spelregels in cijfers: welke soorten opdrachten bestaan er, en hoeveel punten
levert elke statistiek op? (Zie PLAN.md §2.)

Dit is het enige bestand dat je moet aanpassen om de puntentelling bij te stellen.
Test een nieuwe formule eerst op oude speeldagen met:  python score.py 10 spits
"""

# Per opdracht: welke positie de club zoekt en hoeveel punten elke statistiek waard is.
# De namen van de statistieken zijn de kolommen van de tabel player_gameweek_stats.
OPDRACHTEN = {
    "spits": {
        "titel": "Een spits die scoort",
        "positie": "FWD",
        "punten": {"goals": 5, "xg": 3},
    },
    "spelmaker": {
        "titel": "Een creatieve middenvelder",
        "positie": "MID",
        "punten": {"assists": 4, "xa": 3},
    },
    "balafpakker": {
        "titel": "Een verdediger die ballen afpakt",
        "positie": "DEF",
        "punten": {"tackles": 1, "cbi": 1, "recoveries": 0.5},
    },
    "keeper": {
        "titel": "Een keeper die de nul houdt",
        "positie": "GKP",
        "punten": {"clean_sheets": 4, "saves": 1},
    },
}

# Hoe we een statistiek in de uitleg noemen
NAMEN = {
    "goals": "goals",
    "assists": "assists",
    "xg": "xG",
    "xa": "xA",
    "tackles": "tackles",
    "recoveries": "recoveries",
    "cbi": "CBI",
    "saves": "saves",
    "clean_sheets": "clean sheets",
}

POSITIES = {"GKP": "keeper", "DEF": "verdediger", "MID": "middenvelder", "FWD": "aanvaller"}


def bereken_punten(stats, opdracht):
    """
    Telt de punten van één speler in één speeldag.

    "stats" is een woordenboek (of een rij uit de database) met de cijfers van de speler.
    Geeft twee dingen terug: de punten en de uitleg, bv. (11.5, "2 goals × 5 + 0.5 xG × 3").
    """
    totaal = 0
    delen = []
    for statistiek, per_stuk in opdracht["punten"].items():
        waarde = stats[statistiek]
        totaal += waarde * per_stuk
        delen.append(f"{waarde:g} {NAMEN[statistiek]} × {per_stuk:g}")
    return round(totaal, 1), " + ".join(delen)


def controleer_eisen(positie, leeftijd, opdracht, max_leeftijd=None):
    """
    Voldoet de speler aan de harde eisen van de opdracht?

    Geeft None terug als alles in orde is, anders de reden waarom niet.
    Wie niet voldoet krijgt 0 punten, hoe goed hij ook speelde.
    """
    if positie != opdracht["positie"]:
        return f"is een {POSITIES[positie]}, de club zoekt een {POSITIES[opdracht['positie']]}"
    if max_leeftijd is not None:
        if leeftijd is None:
            return "heeft geen bekende geboortedatum"
        if leeftijd > max_leeftijd:
            return f"is {leeftijd} jaar, de club zoekt iemand van hoogstens {max_leeftijd}"
    return None
