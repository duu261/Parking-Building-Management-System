import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";
import AuthShell from "./AuthShell";
import { Field, Input, Button, Alert, validateEmail } from "../../components/ui";
import { authApi } from "../../lib/endpoints";
import { setSession, isAuthed, getUser, homePathForRole } from "../../lib/session";

const INPUT_CLASS = "bg-white/[0.06] border-white/10 text-white placeholder:text-white/35 h-11 py-2.5 rounded-xl hover:border-white/20 focus:border-white/35 focus:ring-2 focus:ring-white/15";
const BTN_CLASS = "w-full bg-white text-black h-12 rounded-xl font-semibold duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(255,255,255,0.14)] hover:bg-white/90 active:translate-y-0 disabled:opacity-60";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  if (isAuthed()) return <Navigate to={homePathForRole(getUser()?.role)} replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!validateEmail(form.email)) errs.email = "Invalid email format";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!confirmPw) errs.confirmPw = "Please confirm your password";
    else if (form.password !== confirmPw) errs.confirmPw = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const clearError = (field) => {
    if (fieldErrors[field]) setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
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

  const Icon = ({ component: Comp, className: cn = "" }) => (
    <Comp size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/45 ${cn}`} />
  );

  const EyeToggle = (
    <button
      type="button"
      onClick={() => setShowPw(!showPw)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white transition-colors cursor-pointer"
      aria-label={showPw ? "Hide password" : "Show password"}
    >
      {showPw ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      )}
    </button>
  );

  return (
    <AuthShell
      title="Create an account"
      subtitle="Create your driver account to reserve and track parking."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-white/60 hover:text-white transition-colors duration-200 no-underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label="Full name" error={fieldErrors.fullName}>
          <div className="relative">
            <Icon component={User} />
            <Input
              value={form.fullName}
              onChange={(e) => { set("fullName")(e); clearError("fullName"); }}
              maxLength={120}
              placeholder="Duc Driver"
              hasError={!!fieldErrors.fullName}
              className={`${INPUT_CLASS} pl-10 pr-4`}
            />
          </div>
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <div className="relative">
            <Icon component={Mail} />
            <Input
              type="email"
              value={form.email}
              onChange={(e) => { set("email")(e); clearError("email"); }}
              autoComplete="email"
              placeholder="driver@parkmaster.dev"
              hasError={!!fieldErrors.email}
              className={`${INPUT_CLASS} pl-10 pr-4`}
            />
          </div>
        </Field>
        <Field label="Password" error={fieldErrors.password}>
          <div className="relative">
            <Icon component={Lock} />
            <Input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => { set("password")(e); clearError("password"); }}
              autoComplete="new-password"
              placeholder="Create a password"
              hasError={!!fieldErrors.password}
              className={`${INPUT_CLASS} pl-10 pr-10`}
            />
            {EyeToggle}
          </div>
        </Field>
        <Field label="Confirm password" error={fieldErrors.confirmPw}>
          <div className="relative">
            <Icon component={Lock} />
            <Input
              type={showPw ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); clearError("confirmPw"); }}
              autoComplete="new-password"
              placeholder="Confirm your password"
              hasError={!!fieldErrors.confirmPw}
              className={`${INPUT_CLASS} pl-10 pr-10`}
            />
            {EyeToggle}
          </div>
        </Field>
        <Alert>{error}</Alert>
        <Button type="submit" loading={loading} className={BTN_CLASS}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
