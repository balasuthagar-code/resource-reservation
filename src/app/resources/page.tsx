"use client";

import { useCallback, useEffect, useState } from "react";
import { Resource } from "@/lib/types";

const emptyForm = { name: "", type: "Room", capacity: "", location: "" };

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/resources");
    setResources(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setForm(emptyForm);
    load();
  }

  async function handleRemove(id: number) {
    if (!confirm("Remove this resource?")) return;
    setError("");
    const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    load();
  }

  return (
    <>
      <h1>Resources</h1>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Add a resource</h3>
        {error && <div className="error">{error}</div>}
        <form className="row" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option>Room</option>
              <option>Equipment</option>
              <option>Vehicle</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Capacity
            <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </label>
          <label>
            Location
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
          <button type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Type</th><th>Capacity</th><th>Location</th><th></th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.type}</td>
                <td>{r.capacity ?? "-"}</td>
                <td>{r.location ?? "-"}</td>
                <td>
                  <button className="danger" onClick={() => handleRemove(r.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}