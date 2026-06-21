import { useEffect, useState } from "react";
import { UserCircle, Lock, Check } from "lucide-react";
import { Card, Button, Field, Input, Spinner, Alert } from "../../components/ui";
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
      <h1 className="text-xl font-semibold tracking-tight">Account</h1>
      <p className="mt-1 text-sm text-muted">Manage your profile and security.</p>

      <div className="mt-6 space-y-6">
        <ProfileSection profile={profile} onUpdate={setProfile} />
        <ChangePasswordSection />
        <AccountInfo profile={profile} />
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
      // sync localStorage so sidebar badge updates
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
    <Card className="p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <UserCircle size={16} className="text-muted" /> Profile
      </h2>
      <form onSubmit={save} className="space-y-4">
        <Field label="Email">
          <Input value={profile.email} disabled />
        </Field>
        <Field label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
        </Field>
        {err && <p className="text-sm text-occupied">{err}</p>}
        {msg && (
          <p className="flex items-center gap-1 text-sm text-available">
            <Check size={14} /> {msg}
          </p>
        )}
        <Button type="submit" loading={saving} disabled={!dirty}>Save changes</Button>
      </form>
    </Card>
  );
}

function ChangePasswordSection() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSubmit = form.current && form.next.length >= 8 && form.next === form.confirm;

  const save = async (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) { setErr("Passwords don't match"); return; }
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
    <Card className="p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Lock size={16} className="text-muted" /> Change password
      </h2>
      <form onSubmit={save} className="space-y-4">
        <Field label="Current password">
          <Input type="password" value={form.current} onChange={set("current")} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password">
            <Input type="password" value={form.next} onChange={set("next")} minLength={8} maxLength={100} required />
          </Field>
          <Field label="Confirm new password">
            <Input type="password" value={form.confirm} onChange={set("confirm")} required />
          </Field>
        </div>
        {err && <p className="text-sm text-occupied">{err}</p>}
        {msg && (
          <p className="flex items-center gap-1 text-sm text-available">
            <Check size={14} /> {msg}
          </p>
        )}
        <Button type="submit" loading={saving} disabled={!canSubmit}>Change password</Button>
      </form>
    </Card>
  );
}

function AccountInfo({ profile }) {
  return (
    <Card className="p-5">
      <h2 className="mb-3 text-sm font-semibold text-muted">Account details</h2>
      <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <span className="text-xs text-muted">Role</span>
          <div className="mt-0.5 font-medium">{profile.role}</div>
        </div>
        <div>
          <span className="text-xs text-muted">Member since</span>
          <div className="mt-0.5 font-medium nums">
            {new Date(profile.createdAt).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>
    </Card>
  );
}
