/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Layout from './components/Layout';
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
import Documents from './pages/Documents';
import Valuations from './pages/Valuations';

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
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="field-reports" element={<FieldReports />} />
            <Route path="documents" element={<Documents />} />
            <Route path="valuations" element={<Valuations />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="tools" element={<EngineeringTools />} />
            <Route path="project-brain" element={<ProjectBrain />} />
            <Route path="chat" element={<Chatbot />} />
            <Route path="voice" element={<VoiceChat />} />
            <Route path="bim" element={<BIMViewer />} />
            <Route path="settings" element={<Settings />} />
            <Route path="progress-details" element={<ProgressDetails />} />
            <Route path="budget-details" element={<BudgetDetails />} />
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
