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
const SecurityAdmin = lazy(() => import("./pages/SecurityAdmin"));
const SSDs = lazy(() => import("./pages/SSDs"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-center" />
      <BrowserRouter>
        <Suspense fallback={<LoadingScreenSkeleton />}>
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
              <Route path="profile" element={<Profile />} />
              
              <Route path="admin" element={<Admin />} />
              <Route path="security" element={<SecurityAdmin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
