

# Update handleGoBack to support sub-step backtracking

## File: `src/features/post-production/components/PPVideoPage.tsx`

### Change 1: Replace `handleGoBack` (lines 152-160)
Replace the current handler with the new version that first checks if there are previous sub-steps to go back to, and only falls back to the previous macro stage if at sub-step 0. When going back to a previous macro stage, sets `subStepIndex` to that stage's sub-steps length (i.e., all completed).

### Change 2: Update back button condition in sub-steps footer (line 437)
Change `currentStepIdx > 0` to `(currentStepIdx > 0 || subStepIndex > 0)` so the back button also appears when there are previous sub-steps within the current stage.

No other changes. The standalone (no sub-steps) section already has the correct condition (`currentStepIdx > 0`).

