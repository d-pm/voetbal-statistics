"""
Eerste scout-tool: zoek spelers die passen bij een opdracht van de club.

Pas de opdracht hieronder aan en voer uit met:  python scout.py
"""

from fpl import haal_spelers_op

# ---- De opdracht van de club: pas dit aan --------------------------------
POSITIE = "DEF"         # GKP, DEF, MID of FWD
MAX_LEEFTIJD = 25
STATISTIEK = "tackles"  # goals, assists, xg, xa, tackles, recoveries, cbi, saves, clean_sheets
MIN_MINUTEN = 300       # met minder minuten zijn per-90-cijfers niet betrouwbaar
AANTAL = 10
# ---------------------------------------------------------------------------


def per_90(speler):
    """Hoeveel van de gekozen statistiek haalt deze speler per 90 minuten?"""
    return speler[STATISTIEK] / speler["minuten"] * 90


spelers = haal_spelers_op()

kandidaten = []
for speler in spelers:
    past_bij_opdracht = (
        speler["positie"] == POSITIE
        and speler["leeftijd"] is not None
        and speler["leeftijd"] <= MAX_LEEFTIJD
        and speler["minuten"] >= MIN_MINUTEN
    )
    if past_bij_opdracht:
        kandidaten.append(speler)

# Sorteer van hoog naar laag op de gekozen statistiek per 90 minuten
kandidaten.sort(key=per_90, reverse=True)

print(f"Opdracht: {POSITIE}, max. {MAX_LEEFTIJD} jaar, veel {STATISTIEK} (min. {MIN_MINUTEN} minuten)")
print(f"{len(kandidaten)} spelers voldoen. Top {AANTAL}:\n")
print(f"{'Naam':<18}{'Team':<6}{'Leeftijd':>9}{'Minuten':>9}{STATISTIEK:>12}{'per 90':>8}")

for speler in kandidaten[:AANTAL]:
    print(
        f"{speler['naam']:<18}{speler['team']:<6}{speler['leeftijd']:>9}"
        f"{speler['minuten']:>9}{speler[STATISTIEK]:>12}{per_90(speler):>8.2f}"
    )
    if speler["nieuws"]:
        print(f"    ! {speler['nieuws']}")
