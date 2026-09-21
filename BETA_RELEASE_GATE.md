# JCC FTL Beta Release Gate

## Current validated beta

- Feature commit: `35f37fee946311531cdc8ac1aa58c5be920be670`
- UI: Liquid Glass beta
- OM-A matrix: **1,581 / 1,581 PASS**
- Browser/mobile smoke: PASS
- ICAO exact-code lookup: PASS
- Deployed beta blob: `ba5b085577e69afa0e614229ea9bc679edc8cea5`

## Required before any beta deployment

1. Work only on `feature/ncc-cat-aoc`.
2. Run the full GitHub validation workflow.
3. Require:
   - embedded JavaScript syntax PASS;
   - required dual-rule controls PASS;
   - browser/mobile smoke and boundary tests PASS;
   - ICAO exact-code regression PASS;
   - comprehensive OM-A matrix **0 FAIL**.
4. Deploy to `beta/index.html` and `beta.html` only after the feature head is green.
5. Confirm the deployed file blob exactly matches the validated feature `index.html` blob.
6. Do not replace the root `index.html` on `main` without explicit approval.

## Operational-source handling

- NCC source displayed in the app: `2026_JCC_PART_NCC_OMA_I2R19`, Issue 2 Rev 19, 29 June 2026.
- CAT/AOC source: JCC OM-A Section 7 as configured in the calculator.
- Where source wording is genuinely ambiguous, return **REVIEW REQUIRED** rather than silently choosing an interpretation.
