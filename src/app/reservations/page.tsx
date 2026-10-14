"use client";

import { useCallback, useEffect, useState } from "react";
import { Reservation, Resource, formatDateTime } from "@/lib/types";

const emptyForm = { resourceId: "", reservedBy: "", purpose: "", start: "", end: "" };

export default function ReservationsPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReservations = useCallback(async () => {
    const url = filter ? `/api/reservations?resourceId=${filter}` : "/api/reservations";
    const res = await fetch(url);
    setReservations(await res.json());
  }, [filter]);

  useEffect(() => {
    fetch("/api/resources")
      .then((res) => res.json())
      .then(setResources);
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.start || !form.end) {
      setError("Please choose start and end time.");
      return;
    }

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId: Number(form.resourceId),
        reservedBy: form.reservedBy,
        purpose: form.purpose,
        startTime: new Date(form.start).toISOString(),
        endTime: new Date(form.end).toISOString(),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      let text = data.error;
      if (data.conflict) {
        text += ` (${data.conflict.reserved_by}: ${formatDateTime(data.conflict.start_time)} - ${formatDateTime(data.conflict.end_time)})`;
      }
      setError(text);
      return;
    }

    setMessage("Reservation created.");
    setForm(emptyForm);
    loadReservations();
  }

  async function handleCancel(id: number) {
    if (!confirm("Cancel this reservation?")) return;
    setError("");
    setMessage("");
    const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    setMessage("Reservation cancelled.");
    loadReservations();
  }

  return (
    <>
      <h1>Reservations</h1>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>New reservation</h3>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
        <form className="row" onSubmit={handleSubmit}>
          <label>
            Resource
            <select value={form.resourceId} onChange={(e) => setForm({ ...form, resourceId: e.target.value })} required>
              <option value="">Select...</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          <label>
            Your name
            <input value={form.reservedBy} onChange={(e) => setForm({ ...form, reservedBy: e.target.value })} required />
          </label>
          <label>
            Purpose
            <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </label>
          <label>
            Start
            <input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required />
          </label>
          <label>
            End
            <input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} required />
          </label>
          <button type="submit">Reserve</button>
        </form>
      </div>

      <div className="card">
        <label style={{ maxWidth: 260, marginBottom: 12 }}>
          Filter by resource
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All resources</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>

        <table>
          <thead>
            <tr>
              <th>Resource</th><th>Reserved by</th><th>Purpose</th><th>Time</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((rv) => (
              <tr key={rv.id}>
                <td>{rv.resource_name}</td>
                <td>{rv.reserved_by}</td>
                <td>{rv.purpose ?? "-"}</td>
                <td>{formatDateTime(rv.start_time)} - {formatDateTime(rv.end_time)}</td>
                <td>
                  <span className={`badge ${rv.status === "ACTIVE" ? "active" : "cancelled"}`}>
                    {rv.status === "ACTIVE" ? "Active" : "Cancelled"}
                  </span>
                </td>
                <td>
                  {rv.status === "ACTIVE" && new Date(rv.end_time) > new Date() && (
                    <button className="danger" onClick={() => handleCancel(rv.id)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr><td colSpan={6} className="muted">No reservations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}