import React, { useState } from 'react';
import { useStore, User } from '../../store/useStore';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  FolderGit2, 
  PackageSearch, 
  FileCheck, 
  ClipboardList, 
  FileBarChart2, 
  TrendingUp, 
  FileText, 
  Bell, 
  UserCheck,
  ChevronDown,
  RotateCcw,
  LogOut,
  Layers
} from 'lucide-react';
import { formatCr } from '../../utils/formatters';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, badge }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-bs-primary text-white shadow-sm' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
          active ? 'bg-white text-bs-primary' : 'bg-bs-primary text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
};

interface AppLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { 
    currentUser, 
    usersList, 
    setCurrentUser, 
    notifications, 
    markAllNotificationsAsRead, 
    clearNotifications,
    requests,
    materials,
    resetAllData
  } = useStore();

  if (!currentUser) {
    return null;
  }

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Compute pending approvals badge count
  const pendingApprovalsCount = requests.filter(r => {
    if (currentUser.role === 'SUPER_ADMIN') {
      return r.status === 'REQUESTED';
    } else if (currentUser.role === 'PROJECT_OWNER') {
      // Find materials owned by this project owner
      const mat = materials.find(m => m.id === r.materialId);
      return r.status === 'REQUESTED' && mat && mat.projectId === currentUser.projectId;
    }
    return false;
  }).length;

  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'marketplace', label: 'Marketplace', icon: <ShoppingBag size={18} /> },
    { id: 'projects', label: 'Projects Grid', icon: <FolderGit2 size={18} /> },
    { id: 'inventory', label: 'Surplus Inventory', icon: <PackageSearch size={18} /> },
    { id: 'requests', label: 'Material Requests', icon: <ClipboardList size={18} /> },
    { id: 'approvals', label: 'Approvals Queue', icon: <FileCheck size={18} />, badge: pendingApprovalsCount },
    { id: 'reports', label: 'Reports Generator', icon: <FileBarChart2 size={18} /> },
    { id: 'analytics', label: 'Analytics Suite', icon: <TrendingUp size={18} /> },
    { id: 'audit', label: 'System Audit Logs', icon: <FileText size={18} /> },
  ];

  const handleRoleChange = (user: User) => {
    setCurrentUser(user);
    setShowRoleMenu(false);
  };

  const getBreadcrumb = () => {
    const item = menuItems.find(m => m.id === activeTab);
    return item ? item.label : 'SMEP';
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all portal data? This will clear custom requests/declarations and restore original May\'26 datasets.')) {
      resetAllData();
      alert('Portal data restored successfully!');
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bs-neutral-50 text-bs-neutral-900">
      
      {/* Sidebar Layout */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shrink-0">
        <div>
          {/* Sidebar Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-bs-primary p-1.5 rounded-lg text-white">
              <Layers size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">BLUE STAR</h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">SMEP Portal</p>
            </div>
          </div>
          
          {/* Navigation Items */}
          <nav className="p-4 flex flex-col gap-1.5">
            {menuItems.map(item => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeTab === item.id}
                badge={item.badge}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-all w-full text-left"
          >
            <RotateCcw size={14} />
            Reset Seed Data
          </button>
          
          <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-800">
            <div className="truncate">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Surplus Seed</p>
              <p className="text-sm font-bold text-white">₹5.21 Crore</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold">
              21 Sites
            </span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-bs-neutral-200 bg-white flex items-center justify-between px-6 shrink-0 z-20">
          
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-medium">SMEP Portal</span>
            <span className="text-slate-300 text-xs font-medium">/</span>
            <span className="text-sm font-bold text-slate-800">{getBreadcrumb()}</span>
          </div>

          {/* Actions & Profiles */}
          <div className="flex items-center gap-4">
            
            {/* Quick Role Switcher panel */}
            <div className="relative">
              <button
                onClick={() => { setShowRoleMenu(!showRoleMenu); setShowNotifMenu(false); }}
                className="flex items-center gap-2 bg-bs-primary-light border border-bs-primary/20 hover:bg-bs-primary/10 transition-all text-bs-primary rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                <UserCheck size={14} />
                <span>Role: {currentUser.role.replace('_', ' ')}</span>
                <ChevronDown size={12} />
              </button>
              
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-bs-neutral-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                  <div className="px-4 py-2 border-b border-bs-neutral-200">
                    <p className="text-[10px] text-bs-neutral-600 font-semibold uppercase">Simulate Portal Persona</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {usersList.map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleRoleChange(u)}
                        className={`w-full text-left px-4 py-2 text-xs flex flex-col hover:bg-bs-primary-light/50 transition-all ${
                          currentUser.id === u.id ? 'bg-bs-primary-light font-bold text-bs-primary' : 'text-bs-neutral-900'
                        }`}
                      >
                        <span className="font-semibold text-slate-800">{u.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {u.role.replace('_', ' ')} {u.projectId ? `(${u.projectId})` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifMenu(!showNotifMenu); setShowRoleMenu(false); }}
                className="p-2 text-bs-neutral-600 hover:bg-bs-neutral-100 rounded-lg relative transition-all"
              >
                <Bell size={20} />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-bs-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100">
                  <div className="p-4 border-b border-bs-neutral-200 bg-bs-neutral-50 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-bs-neutral-900">Notifications ({unreadNotifsCount} new)</h3>
                    {notifications.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[10px] text-bs-primary font-bold hover:underline"
                        >
                          Mark all read
                        </button>
                        <button
                          onClick={clearNotifications}
                          className="text-[10px] text-rose-500 font-bold hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-bs-neutral-200">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-bs-neutral-600">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-3 text-xs hover:bg-bs-neutral-50 transition-all ${
                            !n.isRead ? 'bg-bs-primary-light/30 border-l-2 border-bs-primary' : ''
                          }`}
                        >
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5">{n.message}</p>
                          <p className="text-slate-400 text-[9px] mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-bs-neutral-200" />

            {/* Profile Avatar & Logout */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 border border-bs-neutral-200 h-9 w-9 rounded-full flex items-center justify-center font-bold text-bs-primary shrink-0">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 leading-tight">{currentUser.email}</p>
              </div>
              <button 
                onClick={() => setCurrentUser(null)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all ml-1"
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>

          </div>
        </header>

        {/* Content Display Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1440px] mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};
