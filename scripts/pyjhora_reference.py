"""
Reference values for src/lib/pyjhoraReference.test.ts, from PyJHora (another Jyotish program), so that the app's
calculations are checked against someone else's.

    python -m venv venv && venv/bin/pip install PyJHora pyswisseph numpy geocoder pytz timezonefinder geopy python-dateutil
    venv/bin/python scripts/pyjhora_reference.py src/lib/fixtures/pyjhoraCharts.json

Lahiri ayanamsa, Rahu and Ketu as the mean node (and Rahu as the true node, as 'rahuTrue'), the time zone given for each place (no daylight saving lookup). Positions are sidereal
longitudes in degrees; the Vimsottari lists give the start of each mahadasha as PyJHora works it out.
"""
import contextlib
import json
import sys

# PyJHora prints its search path when it is imported.
with contextlib.redirect_stdout(sys.stderr):
    from jhora import const, utils
    from jhora.panchanga import drik
    from jhora.horoscope.chart import charts
    from jhora.horoscope.dhasa.graha import vimsottari

# label, (year, month, day, hour, minute, second), latitude, longitude, UTC offset in hours
CHARTS = [
    ('Delhi 1947', (1947, 8, 15, 9, 15, 0), 28.6139, 77.2090, 5.5),
    ('Helsinki 1985', (1985, 3, 7, 14, 30, 0), 60.1699, 24.9384, 2.0),
    ('Porvoo 1975', (1975, 11, 12, 3, 20, 0), 60.3932, 25.6650, 2.0),
    ('Sydney 1992', (1992, 12, 25, 18, 45, 0), -33.8688, 151.2093, 11.0),
    ('New York 1960', (1960, 11, 25, 0, 22, 0), 40.7128, -74.0060, -5.0),
    ('Rio de Janeiro 1978', (1978, 6, 15, 23, 5, 0), -22.9068, -43.1729, -3.0),
    ('Oulu 2001', (2001, 6, 21, 12, 0, 0), 65.0121, 25.4651, 3.0),
    ('Tokyo 2010', (2010, 2, 14, 5, 55, 0), 35.6762, 139.6503, 9.0),
    ('Cairo 1899', (1899, 12, 31, 23, 59, 0), 30.0444, 31.2357, 2.0),
    ('London 2024', (2024, 4, 8, 18, 20, 0), 51.5074, -0.1278, 1.0),
    ('Ghaziabad 2026', (2026, 10, 8, 10, 47, 40), 28.66535, 77.43915, 5.5),
    ('Mumbai 1930', (1930, 1, 1, 6, 0, 0), 19.0760, 72.8777, 5.5),
    ('Reykjavik 2035', (2035, 12, 31, 12, 0, 0), 64.1466, -21.9426, 0.0),
]
# PyJHora's numbering of the grahas
NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

drik.set_ayanamsa_mode('LAHIRI')
# PyJHora's own default is true positions (no light-time or aberration); the app, like the Swiss Ephemeris itself,
# gives apparent positions, which differ from them by up to about 20 arcseconds. Asked for here, so that what is
# left over between the two programs is not a matter of convention.
const.PLANET_POSITIONS_TRUE = False
drik.refresh_planet_flags()


def with_nodes(true_nodes):
    """PyJHora's own default is the true node; the app's is the mean node, so both are asked for."""
    const.set_node_mode(true_nodes)
    drik.set_planet_list(set_rahu_ketu_as_true_nodes=true_nodes)


out = []
for label, (year, month, day, hour, minute, second), lat, lng, tz in CHARTS:
    place = drik.Place(label, lat, lng, tz)
    jd = utils.julian_day_number(drik.Date(year, month, day), (hour, minute, second))
    position = lambda entry: entry[1][0] * 30 + entry[1][1]
    with_nodes(True)
    rahu_true = position(charts.rasi_chart(jd, place)[8])
    with_nodes(False)
    chart = charts.rasi_chart(jd, place)
    _, periods = vimsottari.get_vimsottari_dhasa_bhukthi(jd, place)
    mahadashas, last = [], None
    for (maha, _antar), (y, m, d, h), _years in periods:
        if maha != last:
            mahadashas.append({'lord': NAMES[maha], 'start': [y, m, d, round(h, 3)]})
            last = maha
    out.append({
        'label': label,
        'birth': [year, month, day, hour, minute, second],
        'lat': lat, 'lng': lng, 'tz': tz,
        'ayanamsa': drik.get_ayanamsa_value(jd),
        'ascendant': position(chart[0]),
        'planets': {NAMES[i]: position(chart[i + 1]) for i in range(9)},
        'rahuTrue': rahu_true,
        'vimsottari': mahadashas[:10],
    })
text = json.dumps({'generator': 'PyJHora 4.8.7, pyswisseph 2.10.3.2, Lahiri, mean node', 'charts': out}, indent=1)
if len(sys.argv) > 1:
    with open(sys.argv[1], 'w', encoding='utf-8') as file:
        file.write(text + '\n')
else:
    print(text)
