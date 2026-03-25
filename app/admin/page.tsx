"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Tab = "reports" | "places" | "users" | "hearts";

const STATUS_COLORS: Record<string, string> = {
  open: "#e8f5e9",
  triaged: "#fff8e1",
  closed: "#f5f5f5",
};

const STATUS_TEXT: Record<string, string> = {
  open: "#2e7d32",
  triaged: "#f57f17",
  closed: "#9e9e9e",
};

function Badge({ status }: { status: string }) {
  return (
    <span style={{
      background: STATUS_COLORS[status] ?? "#f5f5f5",
      color: STATUS_TEXT[status] ?? "#555",
      borderRadius: 20,
      padding: "2px 10px",
      fontSize: "0.78rem",
      fontWeight: 600,
      textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

function Btn({ onClick, color = "var(--teal)", children }: {
  onClick: () => void;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={{
      background: color,
      color: "#fff",
      border: "none",
      borderRadius: 6,
      padding: "3px 10px",
      fontSize: "0.78rem",
      fontWeight: 600,
      cursor: "pointer",
      marginRight: 4,
    }}>
      {children}
    </button>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reports");
  const [data, setData] = useState<Record<Tab, unknown[]>>({
    reports: [], places: [], users: [], hearts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (t: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      let res: Response;
      try {
        res = await fetch(`/api/admin/${t}`, { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
      if (res.status === 401) { router.push("/admin/login"); return; }
      const text = await res.text();
      if (!res.ok) {
        setError(`API error ${res.status}: ${text.slice(0, 300)}`);
        return;
      }
      try {
        const json = JSON.parse(text);
        setData(prev => ({ ...prev, [t]: Array.isArray(json) ? json : [] }));
        if (!Array.isArray(json)) setError(`Unexpected response: ${text.slice(0, 300)}`);
      } catch {
        setError(`Invalid JSON from API: ${text.slice(0, 300)}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(tab); }, [tab, load]);

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  async function updateReport(id: string, status: string) {
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load("reports");
  }

  async function del(resource: Tab, id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
    load(resource);
  }

  async function toggleApproved(id: string, current: boolean) {
    await fetch(`/api/admin/places/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: !current }),
    });
    load("places");
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "reports", label: "Reports" },
    { key: "places", label: "Places" },
    { key: "users", label: "Users" },
    { key: "hearts", label: "Hearts" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* Top bar */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e8e0d4",
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
      }}>
        <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: "1.1rem" }}>
          NapStation Admin
        </span>
        <button onClick={logout} style={{
          background: "none",
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "5px 14px",
          cursor: "pointer",
          fontSize: "0.875rem",
          color: "#666",
        }}>
          Sign out
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key ? "var(--teal)" : "#fff",
                color: tab === t.key ? "#fff" : "var(--ink)",
                border: "1.5px solid",
                borderColor: tab === t.key ? "var(--teal)" : "#ddd",
                borderRadius: 8,
                padding: "7px 18px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              {t.label}
              <span style={{
                marginLeft: 8,
                background: tab === t.key ? "rgba(255,255,255,0.25)" : "#f0ebe3",
                borderRadius: 10,
                padding: "1px 7px",
                fontSize: "0.75rem",
              }}>
                {(data[t.key] as unknown[]).length}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e8e0d4",
          overflow: "hidden",
        }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#888" }}>Loading…</div>
          ) : error ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#c62828", fontFamily: "monospace", fontSize: "0.85rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              Error: {error}
            </div>
          ) : (
            <>
              {tab === "reports" && <ReportsTable rows={data.reports as ReportRow[]} onStatus={updateReport} onDelete={id => del("reports", id)} />}
              {tab === "places" && <PlacesTable rows={data.places as PlaceRow[]} onToggle={toggleApproved} onDelete={id => del("places", id)} />}
              {tab === "users" && <UsersTable rows={data.users as UserRow[]} onDelete={id => del("users", id)} />}
              {tab === "hearts" && <HeartsTable rows={data.hearts as HeartRow[]} onDelete={id => del("hearts", id)} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Table types ──────────────────────────────────────────

type ReportRow = {
  id: string; message: string; status: string;
  contactEmail?: string; createdAt: string;
  place?: { name: string } | null;
  photoUrls: string[];
};

type PlaceRow = {
  id: string; name: string; building: string; floor: string;
  approved: boolean; isPublic: boolean; createdAt: string;
  _count: { hearts: number; comments: number };
};

type UserRow = {
  id: string; email: string; name?: string | null; createdAt: string;
  _count: { sessions: number; placeHearts: number };
};

type HeartRow = {
  id: string; createdAt: string;
  user: { email: string }; place: { name: string };
};

// ── Table components ──────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: "0.78rem",
  fontWeight: 700,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "1px solid #f0ebe3",
  background: "#faf8f5",
};

const tdStyle: React.CSSProperties = {
  padding: "11px 14px",
  fontSize: "0.875rem",
  borderBottom: "1px solid #f5f0e8",
  verticalAlign: "middle",
};

function ReportsTable({ rows, onStatus, onDelete }: {
  rows: ReportRow[];
  onStatus: (id: string, s: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!rows.length) return <Empty />;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {["Place", "Message", "Contact", "Photos", "Status", "Date", "Actions"].map(h => (
            <th key={h} style={thStyle}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id}>
            <td style={tdStyle}>{r.place?.name ?? <span style={{ color: "#aaa" }}>—</span>}</td>
            <td style={{ ...tdStyle, maxWidth: 240 }}>
              <span title={r.message} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.message}
              </span>
            </td>
            <td style={tdStyle}>{r.contactEmail ?? <span style={{ color: "#aaa" }}>—</span>}</td>
            <td style={tdStyle}>{r.photoUrls.length > 0 ? `${r.photoUrls.length} photo(s)` : "—"}</td>
            <td style={tdStyle}><Badge status={r.status} /></td>
            <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "#888" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
            <td style={tdStyle}>
              {r.status !== "open" && <Btn onClick={() => onStatus(r.id, "open")} color="#2e7d32">Open</Btn>}
              {r.status !== "triaged" && <Btn onClick={() => onStatus(r.id, "triaged")} color="#f57f17">Triage</Btn>}
              {r.status !== "closed" && <Btn onClick={() => onStatus(r.id, "closed")} color="#888">Close</Btn>}
              <Btn onClick={() => onDelete(r.id)} color="var(--rust)">Delete</Btn>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PlacesTable({ rows, onToggle, onDelete }: {
  rows: PlaceRow[];
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  if (!rows.length) return <Empty />;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {["Name", "Building", "Floor", "Approved", "Hearts", "Comments", "Date", "Actions"].map(h => (
            <th key={h} style={thStyle}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(p => (
          <tr key={p.id}>
            <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
            <td style={tdStyle}>{p.building}</td>
            <td style={tdStyle}>{p.floor}</td>
            <td style={tdStyle}><Badge status={p.approved ? "open" : "closed"} /></td>
            <td style={tdStyle}>{p._count.hearts}</td>
            <td style={tdStyle}>{p._count.comments}</td>
            <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "#888" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
            <td style={tdStyle}>
              <Btn onClick={() => onToggle(p.id, p.approved)} color={p.approved ? "#888" : "var(--teal)"}>
                {p.approved ? "Reject" : "Approve"}
              </Btn>
              <Btn onClick={() => onDelete(p.id)} color="var(--rust)">Delete</Btn>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UsersTable({ rows, onDelete }: { rows: UserRow[]; onDelete: (id: string) => void }) {
  if (!rows.length) return <Empty />;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {["Email", "Name", "Hearts", "Sessions", "Joined", "Actions"].map(h => (
            <th key={h} style={thStyle}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(u => (
          <tr key={u.id}>
            <td style={tdStyle}>{u.email}</td>
            <td style={tdStyle}>{u.name ?? <span style={{ color: "#aaa" }}>—</span>}</td>
            <td style={tdStyle}>{u._count.placeHearts}</td>
            <td style={tdStyle}>{u._count.sessions}</td>
            <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "#888" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
            <td style={tdStyle}>
              <Btn onClick={() => onDelete(u.id)} color="var(--rust)">Delete</Btn>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HeartsTable({ rows, onDelete }: { rows: HeartRow[]; onDelete: (id: string) => void }) {
  if (!rows.length) return <Empty />;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {["User", "Place", "Date", "Actions"].map(h => (
            <th key={h} style={thStyle}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(h => (
          <tr key={h.id}>
            <td style={tdStyle}>{h.user.email}</td>
            <td style={tdStyle}>{h.place.name}</td>
            <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "#888" }}>{new Date(h.createdAt).toLocaleDateString()}</td>
            <td style={tdStyle}>
              <Btn onClick={() => onDelete(h.id)} color="var(--rust)">Delete</Btn>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Empty() {
  return <div style={{ padding: "3rem", textAlign: "center", color: "#aaa" }}>No records found.</div>;
}
