import { NextRequest, NextResponse } from "next/server";
import { annualYearAt, localPartsFromJd, solarReturnJd } from "@/lib/lunisolar";
import { offsetAt, parseAnnualRequest } from "@/lib/annualRequest";

// The year of the Sudarśana daśā: a year of age runs from one solar return to the next (the Sun back at its natal
// sidereal longitude), the first from birth. The year in force at `target` (or `tpYear`), with the moments it begins
// and ends; the twelve months and the days are cut from it in the browser.
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

    const tzOffset = offsetAt(req, current.jd);
    const nextTz = offsetAt(req, next.jd);
    return NextResponse.json({
      year: current.year,
      jd: current.jd,
      local: localPartsFromJd(current.jd, tzOffset),
      tzOffset,
      completedAge: current.year - req.birth.year,
      next: { year: next.year, jd: next.jd, local: localPartsFromJd(next.jd, nextTz), tzOffset: nextTz },
    });
  } catch (error) {
    console.error("Sudarshana calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate the Sudarshana year" }, { status: 500 });
  }
}
