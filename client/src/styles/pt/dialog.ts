export default {
  mask: {
    style: 'background: var(--mask, rgba(0,0,0,0.5)); backdrop-filter: blur(2px);',
  },
  root: {
    style: [
      'background: var(--surface-50);',
      'border: 1px solid var(--border);',
      'border-radius: var(--r-lg);',
      'color: var(--text-1);',
      'box-shadow: 0 12px 32px rgba(0,0,0,0.45);',
    ].join(' '),
  },
  header: {
    style: [
      'padding: 12px 16px;',
      'border-bottom: 1px solid var(--border);',
      'background: var(--surface-50);',
      'color: var(--text-1);',
      'font-size: var(--fs-md);',
      'font-weight: 500;',
    ].join(' '),
  },
  content: {
    style: 'padding: 16px; background: var(--surface-50); color: var(--text-1);',
  },
  footer: {
    style: 'padding: 12px 16px; border-top: 1px solid var(--border); background: var(--surface-50);',
  },
};
