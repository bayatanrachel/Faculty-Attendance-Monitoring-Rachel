
import { NextResponse } from "next/server";
import {
  createSessionToken,
  COOKIE_NAME,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { facultyId, password } = await request.json();

    const correctId = process.env.FACULTY_LOGIN_ID;
    const correctPassword = process.env.FACULTY_LOGIN_PASSWORD;

    if (!correctId || !correctPassword) {
      return NextResponse.json(
        { error: "Login configuration is missing." },
        { status: 500 }
      );
    }

    if (
      facultyId !== correctId ||
      password !== correctPassword
    ) {
      return NextResponse.json(
        { error: "Invalid Faculty ID or password." },
        { status: 401 }
      );
    }

    const token = createSessionToken(facultyId);

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to process login." },
      { status: 400 }
    );
  }
}

