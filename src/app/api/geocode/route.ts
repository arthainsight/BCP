import { NextRequest, NextResponse } from "next/server";

const OPEN_METEO_GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";

interface OpenMeteoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  timezone: string;
  country_code: string;
}

interface OpenMeteoResponse {
  results?: OpenMeteoResult[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  if (!city) {
    return NextResponse.json({ error: "City parameter is required" }, { status: 400 });
  }

  try {
    const url = OPEN_METEO_GEO_URL + "?name=" + encodeURIComponent(city) + "&count=5&language=en&format=json";
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Geocoding API request failed");
    }

    const data: OpenMeteoResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results = data.results.map((r) => ({
      name: r.name,
      country: r.country,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json({ error: "Failed to geocode city" }, { status: 500 });
  }
}
