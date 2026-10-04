import { NextRequest, NextResponse } from "next/server";
import { calculateChart } from "@/lib/ephemeris";
import {
  calculateTithiPravesa,
  jdFromLocal,
  localPartsFromJd,
  tithiPravesaYearAt,
  vedicDayAt,
  type TithiPravesaMethod,
} from "@/lib/tithiPravesha";
import { getUtcOffsetHours } from "@/lib/timezone";

// Returns the Tithi Praveśa in force at `target` (yyyy-mm-dd, local noon), or
// the one for `year` when that is given instead, together with its chart.
// The chart is cast for the given place; by tradition that is where the native
// lives during the year, which defaults to the birthplace in the client.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const num = (key: string) => parseFloat(searchParams.get(key) || "0");

  const birth = {
    year: num("year"), month: num("month"), day: num("day"),
    hour: num("hour"), minute: num("minute"), second: num("second"),
  };
  const birthTz = num("tz");
  const lat = num("lat");
  const lng = num("lng");
  const iana = searchParams.get("iana") || "";
  const ayanamsa = searchParams.get("ayanamsa") || "lahiri";
  const ayanamsaOffsetDegrees = num("ayanamsaOffset");
  const nodeMode = searchParams.get("nodeMode") || "mean";
  const method: TithiPravesaMethod = searchParams.get("method") === "solar-return" ? "solar-return" : "lunar-month";
  const target = searchParams.get("target");
  const requestedYear = parseInt(searchParams.get("tpYear") || "0");

  if (!birth.year || !birth.month || !birth.day) {
    return NextResponse.json({ error: "Missing required parameters: year, month, day" }, { status: 400 });
  }

  // Offset at a given moment: the IANA zone resolves daylight saving for the
  // Tithi Praveśa date itself, which may differ from the birth offset.
  const offsetAt = (jd: number) =>
    iana ? getUtcOffsetHours(iana, new Date((jd - 2440587.5) * 86400000)) : birthTz;

  try {
    const birthJd = await jdFromLocal(birth.year, birth.month, birth.day, birth.hour, birth.minute, birth.second, birthTz);
    const options = { birthJd, method, ayanamsa, ayanamsaOffsetDegrees };

    let current, next;
    if (requestedYear) {
      current = await calculateTithiPravesa({ ...options, year: requestedYear });
      next = await calculateTithiPravesa({ ...options, year: requestedYear + 1 });
    } else {
      const match = (target || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) {
        return NextResponse.json({ error: "Provide tpYear or target as yyyy-mm-dd" }, { status: 400 });
      }
      const [, y, m, d] = match.map(Number);
      const targetJd = await jdFromLocal(y, m, d, 12, 0, 0, birthTz);
      ({ current, next } = await tithiPravesaYearAt({ ...options, targetJd }));
    }

    const tzOffset = offsetAt(current.jd);
    const local = localPartsFromJd(current.jd, tzOffset);
    const chart = await calculateChart(
      local.year, local.month, local.day, local.hour, local.minute, local.second,
      lat, lng, tzOffset, ayanamsa, nodeMode, ayanamsaOffsetDegrees,
    );
    const day = await vedicDayAt(current.jd, lat, lng, tzOffset);
    const nextTz = offsetAt(next.jd);

    return NextResponse.json({
      tithiPravesa: current,
      local,
      tzOffset,
      completedAge: current.year - birth.year,
      vedicDay: day,
      next: { ...next, local: localPartsFromJd(next.jd, nextTz), tzOffset: nextTz },
      chart,
    });
  } catch (error) {
    console.error("Tithi Pravesha calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate Tithi Pravesha" }, { status: 500 });
  }
}
