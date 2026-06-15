export function isDebugEnabled(searchParams?: URLSearchParams | string | null) {
  if (process.env.NODE_ENV !== "production") return true;
  if (!searchParams) return false;
  if (typeof searchParams === "string") {
    return new URLSearchParams(searchParams).get("debug") === "1";
  }
  return searchParams.get("debug") === "1";
}

export function debugLog(scope: string, payload: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    console.log(`[sticke:${scope}]`, JSON.stringify(payload));
    return;
  }

  console.log(`[sticke:${scope}]`, payload);
}
