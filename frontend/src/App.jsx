import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import AiAssistant from "./components/AiAssistant";
import LandingPage from "./pages/public/LandingPage";
import PublicPricingPage from "./pages/public/PricingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import CheckInPage from "./pages/staff/CheckInPage";
import ActiveSessionsPage from "./pages/staff/ActiveSessionsPage";
import ExceptionsPage from "./pages/staff/ExceptionsPage";
import PaymentsPage from "./pages/staff/PaymentsPage";
import OverviewPage from "./pages/system/OverviewPage";
import AdminOverviewPage from "./pages/system/AdminOverviewPage";
import AnalyticsPage from "./pages/system/AnalyticsPage";
import BuildingsPage from "./pages/system/BuildingsPage";
import PricingPage from "./pages/system/PricingPage";
import UsersPage from "./pages/system/UsersPage";
import MonthlyPassesPage from "./pages/system/MonthlyPassesPage";
import FeedbackPage from "./pages/system/FeedbackPage";
import ManagerExceptionsPage from "./pages/system/ExceptionsPage";
import MyParkingPage from "./pages/user/MyParkingPage";
import MySessionsPage from "./pages/user/MySessionsPage";
import ReservationsPage from "./pages/user/ReservationsPage";
import PassesPage from "./pages/user/PassesPage";
import AccountPage from "./pages/user/AccountPage";
import { getUser, isAuthed } from "./lib/session";

function AppHome() {
  const role = getUser()?.role;
  if (role === "STAFF") return <CheckInPage />;
  if (role === "USER") return <MyParkingPage />;
  if (role === "ADMIN") return <AdminOverviewPage />;
  return <OverviewPage />;
}

function Home() {
  return isAuthed() ? <Navigate to="/app" replace /> : <LandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<PublicPricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute allow={["ADMIN", "MANAGER", "STAFF", "USER"]} />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<AppHome />} />
            {/* Staff */}
            <Route path="check-in" element={<CheckInPage />} />
            <Route path="active" element={<ActiveSessionsPage />} />
            <Route path="staff-exceptions" element={<ExceptionsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            {/* Manager / Admin */}
            <Route path="buildings" element={<BuildingsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="passes" element={<MonthlyPassesPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="exceptions" element={<ManagerExceptionsPage />} />
            {/* Driver */}
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="sessions" element={<MySessionsPage />} />
            <Route path="my-passes" element={<PassesPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>
        </Route>

        <Route path="/me" element={<Navigate to="/app" replace />} />
        <Route path="/me/*" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AiAssistant />
    </BrowserRouter>
  );
}
