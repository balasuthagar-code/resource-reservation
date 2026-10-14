import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const { rows } = await pool.query(`
    SELECT r.id, r.name, r.type, r.capacity, r.location,
           cur.reserved_by AS in_use_by,
           cur.end_time    AS in_use_until,
           nxt.start_time  AS next_start
    FROM resources r
    LEFT JOIN LATERAL (
      SELECT reserved_by, end_time FROM reservations
      WHERE resource_id = r.id AND status = 'ACTIVE'
        AND start_time <= NOW() AND end_time > NOW()
      LIMIT 1
    ) cur ON TRUE
    LEFT JOIN LATERAL (
      SELECT start_time FROM reservations
      WHERE resource_id = r.id AND status = 'ACTIVE'
        AND start_time > NOW()
      ORDER BY start_time LIMIT 1
    ) nxt ON TRUE
    WHERE r.is_active = TRUE
    ORDER BY r.name
  `);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const type = String(body?.type ?? "").trim();
  const location = String(body?.location ?? "").trim() || null;
  const capacity =
    body?.capacity === "" || body?.capacity == null ? null : Number(body.capacity);

  if (!name || !type) {
    return NextResponse.json({ error: "Name and type are required." }, { status: 400 });
  }
  if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) {
    return NextResponse.json({ error: "Capacity must be a positive whole number." }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO resources (name, type, capacity, location)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, type, capacity, location]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "A resource with this name already exists." }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Could not create resource." }, { status: 500 });
  }
}