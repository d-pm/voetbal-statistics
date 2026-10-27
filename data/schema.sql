-- Databaseschema voor de voetbaldata (zie PLAN.md §6).
-- Voorlopig in SQLite (bestand voetbal.db). Bij de verhuis naar Supabase (PostgreSQL)
-- veranderen alleen kleine dingen, zoals hoe id's automatisch aangemaakt worden.
--
-- Elke tabel heeft een eigen "id". Daarnaast bewaren we het vaste nummer van de bron
-- (fpl_code). FPL geeft elk seizoen nieuwe id's, maar de "code" blijft altijd hetzelfde.
-- Later komt er een kolom bij voor API-Football (Championship, League One).

CREATE TABLE IF NOT EXISTS competitions (
    id    INTEGER PRIMARY KEY,
    naam  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS teams (
    id              INTEGER PRIMARY KEY,
    naam            TEXT NOT NULL,
    afkorting       TEXT NOT NULL,
    competition_id  INTEGER NOT NULL REFERENCES competitions (id),
    fpl_code        INTEGER UNIQUE
);

CREATE TABLE IF NOT EXISTS players (
    id              INTEGER PRIMARY KEY,
    naam            TEXT NOT NULL,          -- korte naam, bv. "Saka"
    volledige_naam  TEXT NOT NULL,
    geboortedatum   TEXT,                   -- "2001-09-05", soms onbekend
    positie         TEXT NOT NULL,          -- GKP, DEF, MID of FWD
    team_id         INTEGER NOT NULL REFERENCES teams (id),
    nieuws          TEXT,                   -- blessures, schorsingen, ...
    fpl_code        INTEGER UNIQUE
);

CREATE TABLE IF NOT EXISTS fixtures (
    id              INTEGER PRIMARY KEY,
    competition_id  INTEGER NOT NULL REFERENCES competitions (id),
    seizoen         TEXT NOT NULL,          -- "2026/27"
    speeldag        INTEGER,
    thuis_team_id   INTEGER NOT NULL REFERENCES teams (id),
    uit_team_id     INTEGER NOT NULL REFERENCES teams (id),
    aftrap          TEXT,                   -- tijd in UTC, bv. "2026-10-31T15:00:00Z"
    thuis_score     INTEGER,
    uit_score       INTEGER,
    status          TEXT NOT NULL,          -- gepland, bezig of afgelopen
    fpl_code        INTEGER UNIQUE
);
