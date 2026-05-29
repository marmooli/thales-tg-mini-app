import { useEffect, useMemo, useState } from 'react';
import { toPersianDigits } from './shared';

type CrmRole = 'super_admin' | 'admin' | 'viewer';

type CrmSessionUser = {
  id: number;
  username: string;
  role: CrmRole;
  allowedRoles: CrmRole[];
  lastLoginAt: string | null;
};

type CrmMeResponse =
  | { ok: true; user: CrmSessionUser }
  | { ok: false; message: string };

type CrmLoginResponse =
  | { ok: true; user: CrmSessionUser }
  | { ok: false; message: string };

type CrmListRow = {
  telegramUserId: string;
  telegramUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  xtUid: string | null;
  verificationStatus: string;
  accessLevel: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  activityCount: number;
  lastActivityAt: string | null;
};

type CrmListResponse =
  | {
      ok: true;
      users: CrmListRow[];
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    }
  | { ok: false; message: string };

type CrmDetailResponse =
  | {
      ok: true;
      user: CrmListRow & {
        lastLoginAt: string | null;
      };
      activity: Array<{
        id: number;
        eventType: string;
        title: string;
        telegramUserId: string | null;
        xtUid: string | null;
        actorRole: string | null;
        details: unknown;
        createdAt: string;
      }>;
    }
  | { ok: false; message: string };

type CrmDetailData = Extract<CrmDetailResponse, { ok: true }>;

type CrmRoute =
  | { kind: 'login' }
  | { kind: 'users' }
  | { kind: 'detail'; telegramUserId: string };

type Filters = {
  search: string;
  verificationStatus: string;
  accessLevel: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
};

const INITIAL_FILTERS: Filters = {
  search: '',
  verificationStatus: '',
  accessLevel: '',
  sortBy: 'updatedAt',
  sortDir: 'desc',
  page: 1,
  pageSize: 10,
};

const ROUTE_PREFIX = '/crm';
const tableColumns: Array<{ key: keyof CrmListRow | 'actions'; label: string }> = [
  { key: 'telegramUserId', label: 'شناسه تلگرام' },
  { key: 'telegramUsername', label: 'یوزرنیم' },
  { key: 'xtUid', label: 'شناسه XT' },
  { key: 'verificationStatus', label: 'وضعیت' },
  { key: 'accessLevel', label: 'سطح دسترسی' },
  { key: 'updatedAt', label: 'آخرین تغییر' },
  { key: 'actions', label: 'عملیات' },
];

