/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Chatbot from './pages/Chatbot';
import VoiceChat from './pages/VoiceChat';
import BIMViewer from './pages/BIMViewer';
import EngineeringTools from './pages/EngineeringTools';
import Settings from './pages/Settings';
import ModulePlaceholder from './pages/ModulePlaceholder';
import ProgressDetails from './pages/ProgressDetails';
import BudgetDetails from './pages/BudgetDetails';
import PersonnelDetails from './pages/PersonnelDetails';
import AlertsDetails from './pages/AlertsDetails';
import FieldReports from './pages/FieldReports';
import ProjectBrain from './pages/ProjectBrain';
import Intelligence from './pages/Intelligence';
import Documents from './pages/Documents';
import Valuations from './pages/Valuations';
import LogisticsMap from './pages/LogisticsMap';
import SihoPtw from './pages/SihoPtw';
import QaQcWelding from './pages/QaQcWelding';
import IntegrityIli from './pages/IntegrityIli';
import StandbyMoc from './pages/StandbyMoc';
import FleetEquipment from './pages/FleetEquipment';
import InteroperabilityEngine from './pages/InteroperabilityEngine';
import DossierCompiler from './pages/DossierCompiler';
import { ProjectProvider } from './ProjectContext';
import { ThemeProvider } from './theme/ThemeContext';

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
      <Routes>
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
    </Router>
  );
}
