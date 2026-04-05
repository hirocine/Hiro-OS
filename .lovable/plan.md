

# Add approval check after login in AuthContext.tsx and update signup toast in Auth.tsx

## File: `src/contexts/AuthContext.tsx`

### 1. Add approval check (after line 184)
After `if (error) { throw new AuthenticationError(error.message); }` (line 182-184), insert the approval check block:

```tsx
// Check if user is approved
const { data: { user: currentUser } } = await supabase.auth.getUser();
if (currentUser) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_approved')
    .eq('user_id', currentUser.id)
    .maybeSingle();
  
  if (profile && profile.is_approved === false) {
    await supabase.auth.signOut();
    throw new Error('Sua conta está aguardando aprovação de um administrador.');
  }
}
```

This goes right before the closing `});` of `wrapAsync` on line 185.

---

## File: `src/pages/Auth.tsx`

### 2. Update signup success toast (line 90)
Change:
```tsx
toast({ title: 'Conta criada com sucesso!', description: 'Verifique seu email para confirmar a conta.' });
```
To:
```tsx
toast({ title: 'Conta criada com sucesso!', description: 'Aguarde aprovação do administrador para acessar.' });
```

No other changes.

