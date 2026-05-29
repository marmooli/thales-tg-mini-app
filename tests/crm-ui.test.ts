import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('crm ui copy', () => {
  it('keeps crm copy persian and read-only visible in source', () => {
    const source = readFileSync(new URL('../src/crm-app.tsx', import.meta.url), 'utf8');
    expect(source).toContain('داشبورد مشتریان ثالس');
    expect(source).toContain('فقط خواندنی');
    expect(source).toContain('خروجی CSV');
  });
});
