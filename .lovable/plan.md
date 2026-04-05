

# Add Audit History Card to ProposalOverview

## File: `src/pages/ProposalOverview.tsx`

### 1. Add `Loader2` and `User` to lucide imports (line 5)
Append `Loader2, User` to the existing import.

### 2. Add history state and fetch (after line 82, after the versions useEffect)
```ts
const [history, setHistory] = useState<any[]>([]);
const [historyLoading, setHistoryLoading] = useState(true);

useEffect(() => {
  if (!proposal?.id) return;
  setHistoryLoading(true);
  supabase
    .from('audit_logs')
    .select('id, action, user_email, created_at')
    .eq('table_name', 'orcamentos')
    .eq('record_id', proposal.id)
    .order('created_at', { ascending: false })
    .limit(20)
    .then(({ data }) => {
      setHistory(data || []);
      setHistoryLoading(false);
    });
}, [proposal?.id]);
```

### 3. Replace the `{/* Section 6 — Placeholder */}` comment (line 356) with the full history Card
The card displays a loading spinner, empty state, or a list of audit entries with user avatar, action text, email, and timestamp.

No other files changed.

