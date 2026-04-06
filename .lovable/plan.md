

# Wire up PPVideoPage route and make table rows clickable

## Changes

### 1. Create wrapper page `src/pages/PPVideoDetail.tsx`
- Uses `useParams` to get `:id`, fetches the item from `usePostProduction()` (finds by id from the list), renders `PPVideoPage` with `onBack` using `useNavigate(-1)`
- Shows loading skeleton while data loads, redirects back if item not found

### 2. Update `src/App.tsx`
- Lazy import `PPVideoDetail`
- Add route `esteira-de-pos/:id` nested under the protected layout (after the existing `esteira-de-pos` route)

### 3. Update `src/features/post-production/components/PPTable.tsx`
- Import `useNavigate` from `react-router-dom`
- Make the title cell clickable: wrap the title/progress div with a click handler that navigates to `/esteira-de-pos/${item.id}`
- Add `cursor-pointer` and hover styling to the title span

No other files changed.

