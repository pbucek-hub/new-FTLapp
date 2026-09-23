# FTL Calculator Formal Regression Matrix

CAT/AOC and NCC are tested as independent rule engines. These are acceptance-test requirements for the next consolidated build.

## A. Shared boundary and infrastructure tests

| ID | Test | Expected |
|---|---|---|
| X-001 | Reset app | Clean NCC baseline; no stale advanced-option data |
| X-002 | Midnight crossing | Correct next-day duty-end calculation |
| X-003 | Airport timezone conversion | Local/UTC conversion agrees with selected airport and date |
| X-004 | DST transition date | No one-hour silent error in UTC display |
| X-005 | Exact limit | "Limit reached" / no false "exceeded" |
| X-006 | Limit + 1 minute / 0.01 h | "Exceeded / not legal" as applicable |
| X-007 | Actual finish earlier clock-time than report | Correctly treated as following day |
| X-008 | Missing required input | Calculation blocked or marked review; never silently default to favourable value |

## B. NCC — basic FDP Table A

For every row change, test one minute below, exact boundary, one minute above. Validate at minimum sector columns 1, 2, 6, 7, 8+.

Boundaries:
- 05:59 / 06:00
- 06:59 / 07:00
- 12:59 / 13:00
- 17:59 / 18:00
- 21:59 / 22:00

Expected values must match JCC NCC I2R19 Table A exactly.

## C. NCC — non-acclimatised Table B

| ID | Rest | Expected row |
|---|---:|---|
| NCC-B-001 | 17:59 | Up to 18 / over 30 |
| NCC-B-002 | 18:00 | Up to 18 / over 30 |
| NCC-B-003 | 18:01 | Between 18 and 30 |
| NCC-B-004 | 29:59 | Between 18 and 30 |
| NCC-B-005 | 30:00 | Between 18 and 30 |
| NCC-B-006 | 30:01 | Over 30 |
| NCC-B-007 | Underlying 24 h rest interrupted by short duty | Must not gain <=18 h favourable row |

Run each against sector columns 1, 3, 6 and 7+.

## D. NCC — long sector

| ID | Scheduled longest sector | Acclimatised | Expected |
|---|---:|---|---|
| NCC-LR-001 | 09:00 | Yes/No | No modified-sector penalty |
| NCC-LR-002 | 09:01 | Yes | Modified as 1 sector |
| NCC-LR-003 | 09:01 | No | Modified as 2 sectors |
| NCC-LR-004 | 11:00 | Yes/No | Remains 09:01–11:00 band |
| NCC-LR-005 | 11:01 | Yes | Modified as 2 sectors |
| NCC-LR-006 | 11:01 | No | Modified as 3 sectors |
| NCC-LR-007 | Additional current type-rated pilot | Yes/No | Use actual sectors |

## E. NCC — owner-flight long-range exception
Test every prerequisite independently false, then all true.
- Owner flight / not charter.
- >=18 h off before.
- Previous duty ended before 20:00 local.
- Required 18 h/local-night condition.
- Prior qualifying-duty count boundary.
- 170 h / 28-day cumulative boundary.
- Commander discretion cap 2 h.

## F. NCC — split duty
- Raw gap producing 2:59 qualifying rest -> no extension.
- 3:00 qualifying -> +1:30.
- 10:00 qualifying -> +5:00.
- >10:00 -> review, not extrapolation.
- Confirm 20-minute immediate post/pre-flight exclusion.
- Cross-midnight split.
- Positioning counted as a sector only in the applicable split-duty case.

## G. NCC — in-flight relief
- <3 h qualifying rest -> no extension.
- Exactly 3 h.
- Bunk: 1/2 rest; maximum FDP 20 h.
- Reclining seat: 1/3 rest; maximum FDP 18 h.
- Relief pilot qualification not confirmed -> no credit.
- Additional-pilot long-sector effect tested independently from in-flight-rest credit.

## H. NCC — minimum rest
- Preceding duty <10 h -> 10 h base.
- Exactly 10 h.
- >10 h -> preceding-duty length.
- Away/base combinations.
- Suitable accommodation yes/no.
- Travel exactly 30 min each way and 31 min each way.
- Accommodation floor 8 h.
- Preceding duty including positioning 20:00 vs 20:01 for local-night trigger.
- PIC rest-reduction floor = 8 h accommodation + actual transport.
- 60-minute reporting protection.

## I. NCC — cumulative / days off
- 65 h / 7 d exact and +0.5.
- 105 h / 14 d exact and +0.5.
- 190 h / 28 d exact and +0.5.
- 2000 h / 12 consecutive months.
- 100 h / 28 d flight-time exact and day-28 single-sector exception.
- 900 h / 12 months expiring end previous month.
- 7 consecutive duty days; day-8 positioning-only case.
- 2 consecutive days off / 16-day requirement.
- 7 days off / 28 d.
- 24 days off / three consecutive 4-week periods.

## J. CAT/AOC — basic FDP Table A
Test every time-band boundary and sectors 1, 2, 6, 7, 8+ against the controlling JCC CAT OMA.

## K. CAT/AOC — non-acclimatised Table B
Use the same 17:59 / 18:00 / 18:01 / 29:59 / 30:00 / 30:01 and short-duty manipulation tests, with CAT table values.

## L. CAT/AOC — long sector
- 07:00 / 07:01.
- 09:00 / 09:01.
- 11:00 / 11:01.
- Acclimatised and not acclimatised.
- >11 h non-acclimatised -> not applicable.
- Additional current type-rated pilot -> actual sectors.

## M. CAT/AOC — standby
- 05:59 / 06:00 / 06:01 standby before callout.
- 12:00 maximum standby and +1 minute.
- More-limiting report-time band selection.
- Cumulative/rest accounting checked separately from FDP calculation.

## N. CAT/AOC — delayed reporting
- 3:59 / 4:00 / 4:01 delay.
- >=10 h undisturbed qualifying rest case.
- Re-notification scenario where applicable.
- Correct FDP start and correct table band independently verified.

## O. CAT/AOC — early/late/night sequences
- Planned duty starts outside 0100–0659 but enters by one minute.
- Exact 0100 and 0659 overlap.
- No 15-minute sampling gaps.
- Max consecutive and 7-day counts.
- Regular early-series pre/duty/post-rest thresholds.
- Two- and three-night sequence predecessor-finish cases.

## P. CAT/AOC — split duty / relief / rest / cumulative
Run the CAT-specific values independently:
- 30-minute split-duty exclusion.
- 18 h bunk / 15 h reclining-seat relief caps.
- 12 h standard rest baseline / 10 h accommodation floor / >18 h local-night trigger.
- CAT cumulative and days-off limits from the controlling JCC CAT OMA.

## Release gate
A build is not beta/release-ready until:
1. All Critical/High regulatory tests pass.
2. CAT and NCC suites pass independently.
3. No value is inherited across rule sets.
4. Every deferred issue accepted for the build has a matching regression test.
5. Manual spot-checks confirm representative results against both controlling JCC OMAs.
