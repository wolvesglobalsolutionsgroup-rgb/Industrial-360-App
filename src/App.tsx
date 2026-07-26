/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { lazy, Suspense } from 'react';
import { ProjectProvider } from './ProjectContext';
import { ThemeProvider } from './theme/ThemeContext';
import PageSkeleton from './components/ui/PageSkeleton';

// Carga diferida de páginas
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const VoiceChat = lazy(() => import('./pages/VoiceChat'));
const BIMViewer = lazy(() => import('./pages/BIMViewer'));
const EngineeringTools = lazy(() => import('./pages/EngineeringTools'));
const Settings = lazy(() => import('./pages/Settings'));
const ModulePlaceholder = lazy(() => import('./pages/ModulePlaceholder'));
const ProgressDetails = lazy(() => import('./pages/ProgressDetails'));
const BudgetDetails = lazy(() => import('./pages/BudgetDetails'));
const PersonnelDetails = lazy(() => import('./pages/PersonnelDetails'));
const AlertsDetails = lazy(() => import('./pages/AlertsDetails'));
const FieldReports = lazy(() => import('./pages/FieldReports'));
const ProjectBrain = lazy(() => import('./pages/ProjectBrain'));
const Intelligence = lazy(() => import('./pages/Intelligence'));
const Documents = lazy(() => import('./pages/Documents'));
const Valuations = lazy(() => import('./pages/Valuations'));
const LogisticsMap = lazy(() => import('./pages/LogisticsMap'));
const SihoPtw = lazy(() => import('./pages/SihoPtw'));
const QaQcWelding = lazy(() => import('./pages/QaQcWelding'));
const IntegrityIli = lazy(() => import('./pages/IntegrityIli'));
const StandbyMoc = lazy(() => import('./pages/StandbyMoc'));
const FleetEquipment = lazy(() => import('./pages/FleetEquipment'));
const InteroperabilityEngine = lazy(() => import('./pages/InteroperabilityEngine'));
const DossierCompiler = lazy(() => import('./pages/DossierCompiler'));
const ClientPortalBuilder = lazy(() => import('./pages/ClientPortalBuilder'));
const ClientPortalView = lazy(() => import('./pages/ClientPortalView'));


export default function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/portal/:portalId" element={<ClientPortalView />} />
          {!user ? (
            <Route path="*" element={<Login />} />
          ) : (
            <Route path="/" element={
              <ProjectProvider>
                <ThemeProvider>
                  <Layout />
                </ThemeProvider>
              </ProjectProvider>
            }>
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              
              {/* Rutas con Protección de Rol */}
              <Route path="tasks" element={
                <ProtectedRoute allowedRoles={['superadmin', 'gerente', 'supervisor']} moduleName="WBS / Planificación">
                  <Tasks />
                </ProtectedRoute>
              } />
              <Route path="valuations" element={
                <ProtectedRoute allowedRoles={['superadmin', 'gerente']} moduleName="Valuaciones y Facturación">
                  <Valuations />
                </ProtectedRoute>
              } />
              <Route path="expenses" element={
                <ProtectedRoute allowedRoles={['superadmin', 'gerente']} moduleName="Gestión de Costos y Gastos">
                  <Expenses />
                </ProtectedRoute>
              } />
              <Route path="budget-details" element={
                <ProtectedRoute allowedRoles={['superadmin', 'gerente']} moduleName="Detalles Presupuestarios">
                  <BudgetDetails />
                </ProtectedRoute>
              } />
              <Route path="siho-ptw" element={
                <ProtectedRoute allowedRoles={['superadmin', 'gerente', 'supervisor', 'inspector', 'campo']} moduleName="Módulo SIHO-A y Permisos PTW">
                  <SihoPtw />
                </ProtectedRoute>
              } />
              <Route path="qa-qc-welding" element={
                <ProtectedRoute allowedRoles={['superadmin', 'gerente', 'supervisor', 'inspector']} moduleName="Control de Calidad y Juntas de Soldadura">
                  <QaQcWelding />
                </ProtectedRoute>
              } />

              {/* Rutas adicionales de operación */}
              <Route path="field-reports" element={<FieldReports />} />
              <Route path="documents" element={<Documents />} />
              <Route path="logistics" element={<LogisticsMap />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="modulos/ili-pigging" element={<IntegrityIli />} />
              <Route path="modulos/standby-moc" element={<StandbyMoc />} />
              <Route path="modulos/flota" element={<FleetEquipment />} />
              <Route path="modulos/interoperabilidad" element={<InteroperabilityEngine />} />
              <Route path="modulos/cierre" element={<DossierCompiler />} />
              <Route path="client-portal-builder" element={<ClientPortalBuilder />} />
              <Route path="portal-builder" element={<ClientPortalBuilder />} />
              <Route path="portal/:portalId" element={<ClientPortalView />} />
              <Route path="tools" element={<EngineeringTools />} />
              <Route path="project-brain" element={<ProjectBrain />} />
              <Route path="intelligence" element={<Intelligence />} />
              <Route path="chat" element={<Chatbot />} />
              <Route path="voice" element={<VoiceChat />} />
              <Route path="bim" element={<BIMViewer />} />
              <Route path="settings" element={<Settings />} />
              <Route path="progress-details" element={<ProgressDetails />} />
              <Route path="personnel-details" element={<PersonnelDetails />} />
              <Route path="alerts-details" element={<AlertsDetails />} />
              <Route path="modulos/:id" element={<ModulePlaceholder />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </Suspense>
    </Router>
  );
}
