import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingScreenSkeleton } from "./components/ui/loading-screen";
import { AuthProvider } from "./contexts/AuthContext";
import { NavigationBlockerProvider } from "./contexts/NavigationBlockerContext";
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
const Home = lazy(() => import("./pages/Home"));
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
const Companies = lazy(() => import("./pages/Companies"));
const CompanyDetails = lazy(() => import("./pages/CompanyDetails"));
const Tasks = lazy(() => import("./pages/Tasks"));
const TaskDetails = lazy(() => import("./pages/TaskDetails"));
const AVProjects = lazy(() => import("./pages/AVProjects"));
const AVProjectDetails = lazy(() => import("./pages/AVProjectDetails"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider delayDuration={300} skipDelayDuration={100}>
        <Sonner position="top-center" />
        <BrowserRouter>
          <NavigationBlockerProvider>
            <Routes>
              <Route path="/entrar" element={
                <Suspense fallback={<LoadingScreenSkeleton />}>
                  <Auth />
                </Suspense>
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                  <Route index element={<Suspense fallback={<LoadingScreenSkeleton />}><Home /></Suspense>} />
                  <Route path="dashboard" element={<Suspense fallback={<LoadingScreenSkeleton />}><Dashboard /></Suspense>} />
                  <Route path="inventario" element={<Suspense fallback={<LoadingScreenSkeleton />}><Equipment /></Suspense>} />
                  <Route path="inventario/novo" element={<Suspense fallback={<LoadingScreenSkeleton />}><AddEquipment /></Suspense>} />
                  <Route path="inventario/editar/:id" element={<Suspense fallback={<LoadingScreenSkeleton />}><AddEquipment /></Suspense>} />
                  <Route path="ssds" element={<Suspense fallback={<LoadingScreenSkeleton />}><SSDs /></Suspense>} />
                  <Route path="retiradas" element={<Suspense fallback={<LoadingScreenSkeleton />}><Projects /></Suspense>} />
                  <Route path="retiradas/nova" element={<Suspense fallback={<LoadingScreenSkeleton />}><ProjectWithdrawal /></Suspense>} />
                  <Route path="retiradas/:id" element={<Suspense fallback={<LoadingScreenSkeleton />}><ProjectDetails /></Suspense>} />
                  <Route path="retiradas/:id/separacao" element={<Suspense fallback={<LoadingScreenSkeleton />}><ProjectSeparation /></Suspense>} />
                  <Route path="retiradas/:id/verificacao" element={<Suspense fallback={<LoadingScreenSkeleton />}><ProjectVerification /></Suspense>} />
                  <Route path="retiradas/:id/retirada" element={<Suspense fallback={<LoadingScreenSkeleton />}><ProjectWithdrawal /></Suspense>} />
                  <Route path="plataformas" element={<Suspense fallback={<LoadingScreenSkeleton />}><PlatformAccesses /></Suspense>} />
                  <Route path="politicas" element={<Suspense fallback={<LoadingScreenSkeleton />}><Policies /></Suspense>} />
                  <Route path="politicas/:id" element={<Suspense fallback={<LoadingScreenSkeleton />}><PolicyView /></Suspense>} />
                  <Route path="tarefas" element={<Navigate to="/tarefas/gerais" replace />} />
                  <Route path="tarefas/gerais" element={<Suspense fallback={<LoadingScreenSkeleton />}><Tasks /></Suspense>} />
                  <Route path="tarefas/privadas" element={<Suspense fallback={<LoadingScreenSkeleton />}><Tasks /></Suspense>} />
                  <Route path="tarefas/:id" element={<Suspense fallback={<LoadingScreenSkeleton />}><TaskDetails /></Suspense>} />
                  <Route path="fornecedores" element={<Navigate to="/fornecedores/freelancers" replace />} />
                  <Route path="fornecedores/freelancers" element={<Suspense fallback={<LoadingScreenSkeleton />}><Suppliers /></Suspense>} />
                  <Route path="fornecedores/freelancers/:id" element={<Suspense fallback={<LoadingScreenSkeleton />}><SupplierDetails /></Suspense>} />
                  <Route path="fornecedores/empresas" element={<Suspense fallback={<LoadingScreenSkeleton />}><Companies /></Suspense>} />
                  <Route path="fornecedores/empresas/:id" element={<Suspense fallback={<LoadingScreenSkeleton />}><CompanyDetails /></Suspense>} />
                  <Route path="projetos-av" element={<Suspense fallback={<LoadingScreenSkeleton />}><AVProjects /></Suspense>} />
                  <Route path="projetos-av/:id" element={<Suspense fallback={<LoadingScreenSkeleton />}><AVProjectDetails /></Suspense>} />
                  <Route path="perfil" element={<Suspense fallback={<LoadingScreenSkeleton />}><Profile /></Suspense>} />
                  <Route path="administracao" element={<Suspense fallback={<LoadingScreenSkeleton />}><Admin /></Suspense>} />
                </Route>
                <Route path="*" element={
                  <Suspense fallback={<LoadingScreenSkeleton />}>
                    <NotFound />
                  </Suspense>
                } />
              </Routes>
          </NavigationBlockerProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
