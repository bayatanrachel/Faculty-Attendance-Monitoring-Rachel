
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "faculty_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or too short.");
  }

  return secret;
}

export function createSessionToken(facultyId) {
  const payload = Buffer.from(
    JSON.stringify({
      facultyId,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    })
  ).toString("base64url");

  const signature = createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = createHmac("sha256", getSecret())
    .update(payload)
    .digest();

  let actual;

  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return false;
  }

  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    return false;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );

    return (
      session.facultyId === "FAC-001" &&
      session.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
}

export { COOKIE_NAME };

