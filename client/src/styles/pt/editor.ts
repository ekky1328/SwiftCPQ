export default {
  root: {
    style: 'border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface-100); color: var(--text-1);',
  },
  toolbar: {
    style: [
      'background: var(--surface-50);',
      'border: none;',
      'border-bottom: 1px solid var(--border);',
      'padding: 4px 6px;',
    ].join(' '),
  },
  content: {
    style: [
      'background: var(--surface-100);',
      'color: var(--text-1);',
      'border: none;',
      'font-family: var(--font-ui);',
      'font-size: var(--fs-md);',
    ].join(' '),
  },
};
