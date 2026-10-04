import { NextRequest, NextResponse } from "next/server";
import { calculateTithiPravesa, tithiPravesaYearAt, vedicDayAt } from "@/lib/tithiPravesha";
import { localPartsFromJd } from "@/lib/lunisolar";
import { castAt, localizePeriods, offsetAt, parseAnnualRequest } from "@/lib/annualRequest";
import { ASHTOTTARI_CYCLE, buildAnnualDasha, tithiAshtottariFirstLord } from "@/lib/annualDasha";
import type { TithiPravesaMethod } from "@/lib/tithiPravesha";

// Returns the Tithi Praveśa in force at `target` (yyyy-mm-dd, local noon), or
// the one for `tpYear`, with its chart and the Tithi Aṣṭottarī daśā of the
// year. The chart is cast at `lat`/`lng`: the birthplace by default, or the
// place of residence that year when the client sends one.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const req = await parseAnnualRequest(searchParams);
  if ("error" in req) return NextResponse.json({ error: req.error }, { status: 400 });
  const method: TithiPravesaMethod = searchParams.get("method") === "solar-return" ? "solar-return" : "lunar-month";

  try {
    const options = { birthJd: req.birthJd, method, ayanamsa: req.ayanamsa, ayanamsaOffsetDegrees: req.ayanamsaOffsetDegrees };
    const { current, next } = req.year !== null
      ? {
          current: await calculateTithiPravesa({ ...options, year: req.year }),
          next: await calculateTithiPravesa({ ...options, year: req.year + 1 }),
        }
      : await tithiPravesaYearAt({ ...options, targetJd: req.targetJd });

    const { local, tzOffset, chart } = await castAt(req, current.jd);
    const vedicDay = await vedicDayAt(current.jd, req.lat, req.lng, tzOffset);
    const nextTz = offsetAt(req, next.jd);

    // The tithi and its spent fraction at Tithi Praveśa equal those at birth.
    const dasha = buildAnnualDasha(
      ASHTOTTARI_CYCLE,
      tithiAshtottariFirstLord(current.tithiIndex + 1),
      (current.natalElongation % 12) / 12,
      current.jd,
      next.jd - current.jd,
    ).map((md) => ({ ...md, antardashas: localizePeriods(req, md.antardashas) }));

    return NextResponse.json({
      tithiPravesa: current,
      local,
      tzOffset,
      completedAge: current.year - req.birth.year,
      vedicDay,
      next: { ...next, local: localPartsFromJd(next.jd, nextTz), tzOffset: nextTz },
      dasha: localizePeriods(req, dasha),
      chart,
    });
  } catch (error) {
    console.error("Tithi Pravesha calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate Tithi Pravesha" }, { status: 500 });
  }
}
