

# Add status normalization for legacy `color_grading` in pipeline display

## File: `src/features/post-production/components/PPVideoPage.tsx`

### Change 1: Replace lines 187-188
Current `currentStepIdx` and `nextStep` declarations derive from `form.status` directly. Add a normalization line and update the derivations:

```tsx
// Normalize legacy color_grading status to finalizacao for pipeline display
const normalizedStatus = form.status === 'color_grading' ? 'finalizacao' : form.status;
const currentStepIdx = MACRO_STEPS.findIndex(s => s.key === normalizedStatus);
const nextStep = MACRO_STEPS[currentStepIdx + 1];
```

### Change 2: Replace `form.status` with `normalizedStatus` in pipeline JSX (6 occurrences)

All in the Pipeline CardContent section (lines 363-456):

1. **Line 401** — advance button variant check: `SUB_STEPS[form.status]` → `SUB_STEPS[normalizedStatus]`
2. **Line 411** — sub-steps sidebar condition: `SUB_STEPS[form.status]` → `SUB_STEPS[normalizedStatus]`
3. **Line 414** — sidebar label lookup: `s.key === form.status` → `s.key === normalizedStatus`
4. **Line 417** — sub-steps map: `SUB_STEPS[form.status]` → `SUB_STEPS[normalizedStatus]`
5. **Line 451** — progress counter: `SUB_STEPS[form.status]` → `SUB_STEPS[normalizedStatus]`

Leave `form.status` unchanged in the step button's `onClick` (line 374) and everywhere outside the pipeline card (Select dropdown, handleSave, etc.).

No other files.

