import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("resourceId");
  const resourceId = raw ? Number(raw) : null;
  if (raw && !Number.isInteger(resourceId)) {
    return NextResponse.json({ error: "Invalid resourceId." }, { status: 400 });
  }

  const { rows } = await pool.query(
    `SELECT rv.*, r.name AS resource_name
     FROM reservations rv
     JOIN resources r ON r.id = rv.resource_id
     WHERE ($1::int IS NULL OR rv.resource_id = $1)
     ORDER BY rv.start_time DESC`,
    [resourceId]
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const resourceId = Number(body?.resourceId);
  const reservedBy = String(body?.reservedBy ?? "").trim();
  const purpose = String(body?.purpose ?? "").trim() || null;
  const start = new Date(body?.startTime);
  const end = new Date(body?.endTime);

  if (!Number.isInteger(resourceId) || !reservedBy) {
    return NextResponse.json({ error: "Resource and name are required." }, { status: 400 });
  }
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Please enter valid start and end times." }, { status: 400 });
  }
  if (end <= start) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
  }
  if (start.getTime() < Date.now() - 60 * 1000) {
    return NextResponse.json({ error: "Start time cannot be in the past." }, { status: 400 });
  }

  const resource = await pool.query(
    "SELECT is_active FROM resources WHERE id = $1",
    [resourceId]
  );
  if (!resource.rowCount || !resource.rows[0].is_active) {
    return NextResponse.json({ error: "Resource is not available." }, { status: 404 });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO reservations (resource_id, reserved_by, purpose, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [resourceId, reservedBy, purpose, start.toISOString(), end.toISOString()]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    // 23P01 = exclusion constraint violation (overlap)
    if ((err as { code?: string }).code === "23P01") {
      const clash = await pool.query(
        `SELECT reserved_by, start_time, end_time FROM reservations
         WHERE resource_id = $1 AND status = 'ACTIVE'
           AND tstzrange(start_time, end_time) && tstzrange($2::timestamptz, $3::timestamptz)
         LIMIT 1`,
        [resourceId, start.toISOString(), end.toISOString()]
      );
      return NextResponse.json(
        {
          error: "This resource is already reserved for that time.",
          conflict: clash.rows[0] ?? null,
        },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Could not create reservation." }, { status: 500 });
  }
}