import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { Field, Input, Button, Alert } from "../../components/ui";
import { authApi } from "../../lib/endpoints";
import { setSession, isAuthed, getUser, homePathForRole } from "../../lib/session";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthed()) return <Navigate to={homePathForRole(getUser()?.role)} replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = await authApi.register(form);
      setSession(auth);
      navigate(homePathForRole(auth.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Register as a driver to reserve and track parking."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <Input value={form.fullName} onChange={set("fullName")} maxLength={120} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={form.password}
            onChange={set("password")}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <Alert>{error}</Alert>
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
