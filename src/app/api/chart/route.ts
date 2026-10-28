import { NextRequest, NextResponse } from "next/server";
import { calculateChart } from "@/lib/ephemeris";
import { parseClock } from "@/lib/specialSphutas";
import { AYANAMSA_OFFSET_RANGE, MOMENT_RANGES, PLACE_RANGES, readNumbers } from "@/lib/apiValidation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const numbers = readNumbers(searchParams, { ...MOMENT_RANGES, ...PLACE_RANGES, ayanamsaOffset: AYANAMSA_OFFSET_RANGE });
  if ("error" in numbers) return NextResponse.json({ error: numbers.error }, { status: 400 });
  const { year, month, day, hour, minute, second, lat, lng, tz, ayanamsaOffset } = numbers.values;

  const ayanamsa = searchParams.get("ayanamsa") || "lahiri";
  const nodeMode = searchParams.get("nodeMode") || "mean";

  // The sunrise the special lagnas are counted from: the true sunrise (the default) or the mean-time one.
  const sunriseMode = searchParams.get("sunrise") === "mean" ? "mean" : "true";
  // A sunrise typed in (HH:MM:SS) replaces the calculated one; anything that is not a time of day is left out.
  const sunriseManualHours = parseClock(searchParams.get("sunriseManual") ?? "");

  try {
    const chart = await calculateChart(year, month, day, hour, minute, second, lat, lng, tz, ayanamsa, nodeMode, ayanamsaOffset, sunriseMode, sunriseManualHours);
    return NextResponse.json(chart);
  } catch (error) {
    console.error("Chart calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate chart" }, { status: 500 });
  }
}
