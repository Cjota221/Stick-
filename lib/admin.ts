import { NextRequest } from "next/server";

export function isAdminRequest(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && request.headers.get("x-admin-password") === password);
}
