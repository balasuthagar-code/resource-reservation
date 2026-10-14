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

  const result = await pool.query(
    "UPDATE reservations SET status = 'CANCELLED' WHERE id = $1 AND status = 'ACTIVE'",
    [id]
  );
  if (!result.rowCount) {
    return NextResponse.json({ error: "Active reservation not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}