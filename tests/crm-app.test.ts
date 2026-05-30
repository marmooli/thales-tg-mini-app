import { describe, expect, it } from 'vitest';
import { CRM_MAIN_TABLE_COLUMNS } from '../src/crm-app';

describe('crm app table configuration', () => {
  it('includes the Mini App email column in the main CRM table', () => {
    expect(CRM_MAIN_TABLE_COLUMNS.map((column) => column.key)).toContain('discountEmail');
    expect(CRM_MAIN_TABLE_COLUMNS.find((column) => column.key === 'discountEmail')?.label).toBe('ایمیل تخفیف');
  });
});
