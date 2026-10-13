import { NextRequest, NextResponse } from "next/server";
import { calculateChart } from "@/lib/ephemeris";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const year = parseInt(searchParams.get("year") || "0");
  const month = parseInt(searchParams.get("month") || "0");
  const day = parseInt(searchParams.get("day") || "0");
  const hour = parseInt(searchParams.get("hour") || "0");
  const minute = parseInt(searchParams.get("minute") || "0");
  const second = parseInt(searchParams.get("second") || "0");
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const tz = parseFloat(searchParams.get("tz") || "0");
  const ayanamsaOffset = parseFloat(searchParams.get("ayanamsaOffset") || "0");

  const ayanamsa = searchParams.get("ayanamsa") || "lahiri";
  const nodeMode = searchParams.get("nodeMode") || "mean";

  // The sunrise the special lagnas are counted from: the true sunrise (the default) or the mean-time one.
  const sunriseMode = searchParams.get("sunrise") === "mean" ? "mean" : "true";

  if ([year, month, day, hour, minute, second, lat, lng, tz, ayanamsaOffset].some(Number.isNaN)) {
    return NextResponse.json({ error: "A date, time, place or offset parameter is not a number" }, { status: 400 });
  }

  if (!year || !month || !day) {
    return NextResponse.json({ error: "Missing required parameters: year, month, day" }, { status: 400 });
  }

  try {
    const chart = await calculateChart(year, month, day, hour, minute, second, lat, lng, tz, ayanamsa, nodeMode, ayanamsaOffset, sunriseMode);
    return NextResponse.json(chart);
  } catch (error) {
    console.error("Chart calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate chart" }, { status: 500 });
  }
}
