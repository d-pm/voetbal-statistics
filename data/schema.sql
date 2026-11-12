-- Databaseschema voor de voetbaldata (zie PLAN.md §6).
-- Voorlopig in SQLite (bestand voetbal.db). Bij de verhuis naar Supabase (PostgreSQL)
-- veranderen alleen kleine dingen, zoals hoe id's automatisch aangemaakt worden.
--
-- Elke tabel heeft een eigen "id". Daarnaast bewaren we het vaste nummer van de bron
-- (fpl_code). FPL geeft elk seizoen nieuwe id's, maar de "code" blijft altijd hetzelfde.
-- Later komt er een kolom bij voor API-Football (Championship, League One).
--
-- Verander je hier iets? Verhoog dan SCHEMA_VERSIE in ingest.py. De database wordt
-- dan vanzelf opnieuw opgebouwd.

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
    positie         TEXT NOT NULL CHECK (positie IN ('GKP', 'DEF', 'MID', 'FWD')),
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
    status          TEXT NOT NULL CHECK (status IN ('gepland', 'bezig', 'afgelopen')),
    fpl_code        INTEGER UNIQUE
);

-- Eén rij per speeldag. De deadline is belangrijk voor het spel:
-- daarna mag je voor die speeldag niemand meer aanraden.
CREATE TABLE IF NOT EXISTS gameweeks (
    id              INTEGER PRIMARY KEY,
    competition_id  INTEGER NOT NULL REFERENCES competitions (id),
    seizoen         TEXT NOT NULL,
    speeldag        INTEGER NOT NULL,
    deadline        TEXT NOT NULL,                -- tijd in UTC
    afgelopen       INTEGER NOT NULL DEFAULT 0,   -- 1 = alle wedstrijden zijn gespeeld en nagekeken
    stats_geladen   INTEGER NOT NULL DEFAULT 0,   -- 1 = de definitieve cijfers staan in player_gameweek_stats
    UNIQUE (competition_id, seizoen, speeldag)
);

-- Wat een speler in één speeldag deed. Alleen spelers die minuten maakten krijgen een rij:
-- staat een speler er niet in, dan speelde hij niet.
CREATE TABLE IF NOT EXISTS player_gameweek_stats (
    player_id     INTEGER NOT NULL REFERENCES players (id),
    gameweek_id   INTEGER NOT NULL REFERENCES gameweeks (id),
    wedstrijden   INTEGER NOT NULL,     -- bijna altijd 1, soms 2 (dubbele speeldag)
    minuten       INTEGER NOT NULL,
    goals         INTEGER NOT NULL,
    assists       INTEGER NOT NULL,
    xg            REAL NOT NULL,        -- verwachte goals
    xa            REAL NOT NULL,        -- verwachte assists
    tackles       INTEGER NOT NULL,
    recoveries    INTEGER NOT NULL,
    cbi           INTEGER NOT NULL,     -- clearances, blocks en interceptions
    saves         INTEGER NOT NULL,
    clean_sheets  INTEGER NOT NULL,
    goals_tegen   INTEGER NOT NULL,
    PRIMARY KEY (player_id, gameweek_id)
);

-- Een index is een soort inhoudstafel: zo vindt de database snel de rijen die bij elkaar horen.
CREATE INDEX IF NOT EXISTS idx_players_team ON players (team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_speeldag ON fixtures (seizoen, speeldag);
CREATE INDEX IF NOT EXISTS idx_stats_gameweek ON player_gameweek_stats (gameweek_id);

-- Een view is een opgeslagen vraag die je gebruikt alsof het een tabel is.
-- Deze telt per speler en seizoen alle speeldagen op, en rekent ook per 90 minuten.
-- Probeer:  python query.py "SELECT naam, team, tackles_per_90 FROM player_totals WHERE minuten >= 450 ORDER BY tackles_per_90 DESC LIMIT 10"
CREATE VIEW IF NOT EXISTS player_totals AS
SELECT
    p.id                 AS player_id,
    p.naam,
    t.afkorting          AS team,
    p.positie,
    g.seizoen,
    COUNT(*)             AS speeldagen,
    SUM(s.minuten)       AS minuten,
    SUM(s.goals)         AS goals,
    SUM(s.assists)       AS assists,
    ROUND(SUM(s.xg), 2)  AS xg,
    ROUND(SUM(s.xa), 2)  AS xa,
    SUM(s.tackles)       AS tackles,
    SUM(s.recoveries)    AS recoveries,
    SUM(s.cbi)           AS cbi,
    SUM(s.saves)         AS saves,
    SUM(s.clean_sheets)  AS clean_sheets,
    ROUND(SUM(s.goals)      * 90.0 / SUM(s.minuten), 2) AS goals_per_90,
    ROUND(SUM(s.assists)    * 90.0 / SUM(s.minuten), 2) AS assists_per_90,
    ROUND(SUM(s.xg)         * 90.0 / SUM(s.minuten), 2) AS xg_per_90,
    ROUND(SUM(s.xa)         * 90.0 / SUM(s.minuten), 2) AS xa_per_90,
    ROUND(SUM(s.tackles)    * 90.0 / SUM(s.minuten), 2) AS tackles_per_90,
    ROUND(SUM(s.recoveries) * 90.0 / SUM(s.minuten), 2) AS recoveries_per_90,
    ROUND(SUM(s.cbi)        * 90.0 / SUM(s.minuten), 2) AS cbi_per_90,
    ROUND(SUM(s.saves)      * 90.0 / SUM(s.minuten), 2) AS saves_per_90
FROM player_gameweek_stats AS s
JOIN players   AS p ON p.id = s.player_id
JOIN teams     AS t ON t.id = p.team_id
JOIN gameweeks AS g ON g.id = s.gameweek_id
GROUP BY p.id, g.seizoen;
