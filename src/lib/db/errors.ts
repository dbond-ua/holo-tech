/**
 * Turns a raw driver-level error (Postgres error codes, connection failures)
 * into a small, stable set of error codes safe to return from a Server
 * Action / Route Handler and show in the admin UI — never the raw
 * driver/SQL error text, which can leak column/constraint names or query
 * shape. The raw error is always still logged server-side via console.error
 * at the call site, for debugging.
 *
 * Postgres error codes reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */

export interface DbError {
  code: string;
  message: string;
}

interface PgErrorLike {
  code?: string;
  message?: string;
  constraint_name?: string;
  errno?: string;
}

const PG_CODE_MAP: Record<string, DbError> = {
  "23505": { code: "duplicate", message: "Такий запис вже існує (порушення унікальності)." },
  "23503": { code: "invalid_reference", message: "Посилання на неіснуючий пов'язаний запис." },
  "23502": { code: "missing_required_field", message: "Не заповнено обов'язкове поле." },
  "23514": { code: "constraint_violation", message: "Значення не проходить перевірку бази даних." },
  "22P02": { code: "invalid_input", message: "Некоректний формат значення." },
  "57014": { code: "timeout", message: "Запит до бази даних перевищив час очікування." },
  "53300": { code: "too_many_connections", message: "Забагато одночасних підключень до бази даних." },
  "28P01": { code: "auth_failed", message: "Помилка автентифікації бази даних (перевірте DATABASE_URL)." },
  "3D000": { code: "db_missing", message: "Вказана база даних не існує." },
};

const CONNECTION_ERRNOS = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "EHOSTUNREACH"]);

/** Maps any thrown value from a `sql` call to a stable {code, message} pair.
 *  Always logs the original error via console.error at the call site —
 *  this function only decides what's safe to surface to the caller/UI. */
export function describeDbError(err: unknown): DbError {
  const e = (err ?? {}) as PgErrorLike;

  if (e.code && PG_CODE_MAP[e.code]) return PG_CODE_MAP[e.code];
  if (e.errno && CONNECTION_ERRNOS.has(e.errno)) {
    return { code: "connection_failed", message: "Не вдалося підключитися до бази даних." };
  }
  if (e.code && CONNECTION_ERRNOS.has(e.code)) {
    return { code: "connection_failed", message: "Не вдалося підключитися до бази даних." };
  }

  return { code: "unknown", message: "Невідома помилка бази даних." };
}
