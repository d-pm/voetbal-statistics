"""
Stel een vraag aan de database met SQL en zie het antwoord als tabel.

Voorbeeld:  python query.py "SELECT naam, afkorting FROM teams"

De database wordt alleen gelezen, dus je kunt hier niets per ongeluk kapotmaken.
"""

import sqlite3
import sys
from pathlib import Path

DATABASE = Path(__file__).parent / "voetbal.db"

if len(sys.argv) != 2:
    print('Gebruik: python query.py "SELECT ..."')
    sys.exit(1)

if not DATABASE.exists():
    print("Er is nog geen database. Draai eerst: python ingest.py")
    sys.exit(1)

db = sqlite3.connect(f"{DATABASE.as_uri()}?mode=ro", uri=True)  # mode=ro = alleen lezen

try:
    cursor = db.execute(sys.argv[1])
except sqlite3.Error as fout:
    print(f"Fout in je SQL: {fout}")
    sys.exit(1)

kolommen = [kolom[0] for kolom in cursor.description]
rijen = cursor.fetchall()

# Elke kolom wordt zo breed als de langste waarde erin
breedtes = []
for i, naam in enumerate(kolommen):
    langste = len(naam)
    for rij in rijen:
        langste = max(langste, len(str(rij[i])))
    breedtes.append(langste)

print("  ".join(naam.ljust(breedte) for naam, breedte in zip(kolommen, breedtes)))
print("  ".join("-" * breedte for breedte in breedtes))
for rij in rijen:
    print("  ".join(str(waarde).ljust(breedte) for waarde, breedte in zip(rij, breedtes)))
print(f"\n{len(rijen)} rijen")

db.close()
