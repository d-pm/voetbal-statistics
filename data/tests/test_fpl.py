from datetime import date

from fpl import bereken_leeftijd


def test_leeftijd_voor_en_na_de_verjaardag():
    assert bereken_leeftijd("2001-03-24", op=date(2026, 3, 23)) == 24  # morgen jarig
    assert bereken_leeftijd("2001-03-24", op=date(2026, 3, 24)) == 25  # vandaag jarig


def test_leeftijd_onbekend():
    assert bereken_leeftijd(None) is None
    assert bereken_leeftijd("") is None


def test_leeftijd_zonder_datum_is_vandaag():
    leeftijd = bereken_leeftijd("2000-01-01")
    assert leeftijd == bereken_leeftijd("2000-01-01", op=date.today())
