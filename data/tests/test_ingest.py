import sqlite3

from ingest import SCHEMA_VERSIE, bepaal_seizoen, laad_alles, open_database


def tel(db, tabel):
    return db.execute(f"SELECT COUNT(*) FROM {tabel}").fetchone()[0]


def test_seizoen(nep_data):
    assert bepaal_seizoen(nep_data) == "2026/27"


def test_alles_komt_in_de_database(gevulde_db):
    assert tel(gevulde_db, "competitions") == 1
    assert tel(gevulde_db, "teams") == 2
    assert tel(gevulde_db, "players") == 5
    assert tel(gevulde_db, "fixtures") == 3
    assert tel(gevulde_db, "gameweeks") == 3


def test_twee_keer_draaien_geeft_geen_dubbels(db, nep_data, nep_wedstrijden, nep_speeldagen):
    laad_alles(db, nep_data, nep_wedstrijden, nep_speeldagen)
    eerste_keer = {tabel: tel(db, tabel) for tabel in ("teams", "players", "fixtures", "gameweeks", "player_gameweek_stats")}

    laad_alles(db, nep_data, nep_wedstrijden, nep_speeldagen)
    tweede_keer = {tabel: tel(db, tabel) for tabel in eerste_keer}

    assert tweede_keer == eerste_keer


def test_wie_niet_speelt_krijgt_geen_rij(gevulde_db):
    # Speeldag 1: vier spelers speelden, de bankzitter niet. Speeldag 2: twee spelers.
    assert tel(gevulde_db, "player_gameweek_stats") == 4 + 2
    bankzitter = gevulde_db.execute(
        "SELECT COUNT(*) FROM player_gameweek_stats AS s JOIN players AS p ON p.id = s.player_id WHERE p.naam = 'Bankzitter'"
    ).fetchone()[0]
    assert bankzitter == 0


def test_cijfers_van_een_speeldag(gevulde_db):
    rij = gevulde_db.execute(
        """
        SELECT s.* FROM player_gameweek_stats AS s
        JOIN players AS p ON p.id = s.player_id
        JOIN gameweeks AS g ON g.id = s.gameweek_id
        WHERE p.naam = 'Spits' AND g.speeldag = 1
        """
    ).fetchone()
    assert rij["minuten"] == 78
    assert rij["goals"] == 1
    assert rij["xg"] == 0.5  # kwam binnen als de tekst "0.50"
    assert rij["wedstrijden"] == 1


def test_afgewerkte_speeldag_wordt_maar_een_keer_opgehaald(db, nep_data, nep_wedstrijden, nep_speeldagen):
    laad_alles(db, nep_data, nep_wedstrijden, nep_speeldagen)
    assert nep_speeldagen.opgevraagd == [1, 2]  # speeldag 3 is nog niet begonnen

    laad_alles(db, nep_data, nep_wedstrijden, nep_speeldagen)
    # Speeldag 1 is definitief en wordt overgeslagen. Speeldag 2 is nog bezig en wordt opnieuw opgehaald.
    assert nep_speeldagen.opgevraagd == [1, 2, 2]


def test_met_alles_wordt_elke_speeldag_opnieuw_opgehaald(db, nep_data, nep_wedstrijden, nep_speeldagen):
    laad_alles(db, nep_data, nep_wedstrijden, nep_speeldagen)
    laad_alles(db, nep_data, nep_wedstrijden, nep_speeldagen, alles=True)
    assert nep_speeldagen.opgevraagd == [1, 2, 1, 2]


def test_status_van_de_wedstrijden(gevulde_db):
    statussen = [rij[0] for rij in gevulde_db.execute("SELECT status FROM fixtures ORDER BY speeldag")]
    assert statussen == ["afgelopen", "bezig", "gepland"]


def test_view_met_totalen_en_per_90(gevulde_db):
    rij = gevulde_db.execute("SELECT * FROM player_totals WHERE naam = 'Doelman'").fetchone()
    assert rij["speeldagen"] == 2
    assert rij["minuten"] == 90 + 45
    assert rij["saves"] == 4 + 1
    assert rij["saves_per_90"] == round(5 * 90 / 135, 2)


def test_oude_database_wordt_opnieuw_opgebouwd(tmp_path):
    pad = tmp_path / "oud.db"
    oud = sqlite3.connect(pad)
    oud.execute("CREATE TABLE players (id INTEGER PRIMARY KEY, naam TEXT)")  # een schema van vroeger
    oud.execute("INSERT INTO players (naam) VALUES ('Oude rij')")
    oud.commit()
    oud.close()

    db = open_database(pad)
    assert tel(db, "players") == 0  # de oude tabel is vervangen door een lege nieuwe
    assert tel(db, "gameweeks") == 0  # en de nieuwe tabellen bestaan
    assert db.execute("PRAGMA user_version").fetchone()[0] == SCHEMA_VERSIE
    db.close()


def test_bestaande_database_blijft_staan(tmp_path, nep_data, nep_wedstrijden, nep_speeldagen):
    pad = tmp_path / "voetbal.db"
    db = open_database(pad)
    laad_alles(db, nep_data, nep_wedstrijden, nep_speeldagen)
    db.close()

    db = open_database(pad)  # opnieuw openen mag niets weggooien
    assert tel(db, "players") == 5
    db.close()
