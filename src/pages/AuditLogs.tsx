import React, { useState, useMemo } from 'react';
import { useStore, AuditLog } from '../store/useStore';
import { formatDate } from '../utils/formatters';
import { Search, FileText, Clock, User, Filter } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { auditLogs } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Distinct action types
  const distinctActions = useMemo(() => {
    const set = new Set(auditLogs.map(l => l.action));
    return Array.from(set).filter(Boolean).sort();
  }, [auditLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(l => {
      // 1. Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const userMatch = l.userName.toLowerCase().includes(q);
        const detailMatch = l.details.toLowerCase().includes(q);
        const actionMatch = l.action.toLowerCase().includes(q);
        if (!userMatch && !detailMatch && !actionMatch) return false;
      }

      // 2. Action filter
      if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;

      return true;
    });
  }, [auditLogs, searchTerm, actionFilter]);

  // Format time
  const formatTime = (isoString: string): string => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Filters bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input 
            type="text"
            placeholder="Search logs by user, details, or actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-bs-neutral-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-bs-primary/20 bg-white"
          />
        </div>

        {/* Filter select */}
        <div className="flex gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-bs-neutral-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-bs-primary/20 bg-white"
          >
            <option value="ALL">All Actions</option>
            {distinctActions.map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Logs Table */}
      <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-bs-neutral-200 text-xs font-bold text-bs-neutral-600 uppercase bg-slate-50/50">
                <th className="py-3 px-5 w-44">Timestamp</th>
                <th className="py-3 px-5 w-40">User Name</th>
                <th className="py-3 px-5 w-36">Portal Role</th>
                <th className="py-3 px-5 w-44">Action Code</th>
                <th className="py-3 px-5">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bs-neutral-200 text-xs font-medium text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                    No system transaction logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5 text-slate-500 flex items-center gap-1.5 font-mono">
                      <Clock size={12} className="text-slate-400" />
                      <span>{formatDate(l.timestamp.split('T')[0])} {formatTime(l.timestamp)}</span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <User size={12} className="text-slate-400 shrink-0" />
                        {l.userName}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        l.userRole === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                        l.userRole === 'MANAGEMENT' ? 'bg-purple-100 text-purple-800' :
                        l.userRole === 'PROJECT_OWNER' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {l.userRole.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-slate-600 leading-normal" title={l.details}>
                      {l.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
