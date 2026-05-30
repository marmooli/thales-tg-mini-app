export type CrmRole = 'super_admin' | 'admin' | 'viewer';

export const CRM_ROLES: CrmRole[] = ['super_admin', 'admin', 'viewer'];

export type CrmSessionPayload = {
  sessionId: string;
  crmUserId: number;
  role: CrmRole;
  expiresAt: number;
};

export type CrmUserRecord = {
  id: number;
  username: string;
  role: CrmRole;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
};

export type CrmUserListRow = {
  telegramUserId: string;
  telegramUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  xtUid: string | null;
  discountEmail?: string | null;
  discountEmailSentAt?: string | null;
  couponSentAt?: string | null;
  verificationStatus: string;
  accessLevel: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  activityCount: number;
  lastActivityAt: string | null;
};

export type CrmUserFilters = {
  search?: string;
  verificationStatus?: string;
  accessLevel?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export type CrmTimelineEvent = {
  id: number;
  eventType: string;
  telegramUserId: string | null;
  crmUserId: number | null;
  xtUid: string | null;
  actorRole: string | null;
  title: string;
  detailsJson: string | null;
  createdAt: string;
};

export function isCrmRole(value: unknown): value is CrmRole {
  return typeof value === 'string' && CRM_ROLES.includes(value as CrmRole);
}

export function normalizeCrmRole(value: unknown): CrmRole | null {
  return isCrmRole(value) ? value : null;
}

export function normalizeCrmPage(value: unknown, fallback = 1) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : fallback;
}

export function normalizeCrmPageSize(value: unknown, fallback = 10) {
  const pageSize = Number(value);
  if (!Number.isFinite(pageSize)) return fallback;
  return Math.min(Math.max(Math.floor(pageSize), 5), 50);
}

export function normalizeCrmSortDir(value: unknown): 'asc' | 'desc' {
  return value === 'asc' ? 'asc' : 'desc';
}

export async function hashCrmPassword(password: string, salt = randomToken(16)) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`));
  return {
    salt,
    hash: toHex(digest),
  };
}

export async function verifyCrmPassword(password: string, salt: string, expectedHash: string) {
  const actual = await hashCrmPassword(password, salt);
  return timingSafeEqual(actual.hash, expectedHash);
}

export async function createSignedSession(secret: string, payload: CrmSessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmacHex(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySignedSession(secret: string, token: string): Promise<CrmSessionPayload | null> {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;
  const expected = await hmacHex(secret, encodedPayload);
  if (!timingSafeEqual(expected, signature)) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as CrmSessionPayload;
    if (
      typeof payload?.sessionId !== 'string' ||
      typeof payload?.crmUserId !== 'number' ||
      typeof payload?.role !== 'string' ||
      typeof payload?.expiresAt !== 'number'
    ) {
      return null;
    }
    if (!isCrmRole(payload.role)) return null;
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildCrmCookie(token: string, secure: boolean) {
  return `crm_session=${token}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=${60 * 60 * 24 * 7}`;
}

export function clearCrmCookie(secure: boolean) {
  return `crm_session=; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=0`;
}

export function readCookie(header: string | null, name: string) {
  if (!header) return null;
  const pair = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return pair ? pair.slice(name.length + 1) : null;
}

export function filterCrmUsers(users: CrmUserListRow[], filters: CrmUserFilters) {
  const search = filters.search?.trim().toLowerCase() ?? '';
  const verificationStatus = filters.verificationStatus?.trim().toLowerCase() ?? '';
  const accessLevel = filters.accessLevel?.trim().toLowerCase() ?? '';

  return users.filter((user) => {
    if (search) {
      const haystack = [
        user.telegramUserId,
        user.telegramUsername ?? '',
        user.firstName ?? '',
        user.lastName ?? '',
        user.xtUid ?? '',
        user.verificationStatus,
        user.accessLevel,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (verificationStatus && user.verificationStatus.toLowerCase() !== verificationStatus) return false;
    if (accessLevel && user.accessLevel.toLowerCase() !== accessLevel) return false;
    return true;
  });
}

export function sortCrmUsers(users: CrmUserListRow[], sortBy: string, sortDir: 'asc' | 'desc') {
  const factor = sortDir === 'asc' ? 1 : -1;
  return [...users].sort((left, right) => {
    const a = getSortableValue(left, sortBy);
    const b = getSortableValue(right, sortBy);
    if (a === b) return 0;
    return a > b ? factor : -factor;
  });
}

export function paginateCrmUsers<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(safePage, pageCount);
  const start = (currentPage - 1) * safePageSize;
  const data = items.slice(start, start + safePageSize);
  return {
    data,
    total,
    page: currentPage,
    pageSize: safePageSize,
    pageCount,
  };
}

export function buildCrmUsersCsv(rows: CrmUserListRow[]) {
  const headers = [
    'telegramUserId',
    'telegramUsername',
    'firstName',
    'lastName',
    'xtUid',
    'discountEmail',
    'verificationStatus',
    'accessLevel',
    'createdAt',
    'updatedAt',
    'verifiedAt',
  ];
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [
        row.telegramUserId,
        row.telegramUsername,
        row.firstName,
        row.lastName,
        row.xtUid,
        row.discountEmail,
        row.verificationStatus,
        row.accessLevel,
        row.createdAt,
        row.updatedAt,
        row.verifiedAt,
      ]
        .map((value) => escapeCsv(value ?? ''))
        .join(','),
    ),
  ];
  return `${lines.join('\n')}\n`;
}

export function serializeCrmTimelineEvent(event: CrmTimelineEvent) {
  return {
    id: event.id,
    eventType: event.eventType,
    telegramUserId: event.telegramUserId,
    crmUserId: event.crmUserId,
    xtUid: event.xtUid,
    actorRole: event.actorRole,
    title: event.title,
    details: safeJsonParse(event.detailsJson),
    createdAt: event.createdAt,
  };
}

export async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(signature);
}

function getSortableValue(user: CrmUserListRow, sortBy: string) {
  switch (sortBy) {
    case 'telegramUserId':
      return user.telegramUserId;
    case 'telegramUsername':
      return user.telegramUsername ?? '';
    case 'xtUid':
      return user.xtUid ?? '';
    case 'verificationStatus':
      return user.verificationStatus;
    case 'accessLevel':
      return user.accessLevel;
    case 'createdAt':
      return user.createdAt;
    case 'updatedAt':
      return user.updatedAt;
    case 'verifiedAt':
      return user.verifiedAt ?? '';
    case 'activityCount':
      return String(user.activityCount);
    case 'lastActivityAt':
      return user.lastActivityAt ?? '';
    default:
      return user.updatedAt;
  }
}

function escapeCsv(value: string) {
  const normalized = value.replace(/\r?\n/g, ' ');
  return /[",]/.test(normalized) ? `"${normalized.replace(/"/g, '""')}"` : normalized;
}

function safeJsonParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function randomToken(length: number) {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return [...buffer].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}
