# Input UI Regression Checklist

Goal: quickly identify which input area looks reverted and apply targeted fix.

## A. Reproduction baseline (must pass first)

1. Open https://smarttoolkit.pages.dev/ in InPrivate window.
2. Hard refresh with Ctrl+Shift+R.
3. Confirm tool count includes Gomoku and Gomoku card is visible.
4. Confirm latest Production deployment source commit from dashboard/CLI.

If A fails, do cache purge first using docs/cloudflare-cache-purge-smarttoolkit.md.

## B. Input behavior checks (shared DefaultValueInput)

Use at least these calculators:

1. Salary
2. Date
3. Loan
4. Ladder Game

For each calculator, check:

1. Default field shows placeholder-style default text when untouched.
2. On focus, placeholder fades and typing starts from empty.
3. Clearing field then blur restores default value.
4. Entering value then blur keeps entered value.
5. History restore loads saved value correctly.

## C. Known likely regression candidate

There is a historical revert for ladder UX:

- Revert commit: de2476a
- Original UX commit: 0e2415e
- Affected file: src/components/calculators/LadderGameCalculator.tsx

If only Ladder Game input area feels reverted while other calculators are fine, this is likely the cause.

## D. Narrowing decision tree

1. All calculators look old -> cache issue or wrong domain/project.
2. Most calculators are correct but Ladder feels old -> Ladder-specific revert candidate.
3. Only one field behaves wrong across many calculators -> check src/components/DefaultValueInput.tsx.

## E. Targeted fix plan

Case 1: cache/domain mismatch

1. Re-deploy with npm run deploy.
2. Purge cache.
3. Hard refresh.

Case 2: Ladder-only regression

1. Re-apply intended Ladder UX updates in src/components/calculators/LadderGameCalculator.tsx.
2. Build and smoke test Ladder inputs.
3. Deploy.

Case 3: Shared input bug

1. Patch src/components/DefaultValueInput.tsx.
2. Verify in Salary/Date/Loan/Ladder.
3. Build and deploy.

## F. Quick verification commands

```powershell
npm run build
cmd /c npx wrangler pages deployment list --project-name smarttoolkit
git log --oneline -5
```
