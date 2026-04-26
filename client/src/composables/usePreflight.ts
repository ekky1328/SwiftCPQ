import type { Proposal } from '../types/Proposal';

export interface PreflightCheck {
  kind: 'pass' | 'warn' | 'error';
  label: string;
  cta?: string;
}

export function usePreflight(proposal: Proposal): PreflightCheck[] {
  const checks: PreflightCheck[] = [];

  // Customer
  if (!proposal.customer?.id) {
    checks.push({ kind: 'error', label: 'No customer assigned', cta: 'Assign' });
  } else {
    checks.push({ kind: 'pass', label: 'Customer assigned' });
  }

  // Line items
  const allItems = proposal.sections?.flatMap((s) => s.items ?? []) ?? [];
  if (allItems.length === 0) {
    checks.push({ kind: 'warn', label: 'No line items in proposal' });
  } else {
    checks.push({ kind: 'pass', label: `${allItems.length} line items` });
  }

  // Expiry
  if (proposal.expiresOnDate) {
    const expires = new Date(proposal.expiresOnDate);
    const daysLeft = Math.floor((expires.getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) {
      checks.push({ kind: 'error', label: `Quote expired ${Math.abs(daysLeft)}d ago`, cta: 'Extend' });
    } else if (daysLeft < 7) {
      checks.push({ kind: 'warn', label: `Quote expires in ${daysLeft}d`, cta: 'Extend' });
    } else {
      checks.push({ kind: 'pass', label: `Expires ${expires.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}` });
    }
  } else {
    checks.push({ kind: 'warn', label: 'No expiry date set' });
  }

  // Zero-price items
  const zeroPriced = allItems.filter((i) => i.price === 0 && i.type !== 'COMMENT');
  if (zeroPriced.length > 0) {
    checks.push({ kind: 'warn', label: `${zeroPriced.length} item(s) with zero price` });
  }

  // Status sanity
  if (proposal.status === 'draft') {
    checks.push({ kind: 'warn', label: 'Proposal is still in draft', cta: 'Finalise' });
  }

  return checks;
}
