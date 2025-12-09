import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingScreenSkeleton } from "./components/ui/loading-screen";
import { AuthProvider } from "./contexts/AuthContext";

// Create a stable query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
// Lazy load pages for better performance
const ComingSoonHome = lazy(() => import("./pages/ComingSoonHome"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Equipment = lazy(() => import("./pages/Equipment"));
const AddEquipment = lazy(() => import("./pages/AddEquipment"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const ProjectSeparation = lazy(() => import("./pages/ProjectSeparation"));
const ProjectVerification = lazy(() => import("./pages/ProjectVerification"));
const ProjectWithdrawal = lazy(() => import("./pages/ProjectWithdrawal"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const SSDs = lazy(() => import("./pages/SSDs"));
const PlatformAccesses = lazy(() => import("./pages/PlatformAccesses"));
const Policies = lazy(() => import("./pages/Policies"));
const PolicyView = lazy(() => import("./pages/PolicyView"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const SupplierDetails = lazy(() => import("./pages/SupplierDetails"));
const Tasks = lazy(() => import("./pages/Tasks"));
const TaskDetails = lazy(() => import("./pages/TaskDetails"));
const AllTasks = lazy(() => import("./pages/AllTasks"));
const MyTasks = lazy(() => import("./pages/MyTasks"));
const PrivateTasks = lazy(() => import("./pages/PrivateTasks"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner position="top-center" />
        <BrowserRouter>
          <Suspense fallback={<LoadingScreenSkeleton />}>
            <Routes>
              <Route path="/entrar" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<ComingSoonHome />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="inventario" element={<Equipment />} />
                <Route path="inventario/novo" element={<AddEquipment />} />
                <Route path="inventario/editar/:id" element={<AddEquipment />} />
                <Route path="ssds" element={<SSDs />} />
                <Route path="retiradas" element={<Projects />} />
                <Route path="retiradas/nova" element={<ProjectWithdrawal />} />
                <Route path="retiradas/:id" element={<ProjectDetails />} />
                <Route path="retiradas/:id/separacao" element={<ProjectSeparation />} />
                <Route path="retiradas/:id/verificacao" element={<ProjectVerification />} />
                <Route path="retiradas/:id/retirada" element={<ProjectWithdrawal />} />
                <Route path="plataformas" element={<PlatformAccesses />} />
                <Route path="politicas" element={<Policies />} />
                <Route path="politicas/:id" element={<PolicyView />} />
                <Route path="tarefas" element={<Tasks />} />
                <Route path="tarefas/todas" element={<AllTasks />} />
                <Route path="tarefas/minhas" element={<MyTasks />} />
                <Route path="tarefas/privadas" element={<PrivateTasks />} />
                <Route path="tarefas/:id" element={<TaskDetails />} />
                <Route path="fornecedores" element={<Suppliers />} />
                <Route path="fornecedores/:id" element={<SupplierDetails />} />
                <Route path="perfil" element={<Profile />} />
                <Route path="administracao" element={<Admin />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
