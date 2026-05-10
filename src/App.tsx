import { Suspense, lazy, ReactNode } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LayoutDS } from "./ds/LayoutDS";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingScreenSkeleton } from "./components/ui/loading-screen";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { NavigationBlockerProvider } from "./contexts/NavigationBlockerContext";

function MarketingGuard({ children }: { children: ReactNode }) {
  const { canAccessMarketing, roleLoading } = useAuthContext();
  if (roleLoading) return null;
  if (!canAccessMarketing) return <Navigate to="/" replace />;
  return <>{children}</>;
}
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
const Proposals = lazy(() => import("./pages/Proposals"));
const ProposalPublic = lazy(() => import("./pages/ProposalPublic"));
const ProposalDetails = lazy(() => import("./pages/ProposalDetails"));
const ProposalOverview = lazy(() => import("./pages/ProposalOverview"));
const NewProposal = lazy(() => import("./pages/NewProposal"));
const PostProduction = lazy(() => import("./pages/PostProduction"));
const PPVideoDetail = lazy(() => import("./pages/PPVideoDetail"));
const PPVideoEditDetail = lazy(() => import("./pages/PPVideoEditDetail"));
const CRM = lazy(() => import("./pages/CRM"));
const CRMContactDetail = lazy(() => import("./pages/CRMContactDetail"));
const CRMDealDetail = lazy(() => import("./pages/CRMDealDetail"));
// MarketingHome desativado: rota /marketing redireciona pro Dashboard
// const MarketingHome = lazy(() => import("./pages/MarketingHome"));
const MarketingIntegrations = lazy(() => import("./pages/MarketingIntegrations"));
const MarketingReferences = lazy(() => import("./pages/MarketingReferences"));
const MarketingIdeas = lazy(() => import("./pages/MarketingIdeas"));
const MarketingStrategy = lazy(() => import("./pages/MarketingStrategy"));
const MarketingDashboard = lazy(() => import("./pages/MarketingDashboard"));
const MarketingPosts = lazy(() => import("./pages/MarketingPosts"));
const MarketingInstagram = lazy(() => import("./pages/MarketingInstagram"));
const MarketingSite = lazy(() => import("./pages/MarketingSite"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DsPreview = lazy(() => import("./ds/preview"));

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
              <Suspense fallback={null}>
                <ProposalPublic />
              </Suspense>
            } />
            <Route path="/ds-preview" element={
              <Suspense fallback={null}>
                <DsPreview />
              </Suspense>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <LayoutDS />
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
                <Route path="orcamentos/novo" element={<Suspense fallback={<LoadingScreenSkeleton />}><NewProposal /></Suspense>} />
                <Route path="orcamentos/:slug/overview" element={<ProposalOverview />} />
                <Route path="orcamentos/:slug" element={<ProposalDetails />} />
                <Route path="crm" element={<Navigate to="/crm/pipeline" replace />} />
                <Route path="crm/pipeline" element={<CRM />} />
                <Route path="crm/contatos" element={<CRM />} />
                <Route path="crm/atividades" element={<CRM />} />
                <Route path="crm/dashboard" element={<CRM />} />
                <Route path="crm/contatos/:id" element={<CRMContactDetail />} />
                <Route path="crm/deals/:id" element={<CRMDealDetail />} />
                {/* Marketing — entrada principal redireciona pro Dashboard */}
                <Route path="marketing" element={<Navigate to="/marketing/dashboard" replace />} />
                <Route path="marketing/home" element={<Navigate to="/marketing/dashboard" replace />} />

                {/* Métricas */}
                <Route path="marketing/dashboard" element={<MarketingGuard><MarketingDashboard /></MarketingGuard>} />

                {/* Social Media — Calendário multi-plataforma */}
                <Route path="marketing/social-media/calendario" element={<MarketingGuard><MarketingPosts /></MarketingGuard>} />

                {/* Social Media — Instagram (mini-dashboard + posts) */}
                <Route path="marketing/social-media/instagram" element={<MarketingGuard><MarketingInstagram /></MarketingGuard>} />
                <Route path="marketing/social-media/instagram/posts" element={<MarketingGuard><MarketingPosts /></MarketingGuard>} />

                {/* Social Media — Site (GA4 detalhado) */}
                <Route path="marketing/social-media/site" element={<MarketingGuard><MarketingSite /></MarketingGuard>} />

                {/* Estratégia */}
                <Route path="marketing/estrategia" element={<MarketingGuard><MarketingStrategy /></MarketingGuard>} />
                <Route path="marketing/ideias" element={<MarketingGuard><MarketingIdeas /></MarketingGuard>} />
                <Route path="marketing/referencias" element={<MarketingGuard><MarketingReferences /></MarketingGuard>} />

                {/* Redirects de URLs antigas (compatibilidade) */}
                <Route path="marketing/posts" element={<Navigate to="/marketing/social-media/calendario" replace />} />
                <Route path="marketing/galeria" element={<Navigate to="/marketing/social-media/calendario" replace />} />
                <Route path="marketing/ranking" element={<Navigate to="/marketing/social-media/calendario?view=ranking" replace />} />
                <Route path="marketing/persona" element={<Navigate to="/marketing/estrategia?aba=persona" replace />} />
                <Route path="marketing/pilares" element={<Navigate to="/marketing/estrategia?aba=pilares" replace />} />
                <Route path="esteira-de-pos" element={<PostProduction />} />
                <Route path="esteira-de-pos/:id" element={<PPVideoDetail />} />
                <Route path="esteira-de-pos/:id/editar" element={<PPVideoEditDetail />} />
                <Route path="perfil" element={<Profile />} />
                <Route path="administracao" element={<Navigate to="/administracao/usuarios" replace />} />
                <Route path="administracao/usuarios" element={<Admin />} />
                <Route path="administracao/logs" element={<Admin />} />
                <Route path="administracao/categorias" element={<Admin />} />
                <Route path="administracao/notificacoes" element={<Admin />} />
                <Route path="administracao/sistema" element={<Admin />} />
                <Route path="administracao/integracoes" element={<MarketingIntegrations />} />
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
