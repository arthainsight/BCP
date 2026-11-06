"""
Reference values for src/lib/pyjhoraVargas.test.ts, from PyJHora (another Jyotish program): the sign each body of a chart
takes in every divisional chart the app draws (D2 by the traditional Parāśara rule, D3 to D60 by PyJHora's standard one), for
charts cast at random moments between 1900 and 2040, so that the formulas of src/lib/varga are checked against someone else's
on thousands of positions, D6, D8 and D11 among them.

    python -m venv venv && venv/bin/pip install PyJHora pyswisseph numpy geocoder pytz timezonefinder geopy python-dateutil
    venv/bin/python scripts/pyjhora_vargas.py src/lib/fixtures/pyjhoraVargas.json

The longitudes are PyJHora's own sidereal ones (Lahiri); the app is given those, not its own, so that only the varga rule is compared.
"""
import contextlib
import json
import random
import sys

# PyJHora prints its search path when it is imported.
with contextlib.redirect_stdout(sys.stderr):
    from jhora import const, utils
    from jhora.panchanga import drik
    from jhora.horoscope.chart import charts

drik.set_ayanamsa_mode('LAHIRI')
NAMES = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']
FACTORS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 27, 30, 40, 45, 60]
random.seed(7)
place = drik.Place('Delhi', 28.6139, 77.2090, 5.5)
out = []
for _ in range(150):
    year, month, day = random.randint(1900, 2040), random.randint(1, 12), random.randint(1, 28)
    hour, minute = random.randint(0, 23), random.randint(0, 59)
    jd = utils.julian_day_number(drik.Date(year, month, day), (hour, minute, 0))
    base = charts.rasi_chart(jd, place)
    longitudes = {NAMES[i]: base[i][1][0] * 30 + base[i][1][1] for i in range(10)}
    signs = {}
    for factor in FACTORS:
        # D2: the traditional Parasara rule (only Leo and Cancer), method 2; the others by the standard method, 1.
        chart = charts.divisional_chart(jd, place, divisional_chart_factor=factor, chart_method=2 if factor == 2 else 1)
        signs[str(factor)] = {NAMES[i]: chart[i][1][0] for i in range(10)}
    out.append({'longitudes': longitudes, 'signs': signs})
text = json.dumps({'generator': 'PyJHora 4.8.7, pyswisseph 2.10.3.2, Lahiri', 'charts': out}, separators=(',', ':'))
if len(sys.argv) > 1:
    with open(sys.argv[1], 'w', encoding='utf-8') as file:
        file.write(text + '\n')
else:
    print(text)
