import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Navbar from "./components/Shared/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CitizenDashboard from "./pages/Citizen/CitizenDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import OfficerDashboard from "./pages/Hierarchy/HierarchyDashboard";
import TrackComplaint from "./pages/TrackComplaint";
import PublicPortal, {
  AboutUsPage,
  ContactUsPage,
  FAQPage,
  ProcessFlowPage,
  SitemapPage,
} from "./pages/PublicPortal";
import { LoadingSpinner } from "./components/Shared";

const HANDLER_ROLES = ["OFFICER"];

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
  if (HANDLER_ROLES.includes(role)) return "/officer/dashboard";
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
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/contact-us" element={<ContactUsPage />} />
          <Route path="/faq-help" element={<FAQPage />} />
          <Route path="/process-flow" element={<ProcessFlowPage />} />
          <Route path="/site-map" element={<SitemapPage />} />
          <Route path="/sitemap" element={<Navigate to="/site-map" replace />} />
          <Route path="/" element={<PublicPortal />} />
          <Route path="/dashboard" element={<RootRedirect />} />

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

          {/* Officer branch dashboard */}
          <Route path="/officer/dashboard" element={
            <ProtectedRoute allowedRoles={HANDLER_ROLES}>
              <Layout><OfficerDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/hierarchy/dashboard" element={<Navigate to="/officer/dashboard" replace />} />
          <Route path="/nodal/dashboard" element={<Navigate to="/officer/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
