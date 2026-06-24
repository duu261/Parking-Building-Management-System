import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "./AuthShell";
import { Field, Input, Button, Alert } from "../../components/ui";
import { authApi } from "../../lib/endpoints";

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
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-3">
          {resetUrl ? (
            <>
              <div className="rounded-[var(--radius)] border border-green-500/30 bg-green-500/5 p-4 text-sm text-text">
                <div className="mb-2 font-medium">Password reset link:</div>
                <div className="flex items-center gap-2 rounded bg-bg p-2 font-mono text-xs break-all border border-line">
                  <code className="flex-1 select-all">{resetUrl}</code>
                  <button type="button" onClick={() => navigator.clipboard.writeText(resetUrl)}
                    className="shrink-0 text-accent hover:underline">Copy</button>
                </div>
              </div>
              <Link to={`/reset-password?token=${resetUrl.split("token=")[1]}`}
                className="inline-block text-sm font-medium text-accent hover:underline">
                Reset your password &rarr;
              </Link>
            </>
          ) : (
            <div className="rounded-[var(--radius)] border border-accent/30 bg-accent/5 p-4 text-sm text-text">
              If an account exists with <strong>{email}</strong>, check your inbox.
            </div>
          )}
          <Link to="/login" className="inline-block text-sm font-medium text-accent hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </Field>
          <Alert>{error}</Alert>
          <Button type="submit" loading={loading} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
