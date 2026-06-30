import { useEffect, useState } from "react";
import { User as UserIcon, Lock, Check, Shield, Clock } from "lucide-react";
import { Card, Button, Input, Spinner, Alert } from "../../components/ui";
import { driverApi } from "../../lib/endpoints";
import { getUser, setSession } from "../../lib/session";

export default function AccountPage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    driverApi.profile().then(setProfile).catch((e) => setError(e.message));
  }, []);

  if (error && !profile) return <Alert>{error}</Alert>;
  if (!profile) return <Spinner label="Loading profile" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted">Manage your profile and security.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ProfileSection profile={profile} onUpdate={setProfile} />
          <ChangePasswordSection />
        </div>
        <div className="space-y-6">
          <AccountInfo profile={profile} />
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ profile, onUpdate }) {
  const [name, setName] = useState(profile.fullName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const dirty = name.trim() !== profile.fullName;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const updated = await driverApi.updateProfile({ fullName: name.trim() });
      onUpdate(updated);
      const stored = getUser();
      if (stored) setSession({ accessToken: localStorage.getItem("accessToken"), ...stored, fullName: updated.fullName });
      setMsg("Profile updated");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-[var(--radius)] bg-elevated text-muted">
          <UserIcon size={16} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Profile</h2>
          <p className="text-xs text-muted">Your personal information</p>
        </div>
      </div>
      <form onSubmit={save} noValidate className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Email</label>
          <Input value={profile.email} disabled />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Full name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </div>
        {err && <p className="text-sm text-occupied">{err}</p>}
        {msg && (
          <p className="flex items-center gap-1.5 text-sm text-available">
            <Check size={14} /> {msg}
          </p>
        )}
        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" loading={saving} disabled={!dirty}>Save changes</Button>
          {!dirty && <span className="text-xs text-muted">No changes to save</span>}
        </div>
      </form>
    </Card>
  );
}

function PasswordField({ label, value, onChange, visible, onToggle, autoComplete, error }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">{label}</label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          maxLength={100}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted transition hover:text-text"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {visible ? (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-occupied">{error}</p>}
    </div>
  );
}

function ChangePasswordSection() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const touched = form.next.length > 0 || form.confirm.length > 0;
  const nextTooShort = form.next.length > 0 && form.next.length < 8;
  const mismatch = form.confirm.length > 0 && form.next !== form.confirm;
  const canSubmit = form.current && form.next.length >= 8 && form.next === form.confirm;

  const save = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      await driverApi.changePassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      setMsg("Password changed");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-[var(--radius)] bg-elevated text-muted">
          <Lock size={16} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Change password</h2>
          <p className="text-xs text-muted">Update your password regularly</p>
        </div>
      </div>
      <form onSubmit={save} noValidate className="space-y-5">
        <PasswordField label="Current password" value={form.current} onChange={set("current")} visible={show.current} onToggle={() => setShow((s) => ({ ...s, current: !s.current }))} autoComplete="current-password" />
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField label="New password" value={form.next} onChange={set("next")} visible={show.next} onToggle={() => setShow((s) => ({ ...s, next: !s.next }))} autoComplete="new-password" error={nextTooShort ? `At least 8 characters (${8 - form.next.length} more needed)` : undefined} />
          <PasswordField label="Confirm new password" value={form.confirm} onChange={set("confirm")} visible={show.confirm} onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} autoComplete="new-password" error={mismatch ? "Passwords don't match" : undefined} />
        </div>
        {err && <p className="text-sm text-occupied">{err}</p>}
        {msg && (
          <p className="flex items-center gap-1.5 text-sm text-available">
            <Check size={14} /> {msg}
          </p>
        )}
        {touched && !canSubmit && !nextTooShort && !mismatch && !form.current && (
          <p className="text-xs text-muted">Enter your current password to continue</p>
        )}
        <Button type="submit" loading={saving} disabled={!canSubmit}>Change password</Button>
      </form>
    </Card>
  );
}

function AccountInfo({ profile }) {
  const initials = (profile.fullName ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-[var(--radius)] bg-elevated text-muted">
          <UserIcon size={16} />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Account details</h2>
          <p className="text-xs text-muted">Your membership info</p>
        </div>
      </div>

      <div className="mb-5 flex flex-col items-center gap-3 border-b border-line pb-5">
        <span className="flex size-14 items-center justify-center rounded-full bg-text text-lg font-semibold text-accent-fg">
          {initials}
        </span>
        <div className="text-center">
          <p className="text-sm font-semibold">{profile.fullName}</p>
          <p className="text-xs text-muted">{profile.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius)] bg-elevated text-muted">
            <Shield size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted">Role</p>
            <p className="text-sm font-medium">{profile.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius)] bg-elevated text-muted">
            <Clock size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted">Member since</p>
            <p className="text-sm font-medium nums">
              {new Date(profile.createdAt).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
