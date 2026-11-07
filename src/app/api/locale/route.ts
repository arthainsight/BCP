import { NextRequest, NextResponse } from "next/server";
import { placeFromHeaders } from "@/lib/visitorPlace";

// The approximate place of the visitor, for the chart the page opens with. The hosting platform works it out from the address of the
// request and puts it in headers; this route only hands it back (nothing is stored, nothing is asked of another service). Where the
// headers are not there (another host, a local run) or give nothing a chart can be cast for, the answer is empty and the page
// opens at Porvoo. The answer is about one visitor and is never kept by a cache.
export async function GET(request: NextRequest) {
  const place = placeFromHeaders((name) => request.headers.get(name));
  return NextResponse.json(place ?? {}, { headers: { "Cache-Control": "no-store" } });
}
