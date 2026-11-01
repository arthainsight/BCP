import { NextRequest, NextResponse } from "next/server";
import { calculateChart } from "@/lib/ephemeris";
import { annualYearAt, findSolarLongitude, localPartsFromJd, siderealSun, solarReturnJd } from "@/lib/lunisolar";
import { castAt, localizePeriods, offsetAt, parseAnnualRequest } from "@/lib/annualRequest";
import { SEVEN, munthaSign, panchaVargiyaBala, signLord, triRashiLord, type OfficeRole, type SevenPlanet } from "@/lib/varshaphala";
import { patyamshaDasha } from "@/lib/patyamsha";
import { normalizeDegrees } from "@/lib/angles";

// Māsa-praveśa and Dina-praveśa of the Tājika Nīlakaṇṭhī (Varṣatantra, "māsadinapraveśānayanaṃ tatphalāni ca"): the chart for the moment the Sun has gone round the signs of the
// month, or the degrees of the day, beyond its natal longitude: the nth month when the Sun is (n − 1) signs beyond it, the nth day when it is (n − 1) degrees beyond it, counted from the
// Varṣa-praveśa. For a month the six office bearers and the Pātyāṁśī daśā of 30 days for 360.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const req = await parseAnnualRequest(searchParams);
  if ("error" in req) return NextResponse.json({ error: req.error }, { status: 400 });
  const kind = searchParams.get("kind") === "dina" ? "dina" : "masa";
  const count = kind === "masa" ? 12 : 360;
  const step = kind === "masa" ? 30 : 1;
  const asked = Math.trunc(Number(searchParams.get("n")) || 0);
  if (asked < 0 || asked > count) return NextResponse.json({ error: "n is out of range" }, { status: 400 });

  try {
    const occurrence = async (year: number) => ({ year, jd: await solarReturnJd(req.birthJd, year, req.ayanamsa, req.ayanamsaOffsetDegrees) });
    const { current, next } = req.year !== null
      ? { current: await occurrence(req.year), next: await occurrence(req.year + 1) }
      : await annualYearAt(occurrence, req.targetJd);
    const natalSun = await siderealSun(req.birthJd, req.ayanamsa, req.ayanamsaOffsetDegrees);
    const yearLength = next.jd - current.jd;

    // The moment the Sun is (n − 1) steps beyond its natal longitude, the nth period of the year; the last ends with the year.
    const startOf = async (n: number) => {
      if (n <= 1) return current.jd;
      if (n > count) return next.jd;
      const jd = await findSolarLongitude(normalizeDegrees(natalSun + (n - 1) * step), current.jd + ((n - 1) * yearLength) / count, req.ayanamsa, req.ayanamsaOffsetDegrees);
      return Math.min(jd, next.jd);
    };
    let n = asked;
    if (!n) {
      n = Math.min(count, Math.max(1, Math.floor(((req.targetJd - current.jd) / yearLength) * count) + 1));
      // The estimate is by equal spans; the Sun does not move evenly, so step to the period that holds the target.
      for (let guard = 0; guard < 10; guard++) {
        if (n > 1 && req.targetJd < (await startOf(n))) n -= 1;
        else if (n < count && req.targetJd >= (await startOf(n + 1))) n += 1;
        else break;
      }
    }
    const jd = await startOf(n);
    const endJd = n >= count ? next.jd : await startOf(n + 1);

    const { birth } = req;
    const natal = await calculateChart(
      birth.year, birth.month, birth.day, birth.hour, birth.minute, birth.second,
      req.lat, req.lng, req.birthTz, req.ayanamsa, req.nodeMode, req.ayanamsaOffsetDegrees,
    );
    const { local, tzOffset, chart } = await castAt(req, jd);
    const annual = n === 1 ? chart : (await castAt(req, current.jd)).chart;
    const hours = local.hour + local.minute / 60 + local.second / 3600;
    const sunrise = chart.debug?.sunriseLocalHours;
    const sunset = chart.debug?.sunsetLocalHours;
    const dayChart = sunrise !== undefined && sunset !== undefined ? hours >= sunrise && hours < sunset : true;

    let muntha: { sign: number; longitude: number } | null = null;
    let officeBearers: { planet: SevenPlanet; roles: OfficeRole[]; bala: number }[] = [];
    let strongest: SevenPlanet | null = null;
    if (kind === "masa") {
      // The Muntha of the month: that of the year (the natal Lagna carried a sign for each completed year) and 2°30′ for each month gone by, so that the twelfth month ends where the next year's Muntha begins.
      const completedAge = current.year - birth.year;
      const longitude = normalizeDegrees(natal.ascendant.longitude + completedAge * 30 + (n - 1) * 2.5);
      muntha = { sign: munthaSign(natal.ascendant.sign, completedAge), longitude };
      muntha.sign = Math.floor(longitude / 30) + 1;
      const sun = chart.planets.find((p) => p.name === "Sun")!;
      const moon = chart.planets.find((p) => p.name === "Moon")!;
      const assignments: [SevenPlanet, OfficeRole][] = [
        [signLord(chart.ascendant.sign), "Māsa lagneśa" as OfficeRole],
        [signLord(muntha.sign), "Muntheśa"],
        [signLord(natal.ascendant.sign), "Janma lagneśa"],
        [triRashiLord(chart.ascendant.sign, dayChart), "Tri-rāśi pati"],
        [signLord(dayChart ? sun.sign : moon.sign), "Dina-rātri pati"],
        [signLord(annual.ascendant.sign), "Varṣa lagneśa"],
      ];
      const byPlanet = new Map<SevenPlanet, { planet: SevenPlanet; roles: OfficeRole[]; bala: number }>();
      for (const [planet, role] of assignments) {
        const found = byPlanet.get(planet);
        if (found) { found.roles.push(role); continue; }
        byPlanet.set(planet, { planet, roles: [role], bala: panchaVargiyaBala(planet, chart.planets.find((p) => p.name === planet)!.longitude).total });
      }
      officeBearers = [...byPlanet.values()];
      strongest = officeBearers.reduce((best, o) => (o.bala > best.bala ? o : best)).planet;
    }

    const patyamshi = patyamshaDasha(
      [
        ...SEVEN.map((planet) => {
          const body = chart.planets.find((p) => p.name === planet)!;
          return { name: planet, degree: body.degree, speed: body.speed };
        }),
        { name: "Lagna", degree: chart.ascendant.degree },
      ],
      jd,
      endJd - jd,
    ).map((md) => ({ ...md, antardashas: localizePeriods(req, md.antardashas) }));

    const endTz = offsetAt(req, endJd);
    return NextResponse.json({
      kind, n, count, year: current.year, jd, local, tzOffset, dayChart,
      end: { jd: endJd, local: localPartsFromJd(endJd, endTz), tzOffset: endTz },
      muntha: muntha ? { sign: muntha.sign, house: ((muntha.sign - chart.ascendant.sign + 12) % 12) + 1 } : null,
      officeBearers, strongest,
      patyamshi: localizePeriods(req, patyamshi),
      chart,
    });
  } catch (error) {
    console.error("Varshaphala period calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate the period" }, { status: 500 });
  }
}
