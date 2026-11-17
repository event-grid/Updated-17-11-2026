/**
 * Each generated client (public, customer) has its own ResponseError and FetchError classes, so they are
 * recognised by name rather than with `instanceof`.
 */
function isResponseError(error: unknown): error is Error & { response: Response } {
  return error instanceof Error && error.name === "ResponseError" && "response" in error;
}

function isFetchError(error: unknown): error is Error {
  return error instanceof Error && error.name === "FetchError";
}

/** A backend error as Problem Details (RFC 9457) with EVNTGRID's `code` and `correlationId`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    readonly correlationId: string | undefined,
    detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

/**
 * Converts what the generated client throws into an `ApiError`:
 * an HTTP error response (ResponseError) or an unreachable backend (FetchError).
 */
export async function toApiError(error: unknown, baseUrl: string): Promise<ApiError> {
  if (error instanceof ApiError) {
    return error;
  }
  if (isResponseError(error)) {
    const response = error.response;
    let problem: { code?: string; correlationId?: string; detail?: string } = {};
    try {
      problem = await response.json();
    } catch {
      // not a JSON body
    }
    return new ApiError(
      response.status,
      problem.code,
      problem.correlationId ?? response.headers.get("X-Correlation-Id") ?? undefined,
      problem.detail ?? `Request failed with status ${response.status}.`,
    );
  }
  if (isFetchError(error)) {
    return new ApiError(
      503,
      "API_UNREACHABLE",
      undefined,
      `The EVNTGRID API could not be reached at ${baseUrl}. Is the backend running?`,
    );
  }
  return new ApiError(500, "UNEXPECTED", undefined, error instanceof Error ? error.message : String(error));
}
