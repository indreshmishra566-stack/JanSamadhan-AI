import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Navbar from "./components/Shared/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CitizenDashboard from "./pages/Citizen/CitizenDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import OfficerDashboard from "./pages/Officer/OfficerDashboard";
import HierarchyDashboard from "./pages/Hierarchy/HierarchyDashboard";
import TrackComplaint from "./pages/TrackComplaint";
import { LoadingSpinner } from "./components/Shared";

// Roles that use HierarchyDashboard
const HIERARCHY_ROLES = ["PM", "CM", "DISTRICT_OFFICER", "BLOCK_OFFICER", "FIELD_OFFICER"];

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard instead of /login
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }
  return children;
}

function getDashboardPath(role) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "OFFICER") return "/officer/dashboard";
  if (HIERARCHY_ROLES.includes(role)) return "/hierarchy/dashboard";
  return "/citizen/dashboard";
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardPath(user.role)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/track" element={<TrackComplaint />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Citizen */}
          <Route path="/citizen/dashboard" element={
            <ProtectedRoute allowedRoles={["CITIZEN"]}>
              <Layout><CitizenDashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Legacy Officer */}
          <Route path="/officer/dashboard" element={
            <ProtectedRoute allowedRoles={["OFFICER"]}>
              <Layout><OfficerDashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Hierarchy Officers (PM, CM, District, Block, Field) */}
          <Route path="/hierarchy/dashboard" element={
            <ProtectedRoute allowedRoles={HIERARCHY_ROLES}>
              <Layout><HierarchyDashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
