export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-12 bg-[hsl(var(--ds-surface))] border-t border-[hsl(var(--ds-line-1))]  flex items-center justify-center px-6">
      <div className="flex items-center space-x-4 text-sm text-[hsl(var(--ds-fg-3))]">
        <span>© 2025 Hiro Films</span>
        <span>•</span>
        <span>Hiro OS®</span>
      </div>
    </footer>
  );
}