export function CrmApp() {
  const [route, setRoute] = useState<CrmRoute>(() => parseRoute(window.location.pathname));
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'unauthorized'>('loading');
  const [currentUser, setCurrentUser] = useState<CrmSessionUser | null>(null);
  const [authMessage, setAuthMessage] = useState('در حال بررسی دسترسی...');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [users, setUsers] = useState<CrmListRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, pageCount: 1, total: 0 });
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CrmDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated' && route.kind === 'login') {
      navigate('/crm/users');
    }
  }, [authStatus, route.kind]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    if (route.kind !== 'users') return;
    void loadUsers(filters);
  }, [authStatus, route.kind, filters]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    if (route.kind !== 'detail') return;
    void loadDetail(route.telegramUserId);
  }, [authStatus, route.kind]);

  async function refreshAuth() {
    try {
      const response = await fetch('/api/crm/me', { credentials: 'include' });
      const data = (await response.json()) as CrmMeResponse;
      if (data.ok) {
        setCurrentUser(data.user);
        setAuthStatus('authenticated');
        setAuthMessage(`خوش آمدی، ${data.user.username}.`);
      } else {
        setCurrentUser(null);
        setAuthStatus('unauthenticated');
        setAuthMessage(data.message);
      }
    } catch {
      setCurrentUser(null);
      setAuthStatus('unauthenticated');
      setAuthMessage('ارتباط با سرور CRM برقرار نشد.');
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoginSubmitting(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/crm/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = (await response.json()) as CrmLoginResponse;
      if (data.ok) {
        setCurrentUser(data.user);
        setAuthStatus('authenticated');
        setAuthMessage(`خوش آمدی، ${data.user.username}.`);
        setLoginForm({ username: '', password: '' });
        setLoginError(null);
        if (route.kind === 'login') navigate('/crm/users');
      } else {
        setLoginError(data.message);
        setAuthStatus('unauthenticated');
      }
    } catch {
      setLoginError('ورود CRM با خطا مواجه شد.');
      setAuthStatus('unauthenticated');
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/crm/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setCurrentUser(null);
      setAuthStatus('unauthenticated');
      navigate('/crm');
    }
  }

  async function loadUsers(nextFilters: Filters) {
    setListLoading(true);
    setListError(null);
    try {
      const response = await fetch(`/api/crm/users?${buildUserQuery(nextFilters)}`, {
        credentials: 'include',
      });
      const data = (await response.json()) as CrmListResponse;
      if (data.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        setListError(data.message);
      }
    } catch {
      setListError('دریافت فهرست کاربران با خطا مواجه شد.');
    } finally {
      setListLoading(false);
    }
  }

  async function loadDetail(telegramUserId: string) {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await fetch(`/api/crm/users/${encodeURIComponent(telegramUserId)}`, {
        credentials: 'include',
      });
      const data = (await response.json()) as CrmDetailResponse;
      if (data.ok) {
        setDetail(data);
      } else {
        setDetailError(data.message);
      }
    } catch {
      setDetailError('دریافت جزئیات کاربر با خطا مواجه شد.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function exportCsv() {
    const response = await fetch(`/api/crm/users/export?${buildUserQuery(filters)}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      setListError('خروجی CSV قابل دریافت نبود.');
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `crm-users-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  const routeTitle = useMemo(() => {
    if (route.kind === 'detail') return 'جزئیات کاربر';
    if (route.kind === 'users') return 'کاربران';
    return 'ورود CRM';
  }, [route.kind]);

  const authenticated = authStatus === 'authenticated' && currentUser;

  return (
    <main className="crm-app">
      <div className="crm-backdrop crm-backdrop-a" />
      <div className="crm-backdrop crm-backdrop-b" />

      <div className="crm-shell">
        <header className="crm-header card">
          <div className="crm-brand">
            <div className="crm-brand-mark">C</div>
            <div>
              <p className="crm-eyebrow">وب‌اپ داخلی CRM</p>
              <h1>داشبورد مشتریان ثالس</h1>
              <p className="crm-muted">رصد کاربران مینی‌اپ، فعالیت‌ها، وضعیت‌ها و خروجی CSV در یک محیط داخلی</p>
            </div>
          </div>
          <div className="crm-header-actions">
            <span className="crm-pill crm-pill-muted">فقط خواندنی</span>
            <span className="crm-pill">{routeTitle}</span>
            {authenticated ? <span className="crm-pill crm-pill-positive">{currentUser.role}</span> : null}
            {authenticated ? (
              <button className="crm-ghost-button" onClick={handleLogout}>
                خروج
              </button>
            ) : null}
          </div>
        </header>

        <section className="crm-viewport card">
          {!authenticated ? (
            <LoginView
              authStatus={authStatus}
              authMessage={authMessage}
              loginForm={loginForm}
              loginSubmitting={loginSubmitting}
              loginError={loginError}
              onChange={setLoginForm}
              onSubmit={handleLogin}
            />
          ) : route.kind === 'detail' ? (
            <UserDetailView
              telegramUserId={route.telegramUserId}
              detail={detail}
              detailLoading={detailLoading}
              detailError={detailError}
              onBack={() => navigate('/crm/users')}
            />
          ) : (
            <UsersView
              currentUser={currentUser}
              users={users}
              pagination={pagination}
              filters={filters}
              listLoading={listLoading}
              listError={listError}
              onFiltersChange={(next) => {
                setFilters(next);
                if (next.page !== filters.page) {
                  setPagination((prev) => ({ ...prev, page: next.page }));
                }
              }}
              onOpenDetail={(telegramUserId) => navigate(`/crm/users/${encodeURIComponent(telegramUserId)}`)}
              onExport={exportCsv}
              onRefresh={() => void loadUsers(filters)}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function LoginView({
  authStatus,
  authMessage,
  loginForm,
  loginSubmitting,
  loginError,
  onChange,
  onSubmit,
}: {
  authStatus: 'loading' | 'authenticated' | 'unauthenticated' | 'unauthorized';
  authMessage: string;
  loginForm: { username: string; password: string };
  loginSubmitting: boolean;
  loginError: string | null;
  onChange: (next: { username: string; password: string }) => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
}) {
  return (
    <div className="crm-login stack">
      <div className="crm-login-copy">
        <p className="crm-eyebrow">ورود داخلی</p>
        <h2>دسترسی CRM</h2>
        <p className="crm-muted">
          این محیط فقط برای کاربران داخلی ثالس است و به‌صورت مستقیم از دیتابیس مینی‌اپ می‌خواند.
        </p>
      </div>

      <form className="crm-form" onSubmit={onSubmit}>
        <label>
          نام کاربری
          <input
            value={loginForm.username}
            onChange={(event) => onChange({ ...loginForm, username: event.target.value })}
            placeholder="نام کاربری داخلی"
            autoComplete="username"
          />
        </label>
        <label>
          رمز عبور
          <input
            value={loginForm.password}
            onChange={(event) => onChange({ ...loginForm, password: event.target.value })}
            placeholder="رمز عبور"
            autoComplete="current-password"
            type="password"
          />
        </label>
        <button className="primary" type="submit" disabled={loginSubmitting}>
          {loginSubmitting ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>

      <p className="crm-feedback">{authMessage}</p>
      {authStatus === 'unauthorized' ? <p className="crm-feedback crm-feedback-error">دسترسی شما برای این CRM معتبر نیست.</p> : null}
      {loginError ? <p className="crm-feedback crm-feedback-error">{loginError}</p> : null}
    </div>
  );
}

function UsersView({
  currentUser,
  users,
  pagination,
  filters,
  listLoading,
  listError,
  onFiltersChange,
  onOpenDetail,
  onExport,
  onRefresh,
}: {
  currentUser: CrmSessionUser;
  users: CrmListRow[];
  pagination: { page: number; pageSize: number; pageCount: number; total: number };
  filters: Filters;
  listLoading: boolean;
  listError: string | null;
  onFiltersChange: (next: Filters) => void;
  onOpenDetail: (telegramUserId: string) => void;
  onExport: () => Promise<void>;
  onRefresh: () => void;
}) {
  return (
    <div className="crm-stack">
      <div className="crm-toolbar">
        <div>
          <p className="crm-eyebrow">کاربر داخلی: {currentUser.username}</p>
          <h2>فهرست کاربران مینی‌اپ</h2>
          <p className="crm-muted">جستجو، فیلتر، مرتب‌سازی و خروجی CSV از داده‌های جاری</p>
        </div>
        <div className="crm-toolbar-actions">
          <button className="secondary" type="button" onClick={onRefresh}>
            به‌روزرسانی
          </button>
          <button className="primary" type="button" onClick={() => void onExport()}>
            خروجی CSV
          </button>
        </div>
      </div>

      <section className="crm-summary">
        <article className="crm-summary-card">
          <span>تعداد نتیجه</span>
          <strong>{toPersianDigits(pagination.total)}</strong>
          <small>ردیف فیلتر شده</small>
        </article>
        <article className="crm-summary-card">
          <span>در صفحه فعلی</span>
          <strong>{toPersianDigits(users.length)}</strong>
          <small>ردیف مشاهده شده</small>
        </article>
        <article className="crm-summary-card">
          <span>صفحه</span>
          <strong>
            {toPersianDigits(pagination.page)} / {toPersianDigits(pagination.pageCount)}
          </strong>
          <small>مرتب‌سازی الان</small>
        </article>
      </section>

      <div className="crm-filters">
        <label>
          جستجو
          <input
            value={filters.search}
            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value, page: 1 })}
            placeholder="شناسه تلگرام، یوزرنیم، XT UID..."
          />
        </label>
        <label>
          وضعیت تأیید
          <select
            value={filters.verificationStatus}
            onChange={(event) => onFiltersChange({ ...filters, verificationStatus: event.target.value, page: 1 })}
          >
            <option value="">همه</option>
            <option value="not_verified">تأیید نشده</option>
            <option value="pending_review">در انتظار بررسی</option>
            <option value="verified">تأیید شده</option>
            <option value="rejected">رد شده</option>
          </select>
        </label>
        <label>
          سطح دسترسی
          <select value={filters.accessLevel} onChange={(event) => onFiltersChange({ ...filters, accessLevel: event.target.value, page: 1 })}>
            <option value="">همه</option>
            <option value="none">none</option>
            <option value="verified_referral">verified_referral</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <label>
          مرتب‌سازی
          <select value={filters.sortBy} onChange={(event) => onFiltersChange({ ...filters, sortBy: event.target.value })}>
            <option value="updatedAt">آخرین تغییر</option>
            <option value="createdAt">تاریخ ایجاد</option>
            <option value="telegramUserId">شناسه تلگرام</option>
            <option value="telegramUsername">یوزرنیم</option>
            <option value="xtUid">شناسه XT</option>
            <option value="verificationStatus">وضعیت</option>
            <option value="accessLevel">سطح دسترسی</option>
            <option value="activityCount">تعداد فعالیت</option>
          </select>
        </label>
        <label>
          جهت
          <select value={filters.sortDir} onChange={(event) => onFiltersChange({ ...filters, sortDir: event.target.value as 'asc' | 'desc' })}>
            <option value="desc">نزولی</option>
            <option value="asc">صعودی</option>
          </select>
        </label>
      </div>

      {listError ? <p className="crm-feedback crm-feedback-error">{listError}</p> : null}

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              {tableColumns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listLoading ? (
              <tr>
                <td colSpan={tableColumns.length} className="crm-empty">
                  در حال دریافت اطلاعات...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={tableColumns.length} className="crm-empty">
                  داده‌ای برای نمایش وجود ندارد.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.telegramUserId} onClick={() => onOpenDetail(user.telegramUserId)} className="crm-clickable-row">
                  <td>{user.telegramUserId}</td>
                  <td>{user.telegramUsername ?? '—'}</td>
                  <td>{user.xtUid ?? '—'}</td>
                  <td>{renderStatusBadge(user.verificationStatus)}</td>
                  <td>{user.accessLevel}</td>
                  <td>{formatDateTime(user.updatedAt)}</td>
                  <td>
                    <span className="crm-row-link">جزئیات</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="crm-pagination">
        <p className="crm-muted">
          صفحه {toPersianDigits(pagination.page)} از {toPersianDigits(pagination.pageCount)} · {toPersianDigits(pagination.total)} ردیف
        </p>
        <div className="crm-pagination-actions">
          <button
            className="secondary"
            type="button"
            onClick={() => onFiltersChange({ ...filters, page: Math.max(1, filters.page - 1) })}
            disabled={pagination.page <= 1}
          >
            قبلی
          </button>
          <button
            className="secondary"
            type="button"
            onClick={() => onFiltersChange({ ...filters, page: Math.min(pagination.pageCount, filters.page + 1) })}
            disabled={pagination.page >= pagination.pageCount}
          >
            بعدی
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDetailView({
  telegramUserId,
  detail,
  detailLoading,
  detailError,
  onBack,
}: {
  telegramUserId: string;
  detail: CrmDetailData | null;
  detailLoading: boolean;
  detailError: string | null;
  onBack: () => void;
}) {
  const user = detail?.user;
  const activity = detail?.activity ?? [];

  return (
    <div className="crm-stack">
      <div className="crm-toolbar">
        <div>
          <p className="crm-eyebrow">شناسه تلگرام: {telegramUserId}</p>
          <h2>جزئیات کاربر</h2>
          <p className="crm-muted">نمایش پروفایل، وضعیت و تایم‌لاین فعالیت</p>
        </div>
        <button className="secondary" type="button" onClick={onBack}>
          بازگشت
        </button>
      </div>

      {detailError ? <p className="crm-feedback crm-feedback-error">{detailError}</p> : null}

      {detailLoading ? (
        <div className="crm-empty card">در حال دریافت جزئیات...</div>
      ) : user ? (
        <>
          <section className="crm-detail-grid">
            <article className="crm-detail-card">
              <h3>اطلاعات اصلی</h3>
              <dl>
                <dt>شناسه تلگرام</dt>
                <dd>{user.telegramUserId}</dd>
                <dt>یوزرنیم</dt>
                <dd>{user.telegramUsername ?? '—'}</dd>
                <dt>نام</dt>
                <dd>{[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}</dd>
                <dt>شناسه XT</dt>
                <dd>{user.xtUid ?? '—'}</dd>
              </dl>
            </article>
            <article className="crm-detail-card">
              <h3>وضعیت</h3>
              <dl>
                <dt>تأیید</dt>
                <dd>{renderStatusBadge(user.verificationStatus)}</dd>
                <dt>سطح دسترسی</dt>
                <dd>{user.accessLevel}</dd>
                <dt>ایجاد شده</dt>
                <dd>{formatDateTime(user.createdAt)}</dd>
                <dt>آخرین تغییر</dt>
                <dd>{formatDateTime(user.updatedAt)}</dd>
                <dt>آخرین تأیید</dt>
                <dd>{user.verifiedAt ? formatDateTime(user.verifiedAt) : '—'}</dd>
              </dl>
            </article>
          </section>

          <section className="crm-detail-card">
            <h3>تایم‌لاین فعالیت</h3>
            {activity.length === 0 ? (
              <p className="crm-empty-inline">فعلاً هیچ فعالیتی ثبت نشده است.</p>
            ) : (
              <ol className="crm-timeline">
                {activity.map((event: any) => (
                  <li key={event.id} className="crm-timeline-item">
                    <div className="crm-timeline-meta">
                      <strong>{event.title}</strong>
                      <span>{formatDateTime(event.createdAt)}</span>
                    </div>
                    <p className="crm-muted">
                      <span>{event.eventType}</span>
                      {event.xtUid ? <span> · XT: {event.xtUid}</span> : null}
                    </p>
                    {event.details ? <pre className="crm-timeline-details">{JSON.stringify(event.details, null, 2)}</pre> : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      ) : (
        <div className="crm-empty card">کاربر پیدا نشد.</div>
      )}
    </div>
  );
}

function renderStatusBadge(status: string) {
  return <span className={`crm-status crm-status-${status}`}>{status}</span>;
}

function parseRoute(pathname: string): CrmRoute {
  if (!pathname.startsWith(ROUTE_PREFIX)) return { kind: 'login' };
  if (pathname === ROUTE_PREFIX || pathname === `${ROUTE_PREFIX}/`) return { kind: 'users' };
  if (pathname === `${ROUTE_PREFIX}/login`) return { kind: 'login' };
  const detailPrefix = `${ROUTE_PREFIX}/users/`;
  if (pathname.startsWith(detailPrefix)) {
    return { kind: 'detail', telegramUserId: decodeURIComponent(pathname.slice(detailPrefix.length)) };
  }
  return { kind: 'users' };
}

function navigate(pathname: string) {
  if (window.location.pathname === pathname) return;
  window.history.pushState({}, '', pathname);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function buildUserQuery(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.verificationStatus) params.set('verificationStatus', filters.verificationStatus);
  if (filters.accessLevel) params.set('accessLevel', filters.accessLevel);
  params.set('sortBy', filters.sortBy);
  params.set('sortDir', filters.sortDir);
  params.set('page', String(filters.page));
  params.set('pageSize', String(filters.pageSize));
  return params.toString();
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}
