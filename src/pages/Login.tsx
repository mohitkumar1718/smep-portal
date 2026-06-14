import React, { useState } from 'react';
import { useStore, User, UserRole } from '../store/useStore';
import { Layers, UserCheck, KeyRound, Building, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const { usersList, setCurrentUser } = useStore();
  const [selectedUser, setSelectedUser] = useState<string>(usersList[0].id);
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState<UserRole>('REQUESTING_PROJECT');
  const [customProjectId, setCustomProjectId] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isCustom) {
      if (!customName.trim()) {
        setError('Please enter your name.');
        return;
      }
      if ((customRole === 'PROJECT_OWNER' || customRole === 'REQUESTING_PROJECT') && !customProjectId.trim()) {
        setError('Project-based roles require an associated Project Code.');
        return;
      }

      const newUser: User = {
        id: `usr-custom-${Date.now()}`,
        name: customName.trim(),
        email: `${customName.toLowerCase().replace(/\s+/g, '.')}@bluestar.in`,
        role: customRole,
        projectId: (customRole === 'PROJECT_OWNER' || customRole === 'REQUESTING_PROJECT') ? customProjectId.trim().toUpperCase() : undefined
      };
      setCurrentUser(newUser);
    } else {
      const user = usersList.find(u => u.id === selectedUser);
      if (user) {
        setCurrentUser(user);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20 animate-bounce">
            <Layers size={32} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          BLUE STAR PROJECTS
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400 font-semibold tracking-wider uppercase">
          Surplus Material Exchange Portal (SMEP)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-md bg-opacity-80">
          
          <div className="flex border-b border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => { setIsCustom(false); setError(''); }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                !isCustom 
                  ? 'border-blue-500 text-blue-400 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Simulate Seed Persona
            </button>
            <button
              type="button"
              onClick={() => { setIsCustom(true); setError(''); }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                isCustom 
                  ? 'border-blue-500 text-blue-400 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom Credentials
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg flex items-start gap-2.5 text-xs">
              <ShieldAlert className="shrink-0 mt-0.5" size={14} />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            {!isCustom ? (
              <div>
                <label htmlFor="user-select" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Seed User Profile
                </label>
                <div className="relative">
                  <select
                    id="user-select"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer appearance-none"
                  >
                    {usersList.map(u => (
                      <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200 py-2">
                        {u.name} — {u.role.replace('_', ' ')} {u.projectId ? `(${u.projectId})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <UserCheck size={16} />
                  </div>
                </div>
                
                <div className="mt-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 space-y-1.5">
                  <p className="font-semibold text-slate-300">Available Simulation Scenarios:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-blue-400">Project Owner:</strong> Approve/reject incoming material requests, declare material surplus.</li>
                    <li><strong className="text-indigo-400">Requesting Project:</strong> View and request materials from other active sites.</li>
                    <li><strong className="text-emerald-400">Super Admin / VP:</strong> Full system override, bulk Excel uploads.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="custom-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    id="custom-name"
                    type="text"
                    placeholder="Enter your name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="custom-role" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Select Role
                  </label>
                  <select
                    id="custom-role"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value as UserRole)}
                    className="block w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="PROJECT_OWNER">Project Owner (Can Approve/List)</option>
                    <option value="REQUESTING_PROJECT">Requesting Project (Can Request)</option>
                    <option value="SUPER_ADMIN">Super Admin (VP Procurement)</option>
                    <option value="MANAGEMENT">Management (CFO Office / Viewer)</option>
                  </select>
                </div>

                {(customRole === 'PROJECT_OWNER' || customRole === 'REQUESTING_PROJECT') && (
                  <div>
                    <label htmlFor="custom-project" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Assign to Project Code
                    </label>
                    <input
                      id="custom-project"
                      type="text"
                      placeholder="e.g. G10-44040"
                      value={customProjectId}
                      onChange={(e) => setCustomProjectId(e.target.value)}
                      className="block w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Provide one of the seeded project codes to represent that site.</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                <KeyRound size={16} />
                <span>Enter SMEP Workspace</span>
              </button>
            </div>
          </form>

        </div>
      </div>
      
      <p className="mt-8 text-center text-xs text-slate-500 z-10">
        Bluestar Projects &copy; 2026. Audit logs will record all simulated sessions.
      </p>
    </div>
  );
};
