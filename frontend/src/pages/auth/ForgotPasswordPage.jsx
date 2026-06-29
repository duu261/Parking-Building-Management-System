import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import AuthShell from "./AuthShell";
import { Field, Input, Button, Alert } from "../../components/ui";
import { authApi } from "../../lib/endpoints";

const INPUT_CLASS = "bg-white/[0.06] border-white/10 text-white placeholder:text-white/35 h-11 py-2.5 rounded-xl hover:border-white/20 focus:border-white/35 focus:ring-2 focus:ring-white/15";
const BTN_CLASS = "w-full bg-white text-black h-12 rounded-xl font-semibold duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(255,255,255,0.14)] hover:bg-white/90 active:translate-y-0 disabled:opacity-60";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      if (res.resetUrl) setResetUrl(res.resetUrl);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your email and we'll send a reset link."
      footer={
        <>
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-white/60 hover:text-white transition-colors duration-200 no-underline">
            Sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-4">
          {resetUrl ? (
            <>
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-sm">
                <div className="mb-2 font-medium" style={{ color: "hsl(var(--foreground))" }}>Password reset link:</div>
                <div className="flex items-center gap-2 rounded-lg p-2.5 font-mono text-xs break-all border"
                  style={{
                    color: "hsl(var(--muted-foreground))",
                    borderColor: "var(--card-border)",
                    backgroundColor: "var(--card-bg)",
                  }}>
                  <code className="flex-1 select-all">{resetUrl}</code>
                  <button type="button" onClick={() => navigator.clipboard.writeText(resetUrl)}
                    className="shrink-0 text-white/55 hover:text-white transition-colors duration-200 cursor-pointer">Copy</button>
                </div>
              </div>
              <Link to={`/reset-password?token=${resetUrl.split("token=")[1]}`}
                className="inline-block text-sm font-medium text-white/60 hover:text-white no-underline transition-colors duration-200">
                Reset your password &rarr;
              </Link>
            </>
          ) : (
            <div className="rounded-xl border p-4 text-sm"
              style={{
                color: "hsl(var(--foreground))",
                borderColor: "var(--card-border)",
                backgroundColor: "var(--card-bg)",
              }}>
              If an account exists with <strong>{email}</strong>, check your inbox.
            </div>
          )}
          <Link to="/login" className="inline-block text-sm font-medium text-white/60 hover:text-white no-underline transition-colors duration-200">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Field label="Email">
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/45"
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="driver@parkmaster.dev"
                required
                className={`${INPUT_CLASS} pl-10 pr-4`}
              />
            </div>
          </Field>
          <Alert>{error}</Alert>
          <Button type="submit" loading={loading} className={BTN_CLASS}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
