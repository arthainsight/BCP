import { NextRequest, NextResponse } from "next/server";
import { calculateTransits } from "@/lib/ephemeris";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const year = parseInt(searchParams.get("year") || "0");
  const month = parseInt(searchParams.get("month") || "0");
  const day = parseInt(searchParams.get("day") || "0");
  const hour = parseInt(searchParams.get("hour") || "0");
  const minute = parseInt(searchParams.get("minute") || "0");
  const second = parseInt(searchParams.get("second") || "0");
  const tz = parseFloat(searchParams.get("tz") || "0");
  const natalAscSign = parseInt(searchParams.get("natalAscSign") || "0");

  if (!year || !month || !day || !natalAscSign) {
    return NextResponse.json({
      error: "Missing required parameters: year, month, day, natalAscSign (1-12)",
    }, { status: 400 });
  }

  try {
    const planets = calculateTransits(
      year, month, day, hour, minute, second, tz,
      natalAscSign - 1 // convert to 0-based
    );
    return NextResponse.json({ planets });
  } catch (error) {
    console.error("Transit calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate transits" }, { status: 500 });
  }
}
