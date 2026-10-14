import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const upcoming = await pool.query(
    `SELECT 1 FROM reservations
     WHERE resource_id = $1 AND status = 'ACTIVE' AND end_time > NOW() LIMIT 1`,
    [id]
  );
  if (upcoming.rowCount) {
    return NextResponse.json(
      { error: "This resource has upcoming reservations. Cancel them first." },
      { status: 409 }
    );
  }

  // soft delete so old reservation history is kept
  const result = await pool.query(
    "UPDATE resources SET is_active = FALSE WHERE id = $1 AND is_active = TRUE",
    [id]
  );
  if (!result.rowCount) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}