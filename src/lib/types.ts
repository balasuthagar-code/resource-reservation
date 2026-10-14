export type Resource = {
  id: number;
  name: string;
  type: string;
  capacity: number | null;
  location: string | null;
  in_use_by: string | null;
  in_use_until: string | null;
  next_start: string | null;
};

export type Reservation = {
  id: number;
  resource_id: number;
  resource_name: string;
  reserved_by: string;
  purpose: string | null;
  start_time: string;
  end_time: string;
  status: "ACTIVE" | "CANCELLED";
};

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}