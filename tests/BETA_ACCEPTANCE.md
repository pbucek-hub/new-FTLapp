# Shareable Beta Acceptance Standard

The colleague beta is releasable only when every mandatory gate below is green on the exact deployed source.

## A. Rule-engine correctness
- Full OM-A matrix: 0 failures.
- NCC Table A: every time band, sector category, and boundary minute.
- NCC Table B: all sector categories and preceding-rest boundaries.
- CAT/AOC Table A/B equivalents.
- Long-sector modified-sector rules, including threshold values.
- Additional type-rated pilot behaviour.
- Split-duty thresholds and extension calculation.
- In-flight relief: jump seat / reclining seat / bunk and minimum qualifying rest.
- CAT delayed reporting boundaries.
- CAT standby 6h and 12h boundaries.
- Minimum-rest calculations and travel/accommodation adjustments.
- Cumulative duty/flight limits at below / equal / above threshold.

## B. Input and airport handling
- ICAO exact lookup.
- IATA exact lookup.
- Airport-name lookup.
- City lookup.
- No-match behaviour is explicit.
- Airport timezone resolves and report UTC preview updates.
- Date/time rollover around midnight.
- Invalid, empty, and out-of-range numeric inputs cannot produce a silently plausible result.

## C. User-flow safety
- NCC/CAT toggle cannot leave stale values or stale rule labels.
- Acclimatisation toggle immediately changes the correct rule basis.
- Changing a result-driving input marks/recomputes the result consistently.
- Hidden Reason & JCC OM-A Reference contains the applicable rule basis.
- REVIEW REQUIRED is used for unresolved source ambiguity.
- NOT LEGAL cannot be visually confused with a legal/max-FDP result.
- No result claims LEGAL unless enough information exists to assess legality.

## D. Browser / layout
- 390x844 mobile viewport: no horizontal overflow.
- 430x932 mobile viewport: no horizontal overflow.
- 768x1024 tablet viewport.
- 1440x900 desktop viewport.
- Bottom navigation remains usable and does not cover critical controls/results.
- All primary controls have practical touch targets.
- Keyboard/focus path works for primary inputs.

## E. Release integrity
- JavaScript syntax and required controls PASS.
- Full automated suite PASS on release candidate commit.
- Beta deployment completes successfully.
- Deployed `beta.html` blob exactly matches validated feature `index.html` blob.
- Root production `index.html` remains unchanged.
- Release commit SHA and OM-A editions are recorded.

A failure in any mandatory gate blocks colleague release.
