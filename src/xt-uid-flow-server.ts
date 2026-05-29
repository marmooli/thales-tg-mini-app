import { logCrmEvent } from './crm-server';
import { shouldRevealXtUidSupport, getXtUidFlowNavigationEvent, type XtUidFlowRoute } from './xt-uid-flow';
import type { XtVerificationAttempt } from './xt-verification';

type XtUidFlowDatabaseEnv = {
  DB: D1Database;
};

export async function recordXtUidVerificationAttempt(
  env: XtUidFlowDatabaseEnv,
  params: {
    telegramUserId: string;
    xtUid: string;
    verificationSessionId: string;
    result: XtVerificationAttempt;
  },
) {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO uid_verification_attempts (telegram_user_id, verification_session_id, xt_uid, status, source, raw_result, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      params.telegramUserId,
      params.verificationSessionId,
      params.xtUid,
      params.result.status,
      params.result.source,
      params.result.rawResult ? JSON.stringify(params.result.rawResult) : null,
      now,
    )
    .run();

  const failedAttemptsInSession = await getFailedXtUidAttemptCount(env, params.telegramUserId, params.verificationSessionId);
  return {
    failedAttemptsInSession,
    showSupport: shouldRevealXtUidSupport(failedAttemptsInSession),
  } as const;
}

export async function getFailedXtUidAttemptCount(
  env: XtUidFlowDatabaseEnv,
  telegramUserId: string,
  verificationSessionId: string,
) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM uid_verification_attempts
     WHERE telegram_user_id = ?
       AND verification_session_id = ?
       AND status != 'verified'`,
  )
    .bind(telegramUserId, verificationSessionId)
    .first<{ count: number }>();

  return row?.count ?? 0;
}

export async function recordXtUidFlowNavigationEvent(
  env: XtUidFlowDatabaseEnv,
  params: {
    telegramUserId: string;
    verificationSessionId: string;
    route: Exclude<XtUidFlowRoute, 'main'>;
  },
) {
  const event = getXtUidFlowNavigationEvent(params.route);
  await logCrmEvent(env, {
    eventType: event.eventType,
    telegramUserId: params.telegramUserId,
    title: event.title,
    details: {
      route: params.route,
      verificationSessionId: params.verificationSessionId,
    },
  });
}
