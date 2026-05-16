export type DiffOp = 'equal' | 'insert' | 'delete';

export interface DiffToken {
  op: DiffOp;
  text: string;
}

function tokenize(s: string): string[] {
  return s.split(/(\s+|[.,!?;:…—–-])/u).filter((t) => t.length > 0);
}

export function wordDiff(before: string, after: string): { left: DiffToken[]; right: DiffToken[] } {
  const a = tokenize(before);
  const b = tokenize(after);
  const n = a.length;
  const m = b.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const left: DiffToken[] = [];
  const right: DiffToken[] = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      left.unshift({ op: 'equal', text: a[i - 1] });
      right.unshift({ op: 'equal', text: b[j - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      left.unshift({ op: 'delete', text: a[i - 1] });
      i--;
    } else {
      right.unshift({ op: 'insert', text: b[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    left.unshift({ op: 'delete', text: a[i - 1] });
    i--;
  }
  while (j > 0) {
    right.unshift({ op: 'insert', text: b[j - 1] });
    j--;
  }

  return { left, right };
}

export function hasDiff(before: string, after: string): boolean {
  return before.trim() !== after.trim();
}
