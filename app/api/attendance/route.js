
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("attendance")
      .select("record_id, faculty_name, date, time, status")
      .order("date", { ascending: false })
      .order("time", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ records: data });
  } catch (error) {
    console.error("Attendance fetch error:", error.message);

    return NextResponse.json(
      { error: "Unable to retrieve attendance records." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      record_id,
      faculty_name,
      date,
      time,
      status
    } = body;

    if (
      !record_id ||
      !faculty_name ||
      !date ||
      !time ||
      !["Present", "Late", "Absent"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid attendance information." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("attendance")
      .insert({
        record_id,
        faculty_name,
        date,
        time,
        status
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { record: data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Attendance save error:", error.message);

    return NextResponse.json(
      { error: "Unable to save attendance record." },
      { status: 500 }
    );
  }
}

