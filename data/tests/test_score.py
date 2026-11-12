from puntentelling import OPDRACHTEN
from score import beoordeel, rangschik

BALAFPAKKER = OPDRACHTEN["balafpakker"]


def test_beste_verdediger_staat_eerst(gevulde_db):
    ranglijst = rangschik(gevulde_db, 1, BALAFPAKKER)

    # Oude Back: 2 + 9 + 6/2 = 14 punten. Jonge Back: 5 + 3 + 4/2 = 10 punten.
    assert [(s["naam"], s["punten"]) for s in ranglijst] == [("Oude Back", 14), ("Jonge Back", 10)]
    assert ranglijst[0]["uitleg"] == "2 tackles × 1 + 9 CBI × 1 + 6 recoveries × 0.5"


def test_alleen_de_gevraagde_positie(gevulde_db):
    namen = [s["naam"] for s in rangschik(gevulde_db, 1, OPDRACHTEN["spits"])]
    assert namen == ["Spits"]


def test_maximumleeftijd(gevulde_db):
    namen = [s["naam"] for s in rangschik(gevulde_db, 1, BALAFPAKKER, max_leeftijd=23)]
    assert namen == ["Jonge Back"]


def test_leeftijd_telt_op_de_dag_van_de_deadline(gevulde_db):
    # Jonge Back is geboren op 15 juni 2004. Op de deadline (21 augustus 2026) is hij 22.
    ranglijst = rangschik(gevulde_db, 1, BALAFPAKKER, max_leeftijd=23)
    assert ranglijst[0]["leeftijd"] == 22


def test_speeldag_zonder_cijfers(gevulde_db):
    assert rangschik(gevulde_db, 3, BALAFPAKKER) == []


def test_aanbeveling_die_punten_oplevert(gevulde_db):
    [oordeel] = beoordeel(gevulde_db, 1, BALAFPAKKER, "Jonge")
    assert oordeel["punten"] == 10
    assert oordeel["plaats"] == 2


def test_aanbeveling_met_de_verkeerde_positie(gevulde_db):
    [oordeel] = beoordeel(gevulde_db, 1, BALAFPAKKER, "Spits")
    assert oordeel["punten"] == 0
    assert oordeel["plaats"] is None
    assert "aanvaller" in oordeel["uitleg"]


def test_aanbeveling_die_niet_speelde(gevulde_db):
    [oordeel] = beoordeel(gevulde_db, 1, BALAFPAKKER, "Bankzitter")
    assert oordeel["punten"] == 0
    assert oordeel["uitleg"] == "speelde niet in deze speeldag"


def test_zoeken_vindt_meerdere_spelers(gevulde_db):
    namen = [oordeel["naam"] for oordeel in beoordeel(gevulde_db, 1, BALAFPAKKER, "Back")]
    assert namen == ["Jonge Back", "Oude Back"]
