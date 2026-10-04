import { NextRequest, NextResponse } from "next/server";
import { calculateChart } from "@/lib/ephemeris";
import { annualYearAt, localPartsFromJd, solarReturnJd } from "@/lib/lunisolar";
import { castAt, localizePeriods, offsetAt, parseAnnualRequest } from "@/lib/annualRequest";
import { MUDDA_CYCLE, buildAnnualDasha, muddaFirstLord } from "@/lib/annualDasha";
import { SEVEN, munthaSign, panchaVargiyaBala, yearLord } from "@/lib/varshaphala";
import { normalizeDegrees } from "@/lib/angles";

// Tājika Varṣaphala: the chart for the Sun's sidereal return in the year in
// force at `target` (or for `tpYear`), with Muntha, the five office bearers,
// the lord of the year, Pañcavargīya Bala and the Mudda daśā.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const req = await parseAnnualRequest(searchParams);
  if ("error" in req) return NextResponse.json({ error: req.error }, { status: 400 });

  try {
    const occurrence = async (year: number) => ({
      year,
      jd: await solarReturnJd(req.birthJd, year, req.ayanamsa, req.ayanamsaOffsetDegrees),
    });
    const { current, next } = req.year !== null
      ? { current: await occurrence(req.year), next: await occurrence(req.year + 1) }
      : await annualYearAt(occurrence, req.targetJd);

    const { birth } = req;
    const natal = await calculateChart(
      birth.year, birth.month, birth.day, birth.hour, birth.minute, birth.second,
      req.lat, req.lng, req.birthTz, req.ayanamsa, req.nodeMode, req.ayanamsaOffsetDegrees,
    );
    const { local, tzOffset, chart } = await castAt(req, current.jd);
    const completedAge = current.year - birth.year;

    // A day year begins between sunrise and sunset at the annual chart's place.
    const hours = local.hour + local.minute / 60 + local.second / 3600;
    const sunrise = chart.debug?.sunriseLocalHours;
    const sunset = chart.debug?.sunsetLocalHours;
    const dayYear = sunrise !== undefined && sunset !== undefined ? hours >= sunrise && hours < sunset : true;

    const muntha = munthaSign(natal.ascendant.sign, completedAge);
    const lord = yearLord(chart, natal.ascendant.sign, completedAge, dayYear);
    const bala = SEVEN.map((planet) => panchaVargiyaBala(planet, chart.planets.find((p) => p.name === planet)!.longitude));

    const moon = natal.planets.find((p) => p.name === "Moon")!;
    const nakWidth = 360 / 27;
    const moonLon = normalizeDegrees(moon.longitude);
    const dasha = buildAnnualDasha(
      MUDDA_CYCLE,
      muddaFirstLord(Math.floor(moonLon / nakWidth) + 1, completedAge),
      (moonLon % nakWidth) / nakWidth,
      current.jd,
      next.jd - current.jd,
    ).map((md) => ({ ...md, antardashas: localizePeriods(req, md.antardashas) }));

    const nextTz = offsetAt(req, next.jd);
    return NextResponse.json({
      year: current.year,
      jd: current.jd,
      local,
      tzOffset,
      completedAge,
      dayYear,
      natalAscSign: natal.ascendant.sign,
      muntha: { sign: muntha, house: ((muntha - chart.ascendant.sign + 12) % 12) + 1 },
      ...lord,
      bala,
      dasha: localizePeriods(req, dasha),
      next: { year: next.year, jd: next.jd, local: localPartsFromJd(next.jd, nextTz), tzOffset: nextTz },
      chart,
    });
  } catch (error) {
    console.error("Varshaphala calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate Varshaphala" }, { status: 500 });
  }
}
