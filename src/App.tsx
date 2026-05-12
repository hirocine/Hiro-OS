import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LayoutDS } from "./ds/LayoutDS";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingScreenSkeleton } from "./components/ui/loading-screen";
import { AuthProvider } from "./contexts/AuthContext";
import { NavigationBlockerProvider } from "./contexts/NavigationBlockerContext";
// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Contracts = lazy(() => import("./pages/Contracts"));
const ContractDetail = lazy(() => import("./pages/ContractDetail"));
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
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem"));
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
const PlaygroundToolbar = lazy(() => import("./pages/_ds/PlaygroundToolbar"));
const AdminPermissions = lazy(() => import("./pages/AdminPermissions"));

import { RequirePermission } from "./components/RequirePermission";

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
              <Route index element={<RequirePermission permission="home"><Home /></RequirePermission>} />
                {/* Caixa de Entrada e Jurídico/Contratos ficam escondidos
                 *  até backend Supabase + integração ZapSign ficarem prontos.
                 *  Lazy imports preservados; basta restaurar as três rotas
                 *  abaixo (mais entradas no nav-data + AdminPermissions). */}
                <Route path="dashboard" element={<Navigate to="/financeiro/dashboard" replace />} />
                <Route path="financeiro" element={<Navigate to="/financeiro/dashboard" replace />} />
                <Route path="financeiro/dashboard" element={<RequirePermission permission="financeiro.dashboard"><Dashboard /></RequirePermission>} />
                <Route path="financeiro/capex" element={<RequirePermission permission="financeiro.capex"><Capex /></RequirePermission>} />
                <Route path="inventario" element={<RequirePermission permission="equipamentos.inventario"><Equipment /></RequirePermission>} />
                <Route path="inventario/novo" element={<RequirePermission permission="equipamentos.inventario"><AddEquipment /></RequirePermission>} />
                <Route path="inventario/editar/:id" element={<RequirePermission permission="equipamentos.inventario"><AddEquipment /></RequirePermission>} />
                <Route path="ssds" element={<RequirePermission permission="armazenamento"><SSDs /></RequirePermission>} />
                <Route path="_ds/playground/toolbar" element={<PlaygroundToolbar />} />
                <Route path="retiradas" element={<RequirePermission permission="equipamentos.retiradas"><Projects /></RequirePermission>} />
                <Route path="retiradas/nova" element={<RequirePermission permission="equipamentos.retiradas"><ProjectWithdrawal /></RequirePermission>} />
                <Route path="retiradas/:id" element={<RequirePermission permission="equipamentos.retiradas"><ProjectDetails /></RequirePermission>} />
                <Route path="retiradas/:id/separacao" element={<RequirePermission permission="equipamentos.retiradas"><ProjectSeparation /></RequirePermission>} />
                <Route path="retiradas/:id/verificacao" element={<RequirePermission permission="equipamentos.retiradas"><ProjectVerification /></RequirePermission>} />
                <Route path="retiradas/:id/retirada" element={<RequirePermission permission="equipamentos.retiradas"><ProjectWithdrawal /></RequirePermission>} />
                <Route path="plataformas" element={<RequirePermission permission="plataformas"><PlatformAccesses /></RequirePermission>} />
                <Route path="politicas" element={<RequirePermission permission="politicas"><Policies /></RequirePermission>} />
                <Route path="politicas/:id" element={<RequirePermission permission="politicas"><PolicyView /></RequirePermission>} />
                <Route path="tarefas" element={<RequirePermission permission="tarefas"><Tasks /></RequirePermission>} />
                <Route path="tarefas/:id" element={<RequirePermission permission="tarefas"><TaskDetails /></RequirePermission>} />
                <Route path="fornecedores" element={<Navigate to="/fornecedores/freelancers" replace />} />
                <Route path="fornecedores/freelancers" element={<RequirePermission permission="fornecedores.freelancers"><Suppliers /></RequirePermission>} />
                <Route path="fornecedores/freelancers/:id" element={<RequirePermission permission="fornecedores.freelancers"><SupplierDetails /></RequirePermission>} />
                <Route path="fornecedores/empresas" element={<RequirePermission permission="fornecedores.empresas"><Companies /></RequirePermission>} />
                <Route path="fornecedores/empresas/:id" element={<RequirePermission permission="fornecedores.empresas"><CompanyDetails /></RequirePermission>} />
                <Route path="projetos-av" element={<RequirePermission permission="projetos"><AVProjects /></RequirePermission>} />
                <Route path="projetos-av/:id" element={<RequirePermission permission="projetos"><AVProjectDetails /></RequirePermission>} />
                <Route path="orcamentos" element={<RequirePermission permission="orcamentos"><Proposals /></RequirePermission>} />
                <Route path="orcamentos/novo" element={<RequirePermission permission="orcamentos"><Suspense fallback={<LoadingScreenSkeleton />}><NewProposal /></Suspense></RequirePermission>} />
                <Route path="orcamentos/:slug/overview" element={<RequirePermission permission="orcamentos"><ProposalOverview /></RequirePermission>} />
                <Route path="orcamentos/:slug" element={<RequirePermission permission="orcamentos"><ProposalDetails /></RequirePermission>} />
                <Route path="crm" element={<Navigate to="/crm/pipeline" replace />} />
                <Route path="crm/pipeline" element={<RequirePermission permission="crm.pipeline"><CRM /></RequirePermission>} />
                <Route path="crm/contatos" element={<RequirePermission permission="crm.contatos"><CRM /></RequirePermission>} />
                <Route path="crm/atividades" element={<RequirePermission permission="crm.atividades"><CRM /></RequirePermission>} />
                <Route path="crm/dashboard" element={<RequirePermission permission="crm.dashboard"><CRM /></RequirePermission>} />
                <Route path="crm/contatos/:id" element={<RequirePermission permission="crm.contatos"><CRMContactDetail /></RequirePermission>} />
                <Route path="crm/deals/:id" element={<RequirePermission permission="crm.pipeline"><CRMDealDetail /></RequirePermission>} />
                {/* Marketing — entrada principal redireciona pro Dashboard */}
                <Route path="marketing" element={<Navigate to="/marketing/dashboard" replace />} />
                <Route path="marketing/home" element={<Navigate to="/marketing/dashboard" replace />} />

                {/* Métricas */}
                <Route path="marketing/dashboard" element={<RequirePermission permission="marketing.dashboard"><MarketingDashboard /></RequirePermission>} />

                {/* Social Media — Calendário multi-plataforma */}
                <Route path="marketing/social-media/calendario" element={<RequirePermission permission="marketing.calendario"><MarketingPosts /></RequirePermission>} />

                {/* Social Media — Instagram (mini-dashboard + posts) */}
                <Route path="marketing/social-media/instagram" element={<RequirePermission permission="marketing.instagram"><MarketingInstagram /></RequirePermission>} />
                <Route path="marketing/social-media/instagram/posts" element={<RequirePermission permission="marketing.instagram"><MarketingPosts /></RequirePermission>} />

                {/* Social Media — Site (GA4 detalhado) */}
                <Route path="marketing/social-media/site" element={<RequirePermission permission="marketing.site"><MarketingSite /></RequirePermission>} />

                {/* Estratégia */}
                <Route path="marketing/estrategia" element={<RequirePermission permission="marketing.ideias"><MarketingStrategy /></RequirePermission>} />
                <Route path="marketing/ideias" element={<RequirePermission permission="marketing.ideias"><MarketingIdeas /></RequirePermission>} />
                <Route path="marketing/referencias" element={<RequirePermission permission="marketing.referencias"><MarketingReferences /></RequirePermission>} />

                {/* Redirects de URLs antigas (compatibilidade) */}
                <Route path="marketing/posts" element={<Navigate to="/marketing/social-media/calendario" replace />} />
                <Route path="marketing/galeria" element={<Navigate to="/marketing/social-media/calendario" replace />} />
                <Route path="marketing/ranking" element={<Navigate to="/marketing/social-media/calendario?view=ranking" replace />} />
                <Route path="marketing/persona" element={<Navigate to="/marketing/estrategia?aba=persona" replace />} />
                <Route path="marketing/pilares" element={<Navigate to="/marketing/estrategia?aba=pilares" replace />} />
                <Route path="esteira-de-pos" element={<RequirePermission permission="esteira_de_pos"><PostProduction /></RequirePermission>} />
                <Route path="esteira-de-pos/:id" element={<RequirePermission permission="esteira_de_pos"><PPVideoDetail /></RequirePermission>} />
                <Route path="esteira-de-pos/:id/editar" element={<RequirePermission permission="esteira_de_pos"><PPVideoEditDetail /></RequirePermission>} />
                <Route path="perfil" element={<Profile />} />
                <Route path="administracao" element={<Navigate to="/administracao/usuarios" replace />} />
                <Route path="administracao/usuarios" element={<RequirePermission permission="admin"><AdminUsers /></RequirePermission>} />
                <Route path="administracao/permissoes" element={<RequirePermission permission="admin"><AdminPermissions /></RequirePermission>} />
                <Route path="administracao/logs" element={<RequirePermission permission="admin"><AdminLogs /></RequirePermission>} />
                <Route path="administracao/categorias" element={<RequirePermission permission="admin"><AdminCategories /></RequirePermission>} />
                <Route path="administracao/notificacoes" element={<RequirePermission permission="admin"><AdminNotifications /></RequirePermission>} />
                <Route path="administracao/sistema" element={<RequirePermission permission="admin"><AdminSystem /></RequirePermission>} />
                <Route path="administracao/integracoes" element={<RequirePermission permission="admin"><MarketingIntegrations /></RequirePermission>} />
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
