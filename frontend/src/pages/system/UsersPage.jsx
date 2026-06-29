import { useEffect, useState } from "react";
import { Users, Plus } from "lucide-react";
import { Card, Button, Field, Input, Select, Skeleton, EmptyState, Alert } from "../../components/ui";
import { adminApi } from "../../lib/endpoints";

const ROLES = ["ADMIN", "MANAGER", "STAFF", "USER"];
const EMPTY = { email: "", password: "", fullName: "", role: "STAFF" };

export default function UsersPage() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const load = () => {
    setError("");
    adminApi.users().then(setUsers).catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await adminApi.createUser(form);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const act = async (id, fn) => {
    setBusyId(id);
    setError("");
    try {
      await fn();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight">Users</h1>
      <p className="mt-1 text-sm text-muted">Create accounts, assign roles, deactivate access.</p>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <Card className="mt-6 p-5">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <Field label="Email">
            <Input type="email" required value={form.email} onChange={set("email")} placeholder="user@parkmaster.app" />
          </Field>
          <Field label="Password">
            <Input type="password" required minLength={8} value={form.password} onChange={set("password")} placeholder="Min 8 chars" />
          </Field>
          <Field label="Full name">
            <Input required maxLength={120} value={form.fullName} onChange={set("fullName")} />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={set("role")}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" loading={creating}>
            <Plus size={16} /> Add user
          </Button>
        </form>
      </Card>

      {users === null ? (
        <div className="mt-6">
          <Skeleton rows={4} />
        </div>
      ) : users.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Users} title="No users" hint="Create the first account above." />
        </div>
      ) : (<>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ROLES.map((r) => (
            <Card key={r} className="p-4">
              <div className="text-xs text-muted">{r}</div>
              <div className="mt-1 nums text-2xl font-semibold">{users.filter((u) => u.role === r).length}</div>
            </Card>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["ALL", ...ROLES].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                roleFilter === r ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-text"
              }`}
            >
              {r === "ALL" ? `All (${users.length})` : `${r} (${users.filter((u) => u.role === r).length})`}
            </button>
          ))}
        </div>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="mt-3"
        />
        <Card className="mt-3 divide-y divide-line">
          {users.filter((u) => {
            if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
            if (!search.trim()) return true;
            const q = search.toLowerCase().trim();
            return [u.fullName, u.email, u.role].some((v) => (v ?? "").toLowerCase().includes(q));
          }).map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-medium">{u.fullName}</span>
                  {!u.active && (
                    <span className="rounded-full border border-line px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted">{u.email}</div>
              </div>
              <div className="w-28 sm:w-36">
                <Select
                  value={u.role}
                  disabled={busyId === u.id}
                  onChange={(e) => act(u.id, () => adminApi.setRole(u.id, e.target.value))}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant="secondary"
                loading={busyId === u.id}
                onClick={() => act(u.id, () => adminApi.setActive(u.id, !u.active))}
              >
                {u.active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          ))}
        </Card>
      </>)}
    </div>
  );
}
