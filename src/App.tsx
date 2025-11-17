import { Navigate, Route, Routes } from "react-router-dom";

import { DashboardLayout } from "./layout/DashboardLayout";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { DashboardPage } from "./pages/Dashboard";
import { PoliciesPage } from "./pages/Policies";
import { ClaimsPage } from "./pages/Claims";
import { QuotesPage } from "./pages/Quotes";
import { DocumentsPage } from "./pages/Documents";
import { AdminPage } from "./pages/Admin";
import { NotFoundPage } from "./pages/NotFound";

const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }
  if (user?.userId) {
    return <Navigate to={`/user/${user.userId}`} replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

const RequireAuth: React.FC<{ children: React.ReactElement; role?: "ADMIN" }> = ({ children, role }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    // Redirect based on user role
    if (user.role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    }
    if (user.userId) {
      return <Navigate to={`/user/${user.userId}`} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<RequireAuth><RoleBasedRedirect /></RequireAuth>} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="user/:userId" element={<DashboardPage />} />
        <Route
          path="admin"
          element={
            <RequireAuth role="ADMIN">
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="claims" element={<ClaimsPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route
          path="admin/overview"
          element={
            <RequireAuth role="ADMIN">
              <AdminPage />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
