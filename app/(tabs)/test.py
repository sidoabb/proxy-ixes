import re
from datetime import datetime


def parser_datetime(date_str):
    if 'T' in date_str:
        try:
            return datetime.strptime(date_str, "%Y%m%dT%H%M%SZ")
        except ValueError:
            return datetime.strptime(date_str, "%Y%m%dT%H%M%S")
    else:
        return datetime.strptime(date_str, "%Y%m%d")


def lire_ics(fichier):
    with open(fichier, 'r', encoding='utf-8') as f:
        contenu = f.read()

    evenements_bruts = contenu.split("BEGIN:VEVENT")[1:]

    evenements = []

    for evt in evenements_bruts:
        dtstart_match = re.search(r'DTSTART(?:;[^:]+)?:([^\r\n]+)', evt)
        dtend_match = re.search(r'DTEND(?:;[^:]+)?:([^\r\n]+)', evt)
        summary_match = re.search(r'SUMMARY:(.+)', evt)
        location_match = re.search(r'LOCATION:(.+)', evt)

        if dtstart_match and dtend_match and summary_match:
            dtstart = parser_datetime(dtstart_match.group(1))
            dtend = parser_datetime(dtend_match.group(1))
            summary = summary_match.group(1).strip()
            location = location_match.group(1).strip() if location_match else "Non précisé"

            evenements.append({
                "matière": summary,
                "début": dtstart,
                "fin": dtend,
                "lieu": location
            })

    return evenements


fichier_ics = "ADECal (1).ics"
evenements = lire_ics(fichier_ics)

for e in evenements:
    print(f"{e['matière']} — {e['début'].strftime('%A %d %B %Y, %H:%M')} à {e['fin'].strftime('%H:%M')} — Salle : {e['lieu']}")
