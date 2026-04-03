import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingScreenSkeleton } from "./components/ui/loading-screen";
import { AuthProvider } from "./contexts/AuthContext";
import { NavigationBlockerProvider } from "./contexts/NavigationBlockerContext";
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
const Capex = lazy(() => import("./pages/Capex"));
import Proposals from "./pages/Proposals";
import NewProposal from "./pages/NewProposal";
const ProposalPublic = lazy(() => import("./pages/ProposalPublic"));
const PostProduction = lazy(() => import("./pages/PostProduction"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
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
            <Route path="/orcamento/:slug" element={
              <Suspense fallback={<LoadingScreenSkeleton />}>
                <ProposalPublic />
              </Suspense>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Layout />
                </ErrorBoundary>
              </ProtectedRoute>
            }>
              <Route index element={<Home />} />
                <Route path="dashboard" element={<Navigate to="/financeiro/dashboard" replace />} />
                <Route path="financeiro" element={<Navigate to="/financeiro/dashboard" replace />} />
                <Route path="financeiro/dashboard" element={<Dashboard />} />
                <Route path="financeiro/capex" element={<Capex />} />
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
                <Route path="tarefas/:id" element={<TaskDetails />} />
                <Route path="fornecedores" element={<Navigate to="/fornecedores/freelancers" replace />} />
                <Route path="fornecedores/freelancers" element={<Suppliers />} />
                <Route path="fornecedores/freelancers/:id" element={<SupplierDetails />} />
                <Route path="fornecedores/empresas" element={<Companies />} />
                <Route path="fornecedores/empresas/:id" element={<CompanyDetails />} />
                <Route path="projetos-av" element={<AVProjects />} />
                <Route path="projetos-av/:id" element={<AVProjectDetails />} />
                <Route path="orcamentos" element={<Proposals />} />
                <Route path="orcamentos/novo" element={<NewProposal />} />
                <Route path="esteira-de-pos" element={<PostProduction />} />
                <Route path="perfil" element={<Profile />} />
                <Route path="administracao" element={<Navigate to="/administracao/usuarios" replace />} />
                <Route path="administracao/usuarios" element={<Admin />} />
                <Route path="administracao/logs" element={<Admin />} />
                <Route path="administracao/categorias" element={<Admin />} />
                <Route path="administracao/notificacoes" element={<Admin />} />
                <Route path="administracao/sistema" element={<Admin />} />
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
);
export default App;
