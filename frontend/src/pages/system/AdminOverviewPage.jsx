import { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  Briefcase,
  IdCard,
  Car,
  Building2,
  UserCheck,
  UserX,
} from "lucide-react";
import { Card, Spinner, Alert } from "../../components/ui";
import { adminApi, managerApi } from "../../lib/endpoints";

const ROLE_META = {
  ADMIN: { label: "Admins", icon: ShieldCheck },
  MANAGER: { label: "Managers", icon: Briefcase },
  STAFF: { label: "Staff", icon: IdCard },
  USER: { label: "Drivers", icon: Car },
};

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([adminApi.users(), managerApi.buildings().catch(() => [])])
      .then(([users, buildings]) => setData({ users, buildings }))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner label="Loading admin overview" />;

  const { users, buildings } = data;
  const active = users.filter((u) => u.active).length;
  const inactive = users.length - active;
  const byRole = users.reduce((acc, u) => ({ ...acc, [u.role]: (acc[u.role] || 0) + 1 }), {});

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold tracking-tight">System administration</h1>
      <p className="mt-1 text-sm text-muted">Accounts, roles, and system at a glance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Total accounts" value={users.length} />
        <Stat icon={UserCheck} label="Active" value={active} accent />
        <Stat icon={UserX} label="Inactive" value={inactive} />
        <Stat icon={Building2} label="Buildings" value={buildings.length} />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold tracking-tight">Accounts by role</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(ROLE_META).map(([role, meta]) => (
          <Stat key={role} icon={meta.icon} label={meta.label} value={byRole[role] ?? 0} />
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold tracking-tight">Recent accounts</h2>
      <Card className="divide-y divide-line">
        {[...users]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6)
          .map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="font-medium">{u.fullName}</span>
              <span className="text-xs text-muted">{u.email}</span>
              <span className="ml-auto rounded-md bg-elevated px-2 py-0.5 text-[11px] font-medium text-muted">
                {ROLE_META[u.role]?.label ?? u.role}
              </span>
              {!u.active && (
                <span className="rounded-md bg-occupied/10 px-2 py-0.5 text-[11px] font-medium text-occupied">
                  inactive
                </span>
              )}
              <span className="nums text-xs text-muted">
                {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </span>
            </div>
          ))}
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted">
        {Icon && <Icon size={15} />} {label}
      </div>
      <div className={`mt-2 nums text-2xl font-semibold tracking-tight ${accent ? "text-available" : ""}`}>
        {value}
      </div>
    </Card>
  );
}
