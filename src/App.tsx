import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminOnly } from "./components/RoleGuard";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import AddEquipment from "./pages/AddEquipment";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectSeparation from "./pages/ProjectSeparation";
import ProjectVerification from "./pages/ProjectVerification";
import ProjectWithdrawal from "./pages/ProjectWithdrawal";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import SecurityAdmin from "./pages/SecurityAdmin";
import SSDs from "./pages/SSDs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="equipment/new" element={<AddEquipment />} />
            <Route path="equipment/edit/:id" element={<AddEquipment />} />
            <Route path="ssds" element={<SSDs />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/new" element={<ProjectWithdrawal />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="projects/:id/separation" element={<ProjectSeparation />} />
            <Route path="projects/:id/verification" element={<ProjectVerification />} />
            <Route path="projects/:id/withdrawal" element={<ProjectWithdrawal />} />
            <Route path="reports" element={
              <AdminOnly fallback={<Navigate to="/" replace />}>
                <Reports />
              </AdminOnly>
            } />
            <Route path="profile" element={<Profile />} />
            
            <Route path="admin" element={
              <AdminOnly fallback={<Navigate to="/" replace />}>
                <Admin />
              </AdminOnly>
            } />
            <Route path="security" element={
              <AdminOnly fallback={<Navigate to="/" replace />}>
                <SecurityAdmin />
              </AdminOnly>
            } />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
