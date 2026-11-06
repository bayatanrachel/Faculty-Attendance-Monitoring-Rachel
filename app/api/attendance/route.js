
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const authenticated = await verifySession();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("Attendance")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ records: data });
  } catch {
    return NextResponse.json(
      { error: "Unable to retrieve attendance records." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authenticated = await verifySession();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      record_id,
      faculty_name,
      date,
      time,
      status,
    } = body;

    if (
      !record_id ||
      !faculty_name ||
      !date ||
      !time ||
      !["Present", "Late", "Absent"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid attendance data." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("Attendance")
      .insert([
        {
          record_id,
          faculty_name,
          date,
          time,
          status,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, record: data },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to save attendance record." },
      { status: 500 }
    );
  }
}
