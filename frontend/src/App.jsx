import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import DriverLayout from "./components/DriverLayout";
import Placeholder from "./components/Placeholder";
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
import CheckInPage from "./pages/staff/CheckInPage";
import ActiveSessionsPage from "./pages/staff/ActiveSessionsPage";
import OverviewPage from "./pages/system/OverviewPage";
import AnalyticsPage from "./pages/system/AnalyticsPage";
import BuildingsPage from "./pages/system/BuildingsPage";
import PricingPage from "./pages/system/PricingPage";
import UsersPage from "./pages/system/UsersPage";
import MyParkingPage from "./pages/user/MyParkingPage";
import MySessionsPage from "./pages/user/MySessionsPage";
import { getUser } from "./lib/session";

// /app index: staff land on check-in; managers/admins on the overview.
function AppHome() {
  const role = getUser()?.role;
  if (role === "STAFF") return <CheckInPage />;
  return <OverviewPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route element={<ProtectedRoute allow={["ADMIN", "MANAGER", "STAFF"]} />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<AppHome />} />
            <Route path="check-in" element={<CheckInPage />} />
            <Route path="active" element={<ActiveSessionsPage />} />
            <Route path="buildings" element={<BuildingsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allow={["USER"]} />}>
          <Route path="/me" element={<DriverLayout />}>
            <Route index element={<MyParkingPage />} />
            <Route path="sessions" element={<MySessionsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
