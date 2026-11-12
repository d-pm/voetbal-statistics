from puntentelling import NAMEN, OPDRACHTEN, POSITIES, bereken_punten, controleer_eisen


def test_spits_die_scoort():
    punten, uitleg = bereken_punten({"goals": 2, "xg": 0.5}, OPDRACHTEN["spits"])
    assert punten == 2 * 5 + 0.5 * 3
    assert uitleg == "2 goals × 5 + 0.5 xG × 3"


def test_verdediger_die_ballen_afpakt():
    stats = {"tackles": 5, "cbi": 3, "recoveries": 4}
    punten, _ = bereken_punten(stats, OPDRACHTEN["balafpakker"])
    assert punten == 5 + 3 + 4 * 0.5


def test_keeper_die_de_nul_houdt():
    punten, _ = bereken_punten({"clean_sheets": 1, "saves": 6}, OPDRACHTEN["keeper"])
    assert punten == 4 + 6


def test_punten_worden_afgerond_op_een_decimaal():
    punten, _ = bereken_punten({"assists": 0, "xa": 0.37}, OPDRACHTEN["spelmaker"])
    assert punten == 1.1  # 0.37 × 3 = 1.11


def test_verkeerde_positie():
    reden = controleer_eisen("FWD", 22, OPDRACHTEN["balafpakker"])
    assert reden == "is een aanvaller, de club zoekt een verdediger"


def test_te_oud():
    assert controleer_eisen("DEF", 25, OPDRACHTEN["balafpakker"], max_leeftijd=25) is None
    assert "26 jaar" in controleer_eisen("DEF", 26, OPDRACHTEN["balafpakker"], max_leeftijd=25)


def test_onbekende_leeftijd_telt_alleen_als_er_een_leeftijdseis_is():
    assert controleer_eisen("DEF", None, OPDRACHTEN["balafpakker"]) is None
    assert controleer_eisen("DEF", None, OPDRACHTEN["balafpakker"], max_leeftijd=25) is not None


def test_elke_opdracht_is_volledig_ingevuld():
    # Vangt typfouten op als je een opdracht toevoegt of aanpast
    for sleutel, opdracht in OPDRACHTEN.items():
        assert opdracht["titel"], sleutel
        assert opdracht["positie"] in POSITIES, sleutel
        assert opdracht["punten"], sleutel
        for statistiek in opdracht["punten"]:
            assert statistiek in NAMEN, f"{sleutel}: onbekende statistiek {statistiek}"
