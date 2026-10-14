"use client";

import { useEffect, useState } from "react";
import { Resource, formatDateTime } from "@/lib/types";

export default function DashboardPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resources")
      .then((res) => res.json())
      .then((data) => setResources(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <h1>Dashboard</h1>
      <p className="muted">Current status of all resources.</p>
      {resources.length === 0 && <p>No resources yet. Add one in the Resources page.</p>}
      <div className="grid">
        {resources.map((r) => (
          <div className="card" key={r.id}>
            <h3 style={{ margin: "0 0 4px" }}>{r.name}</h3>
            <p className="muted" style={{ margin: "0 0 10px" }}>
              {r.type}
              {r.capacity ? ` · capacity ${r.capacity}` : ""}
              {r.location ? ` · ${r.location}` : ""}
            </p>
            {r.in_use_until ? (
              <>
                <span className="badge busy">In use</span>
                <p className="muted">
                  {r.in_use_by} until {formatDateTime(r.in_use_until)}
                </p>
              </>
            ) : (
              <>
                <span className="badge free">Available now</span>
                <p className="muted">
                  {r.next_start
                    ? `Next booking: ${formatDateTime(r.next_start)}`
                    : "No upcoming bookings"}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}