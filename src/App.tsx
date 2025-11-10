import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingScreenSkeleton } from "./components/ui/loading-screen";

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
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              <Route path="projetos" element={<Projects />} />
              <Route path="projetos/novo" element={<ProjectWithdrawal />} />
              <Route path="projetos/:id" element={<ProjectDetails />} />
              <Route path="projetos/:id/separacao" element={<ProjectSeparation />} />
              <Route path="projetos/:id/verificacao" element={<ProjectVerification />} />
              <Route path="projetos/:id/retirada" element={<ProjectWithdrawal />} />
              <Route path="plataformas" element={<PlatformAccesses />} />
              <Route path="perfil" element={<Profile />} />
              
              <Route path="administracao" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
