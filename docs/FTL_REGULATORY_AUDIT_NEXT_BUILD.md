# FTL Calculator Regulatory Audit — Deferred Next-Build Actions

**Project boundary:** FTL Calculator only. Human Performance and international FTL comparison work are explicitly excluded.

**Primary controlling sources**
- NCC: JCC Part-NCC OMA I2R19, Section 7.5, 29 June 2026.
- CAT/AOC: JCC OMA CAT, Issue 2 Revision 15, Chapter 7, 29 June 2026.

**Secondary comparison/reference sources**
- UK CAA CAP 371.
- UK CAA Publication 17414 / EASA FTL Combined Document and CAA guidance.

Secondary sources are used to identify omissions, ambiguities, and provenance questions. They do **not** override a controlling JCC OMA provision merely because the values differ.

## Deferred CAT/AOC actions already identified

### CAT-01 — Non-acclimatised 18–30 h safeguard
- Preserve source wording: **Up to 18 or over 30** / **Between 18 and 30**.
- Explicit boundaries: 18:00 remains in the first band; 30:00 remains in the 18–30 band; only >30:00 enters the over-30 band.
- Prevent an intervening short duty from converting an underlying 18–30 h rest opportunity into the more favourable <=18 h row.
- Regression test 17:59 / 18:00 / 18:01 / 29:59 / 30:00 / 30:01 and interrupted-rest examples.

### CAT-02 — Early/night sequence planning detection
- Current planning logic can miss a duty starting outside 0100–0659 that later enters the protected window if no actual finish is entered.
- Sequence gating must use planned duty coverage, not only actual finish.

### CAT-03 — Critical-window precision
- Replace 15-minute sampling with exact interval overlap.
- Any encroachment into 0100–0659 must trigger the applicable check.

### CAT-04 — Sector-count UI coverage
- Current sector selector exposes only 1–6 sectors although CAT Table A contains 7 and 8+ columns and Table B contains 7+.
- Add actual-sector selections needed to represent the published tables without relying on hidden modified-sector logic.

## NCC findings and deferred actions

### NCC-01 — Non-acclimatised 18–30 h safeguard
JCC NCC explicitly prohibits inserting a short duty into an 18–30 h rest period to obtain the more favourable <=18 h Table B row.
- Add independent NCC protection.
- Preserve source wording.
- Explicitly test 18:00 and 30:00 boundaries.

### NCC-02 — Split-duty provenance
JCC NCC I2R19 uses a **20-minute** minimum immediate post/pre-flight exclusion from qualifying split rest. CAP 371 uses **30 minutes**.
- Keep the JCC NCC 20-minute value in the calculator.
- Record the source difference so a later maintainer does not replace it with the CAP 371 value without a JCC manual change.

### NCC-03 — Deliberate JCC/CAP 371 differences to preserve
Document as provenance differences, not defects:
- Basic FDP values are higher in JCC NCC.
- JCC NCC two-pilot long-sector modification starts above 9 h rather than the CAP 371 >7 h structure.
- JCC NCC I2R19 permits >11 h non-acclimatised as 3 modified sectors.
- In-flight relief caps: JCC NCC 20 h bunk / 18 h reclining seat versus lower CAP 371 reference values.
- Minimum rest: JCC NCC baseline 10 h, accommodation floor 8 h, local-night trigger after >20 h duty.
- NCC cumulative limits and days-off sequence differ from CAT/CAP-derived values.

### NCC-04 — Sector-count UI coverage
- Current sector selector exposes only 1–6 actual sectors.
- JCC NCC Table A contains 7 and 8+ columns and Table B contains 7+.
- Add 7 and 8+ capability or another explicit mechanism that represents these table columns.

### NCC-05 — 28-day flight-time edge case
JCC NCC includes the specific 100 h / 28-day rule measured at the beginning of the flight, including the day-28 single-sector consequence.
- Current cumulative checker treats 100 h as a simple aggregate threshold and does not model this single-sector edge case.
- Add a dedicated explanatory/validation path rather than silently treating every >100 h result identically.

### NCC-06 — 12-month flying-window wording
- JCC NCC describes the 900 h limit as the 12-month period expiring at the end of the previous month.
- Current UI says only "trailing 12 months".
- Clarify the input label/help text so the user supplies the correct authoritative aggregate.

## Cross-mode safeguards

### X-01 — Never merge CAT and NCC legal values
Shared UI is acceptable. Rule values, exceptions, rest, long-sector, cumulative and sequence logic must remain independent.

### X-02 — Exact-boundary testing
Every time/range rule should be tested one minute below, exactly at, and one minute above the boundary.

### X-03 — Source precedence
If JCC OMA and CAA reference material differ, log the difference and preserve the JCC value unless the controlled JCC manual is amended or the difference exposes an internal JCC inconsistency.

## Current disposition
- No code change during colleague beta testing unless a safety-critical defect is confirmed.
- Batch all accepted items into one consolidated next build.
- Run the full CAT and NCC regression suites separately after implementation.
