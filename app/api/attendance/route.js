
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized. Please sign in." },
    { status: 401 }
  );
}

export async function GET() {
  // Add verified server-side session validation here
  // before allowing access to attendance records.
  return unauthorized();
}

export async function POST() {
  // Add verified server-side session validation here
  // before allowing attendance records to be saved.
  return unauthorized();
}
