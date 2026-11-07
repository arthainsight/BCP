"""
Reference values for src/lib/pyjhoraAshtakavarga.test.ts, from PyJHora (another Jyotish program): the Bhinnashtakavarga, the Prastara,
the Trikona and Ekadhipatya Shodhana and the Pindas of charts made of random placements of the grahas, so that the rules of
src/lib/ashtakavargaShodhana.ts are checked against someone else's, down to the number.

    python -m venv venv && venv/bin/pip install PyJHora pyswisseph numpy geocoder pytz timezonefinder geopy python-dateutil
    venv/bin/python scripts/pyjhora_ashtakavarga.py src/lib/fixtures/pyjhoraAshtakavarga.json

A chart is the sign of the Lagna and of each of the nine grahas (0 = Aries … 11 = Pisces, in the order Sun, Moon, Mars, Mercury,
Jupiter, Venus, Saturn, Rahu, Ketu). The tables are listed by sign. PyJHora's reductions are worked on copies, as its own functions
change the lists they are given.
"""
import contextlib
import copy
import json
import random
import sys

with contextlib.redirect_stdout(sys.stderr):
    from jhora import const
    from jhora.horoscope.chart import ashtakavarga as av

random.seed(11)
charts = []
for _ in range(120):
    lagna = random.randrange(12)
    signs = [random.randrange(12) for _ in range(9)]          # Sun .. Saturn, Rahu, Ketu
    # The planets of a chart sit together often enough to leave signs empty, as the Ekadhipatya rules need.
    if random.random() < 0.6:
        signs = [random.choice([random.randrange(12), signs[0], signs[1]]) for _ in range(9)]
    house_to_planet = [''] * 12
    house_to_planet[lagna] = const._ascendant_symbol
    for planet, sign in enumerate(signs):
        house_to_planet[sign] = (house_to_planet[sign] + '/' if house_to_planet[sign] else '') + str(planet)
    bav, sav, prastara = av.get_ashtaka_varga(house_to_planet)
    bav_copy = copy.deepcopy(bav)
    after_trikona = av._trikona_sodhana(copy.deepcopy(bav))
    after_ekadhipatya = av._ekadhipatya_sodhana(copy.deepcopy(after_trikona), house_to_planet)
    rasi, graha, sodhya = av._sodhya_pindas(copy.deepcopy(after_ekadhipatya), house_to_planet)
    charts.append({
        'lagna': lagna,
        'signs': signs,
        'bav': [list(map(int, row)) for row in bav_copy[:7]],
        'sav': list(map(int, sav)),
        # [planet][contributor 0..7, 7 = Lagna] as twelve 0/1 digits by sign
        'prastara': [[''.join(str(int(x)) for x in prastara[p][op]) for op in range(8)] for p in range(7)],
        'trikona': [list(map(int, row)) for row in after_trikona[:7]],
        'ekadhipatya': [list(map(int, row)) for row in after_ekadhipatya[:7]],
        'rasiPinda': [int(x) for x in rasi],
        'grahaPinda': [int(x) for x in graha],
        'sodhyaPinda': [int(x) for x in sodhya],
    })
text = json.dumps({'generator': 'PyJHora 4.8.7', 'rasiMultipliers': list(const.ashtakavarga_rasimana_multipliers), 'grahaMultipliers': list(const.ashtakavarga_grahamana_multipliers), 'charts': charts}, separators=(',', ':'))
if len(sys.argv) > 1:
    with open(sys.argv[1], 'w', encoding='utf-8') as file:
        file.write(text + '\n')
else:
    print(text)
