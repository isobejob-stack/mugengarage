import { NextResponse } from "next/server";

// error_response.md 4章: HTTPステータスコードとエラーコードの対応
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  field?: string | null;
  details?: unknown;
}

// 単一エラー（error_response.md 3章）
export function apiError(error: ApiError) {
  return NextResponse.json(
    { error: { field: null, details: null, ...error } },
    { status: STATUS_BY_CODE[error.code] },
  );
}

// 複数項目のバリデーションエラー（error_response.md 3章）
export function apiValidationErrors(errors: Array<Omit<ApiError, "code">>) {
  return NextResponse.json(
    {
      errors: errors.map((e) => ({
        code: "VALIDATION_ERROR" as const,
        field: null,
        ...e,
      })),
    },
    { status: STATUS_BY_CODE.VALIDATION_ERROR },
  );
}

// 想定外例外用。詳細はログにのみ残し、ユーザーには一般的なメッセージのみ返す（error_response.md 6章）
export function apiInternalError(loggedError: unknown) {
  console.error(loggedError);
  return apiError({
    code: "INTERNAL_ERROR",
    message:
      "時間をおいて再度お試しください。改善しない場合はサイト管理者にご連絡ください",
  });
}
