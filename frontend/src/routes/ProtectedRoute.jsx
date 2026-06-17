import { Navigate, Outlet } from "react-router-dom";
import { isAuthed, getUser, homePathForRole } from "../lib/session";

// Gate a route subtree. `allow` is a list of roles permitted here.
export default function ProtectedRoute({ allow }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;

  const user = getUser();
  if (allow && !allow.includes(user?.role)) {
    return <Navigate to={homePathForRole(user?.role)} replace />;
  }
  return <Outlet />;
}
