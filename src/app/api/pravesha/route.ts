import { NextRequest, NextResponse } from "next/server";
import { calculatePravesha, praveshaYearAt, type PraveshaKind, type PraveshaMethod } from "@/lib/pravesha";
import { jdFromLocal, localPartsFromJd, vedicDayAt } from "@/lib/lunisolar";
import { castAt, localizePeriods, offsetAt, parseAnnualRequest } from "@/lib/annualRequest";
import { VIMSHOTTARI_CYCLE, buildAnnualDasha, vimshottariFirstLord } from "@/lib/annualDasha";
import { nakshatraOfLongitude, yogaOfSum } from "@/lib/praveshaNames";
import { NAKSHATRA_SIZE } from "@/lib/nakshatras";

// Returns the Nakṣatra Praveśa or the Yoga Praveśa (`kind`) in force at `target` (yyyy-mm-dd, local noon), or the
// one for `tpYear`, with its chart. The chart is cast at `lat`/`lng`: the birthplace by default, or the place of
// residence that year when the client sends one. `method` is 'lunar-month' (the default) or 'before-birthday'.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  if (kind !== "nakshatra" && kind !== "yoga") return NextResponse.json({ error: "kind must be nakshatra or yoga" }, { status: 400 });
  const req = await parseAnnualRequest(searchParams);
  if ("error" in req) return NextResponse.json({ error: req.error }, { status: 400 });
  const method: PraveshaMethod = searchParams.get("method") === "before-birthday" ? "before-birthday" : "lunar-month";

  try {
    // The birthday of a year: the birth date and time of day in the zone of birth.
    const birthdayJd = (year: number) => jdFromLocal(year, req.birth.month, req.birth.day, req.birth.hour, req.birth.minute, req.birth.second, req.birthTz);
    const options = {
      kind: kind as PraveshaKind, birthJd: req.birthJd, method, birthdayJd,
      ayanamsa: req.ayanamsa, ayanamsaOffsetDegrees: req.ayanamsaOffsetDegrees,
    };
    const { current, next } = req.year !== null
      ? {
          current: await calculatePravesha({ ...options, year: req.year }),
          next: await calculatePravesha({ ...options, year: req.year + 1 }),
        }
      : await praveshaYearAt({ ...options, targetJd: req.targetJd });

    const { local, tzOffset, chart } = await castAt(req, current.jd);
    const vedicDay = await vedicDayAt(current.jd, req.lat, req.lng, tzOffset);
    const nextTz = offsetAt(req, next.jd);
    const tithiTz = offsetAt(req, current.tithiPravesaJd);

    // The Vimśottarī of the year: the dasha of birth begins again. At Nakṣatra Praveśa the Moon stands where it did at
    // birth, so the lord of the birth nakṣatra begins with the same part of its period spent; Yoga Praveśa counts its
    // yoga the same way.
    const natalValue = current.natalValue;
    const entry = kind === "nakshatra"
      ? { number: nakshatraOfLongitude(natalValue).number, spent: (natalValue % NAKSHATRA_SIZE) / NAKSHATRA_SIZE }
      : { number: yogaOfSum(natalValue).number, spent: yogaOfSum(natalValue).spent };
    const dasha = buildAnnualDasha(VIMSHOTTARI_CYCLE, vimshottariFirstLord(entry.number), entry.spent, current.jd, next.jd - current.jd)
      .map((md) => ({ ...md, antardashas: localizePeriods(req, md.antardashas) }));

    return NextResponse.json({
      pravesha: current,
      local,
      tzOffset,
      completedAge: current.year - req.birth.year,
      vedicDay,
      tithiPravesaLocal: localPartsFromJd(current.tithiPravesaJd, tithiTz),
      next: { ...next, local: localPartsFromJd(next.jd, nextTz), tzOffset: nextTz },
      dasha: localizePeriods(req, dasha),
      chart,
    });
  } catch (error) {
    console.error("Pravesha calculation error:", error);
    return NextResponse.json({ error: "Failed to calculate Pravesha" }, { status: 500 });
  }
}
