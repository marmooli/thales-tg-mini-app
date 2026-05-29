import { describe, expect, it } from 'vitest';
import {
  buildCrmCookie,
  buildCrmUsersCsv,
  clearCrmCookie,
  createSignedSession,
  filterCrmUsers,
  isCrmRole,
  hashCrmPassword,
  normalizeCrmRole,
  paginateCrmUsers,
  readCookie,
  sortCrmUsers,
  verifyCrmPassword,
  verifySignedSession,
  type CrmSessionPayload,
  type CrmUserListRow,
} from '../src/crm-logic';

const sampleUsers: CrmUserListRow[] = [
  {
    telegramUserId: '300',
    telegramUsername: 'carol',
    firstName: 'Carol',
    lastName: 'C',
    xtUid: 'CCC333',
    verificationStatus: 'verified',
    accessLevel: 'verified_referral',
    createdAt: '2026-05-28T10:00:00.000Z',
    updatedAt: '2026-05-28T11:00:00.000Z',
    verifiedAt: '2026-05-28T11:05:00.000Z',
    activityCount: 8,
    lastActivityAt: '2026-05-28T11:05:00.000Z',
  },
  {
    telegramUserId: '200',
    telegramUsername: 'bob',
    firstName: 'Bob',
    lastName: 'B',
    xtUid: 'BBB222',
    verificationStatus: 'pending_review',
    accessLevel: 'none',
    createdAt: '2026-05-28T09:00:00.000Z',
    updatedAt: '2026-05-28T10:00:00.000Z',
    verifiedAt: null,
    activityCount: 3,
    lastActivityAt: '2026-05-28T10:00:00.000Z',
  },
  {
    telegramUserId: '100',
    telegramUsername: 'alice',
    firstName: 'Alice',
    lastName: 'A',
    xtUid: 'AAA111',
    verificationStatus: 'not_verified',
    accessLevel: 'none',
    createdAt: '2026-05-28T08:00:00.000Z',
    updatedAt: '2026-05-28T08:30:00.000Z',
    verifiedAt: null,
    activityCount: 1,
    lastActivityAt: '2026-05-28T08:30:00.000Z',
  },
];

describe('crm logic', () => {
  it('hashes and verifies CRM passwords', async () => {
    const { salt, hash } = await hashCrmPassword('secret');
    expect(await verifyCrmPassword('secret', salt, hash)).toBe(true);
    expect(await verifyCrmPassword('wrong', salt, hash)).toBe(false);
  });

  it('creates and verifies signed CRM sessions', async () => {
    const payload: CrmSessionPayload = {
      sessionId: 'session-1',
      crmUserId: 12,
      role: 'admin',
      expiresAt: Date.now() + 60_000,
    };
    const token = await createSignedSession('crm-secret', payload);
    await expect(verifySignedSession('crm-secret', token)).resolves.toMatchObject(payload);
    await expect(verifySignedSession('wrong-secret', token)).resolves.toBeNull();
  });

  it('handles CRM roles and cookie helpers', () => {
    expect(isCrmRole('admin')).toBe(true);
    expect(normalizeCrmRole('viewer')).toBe('viewer');
    expect(normalizeCrmRole('not-a-role')).toBeNull();

    const cookie = buildCrmCookie('token-value', false);
    expect(cookie).toContain('crm_session=token-value');
    expect(cookie).not.toContain('Secure');
    expect(readCookie(cookie, 'crm_session')).toBe('token-value');
    expect(clearCrmCookie(true)).toContain('Secure');
  });

  it('filters, sorts, and paginates CRM users', () => {
    const filtered = filterCrmUsers(sampleUsers, { search: 'bob', verificationStatus: 'pending_review' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.telegramUserId).toBe('200');

    const sorted = sortCrmUsers(sampleUsers, 'telegramUserId', 'asc');
    expect(sorted.map((row) => row.telegramUserId)).toEqual(['100', '200', '300']);

    const paginated = paginateCrmUsers(sorted, 2, 1);
    expect(paginated.data).toHaveLength(1);
    expect(paginated.pageCount).toBe(3);
    expect(paginated.page).toBe(2);
  });

  it('builds a CSV from CRM user rows', () => {
    const csv = buildCrmUsersCsv(sampleUsers.slice(0, 1));
    expect(csv).toContain('telegramUserId,telegramUsername,firstName,lastName,xtUid,verificationStatus,accessLevel,createdAt,updatedAt,verifiedAt');
    expect(csv).toContain('300,carol,Carol,C,CCC333,verified,verified_referral');
  });
});
