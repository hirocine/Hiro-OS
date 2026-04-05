

# Add "Pending Approval" screen after signup in Auth.tsx

## Changes in `src/pages/Auth.tsx`

### 1. Import `Clock` (line 7)
Add `Clock` to the lucide-react import.

### 2. Add state (after line 28)
```tsx
const [showPendingScreen, setShowPendingScreen] = useState(false);
```

### 3. Replace signup success action (line 91)
Change `setMode('login')` to `setShowPendingScreen(true)`.

### 4. Add conditional render (before the main `return` block, after the `if (user) return null;` check)
Insert the pending approval screen with Clock icon, message, and "Voltar para o login" button that resets to login mode.

No other files changed.

