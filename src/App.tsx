import React, { useState } from 'react';
import { useStore } from './store/useStore';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Marketplace } from './pages/Marketplace';
import { Projects } from './pages/Projects';
import { ProjectInventory } from './pages/ProjectInventory';
import { MaterialRequests } from './pages/MaterialRequests';
import { Approvals } from './pages/Approvals';
import { Reports } from './pages/Reports';
import { Analytics } from './pages/Analytics';
import { AuditLogs } from './pages/AuditLogs';

export const App: React.FC = () => {
  const { currentUser, isLoading } = useStore();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const handleViewProjectInventory = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('inventory');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onViewProjectInventory={handleViewProjectInventory} onNavigate={setActiveTab} />;
      case 'marketplace':
        return <Marketplace />;
      case 'projects':
        return <Projects onViewProjectInventory={handleViewProjectInventory} />;
      case 'inventory':
        return (
          <ProjectInventory 
            selectedProjectId={selectedProjectId} 
            setSelectedProjectId={setSelectedProjectId} 
          />
        );
      case 'requests':
        return <MaterialRequests />;
      case 'approvals':
        return <Approvals />;
      case 'reports':
        return <Reports />;
      case 'analytics':
        return <Analytics />;
      case 'audit':
        return <AuditLogs />;
      default:
        return <Dashboard onViewProjectInventory={handleViewProjectInventory} />;
    }
  };

  if (!currentUser) {
    return <Login />;
  }

  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-semibold tracking-wider uppercase text-xs">Loading SMEP Portal...</p>
      </div>
    );
  }

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AppLayout>
  );
};

export default App;
