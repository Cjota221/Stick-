import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE = "sticke_admin_session";
const COOKIE_PAYLOAD = "sticke-admin-v1";

export function createAdminSession() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD não configurada.");
  return createHmac("sha256", secret).update(COOKIE_PAYLOAD).digest("hex");
}

export function isAdminRequest(request: NextRequest) {
  const received = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!received) return false;
  const expected = createAdminSession();
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
