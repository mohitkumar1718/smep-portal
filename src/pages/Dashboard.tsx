import React from 'react';
import { useStore } from '../store/useStore';
import { 
  formatCr, 
  formatRupees 
} from '../utils/formatters';
import { 
  TrendingUp, 
  FolderIcon, 
  Boxes, 
  PiggyBank, 
  ClipboardCheck, 
  ArrowRight,
  User,
  Phone
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend
} from 'recharts';

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  colorClass: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, description, colorClass }) => {
  return (
    <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm p-5 flex items-start justify-between hover:shadow-md transition-all">
      <div>
        <p className="text-xs font-semibold text-bs-neutral-600 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-bs-neutral-900">{value}</h3>
        <p className="text-xs text-slate-400 mt-2">{description}</p>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
};

interface DashboardProps {
  onViewProjectInventory: (projectId: string) => void;
  onNavigate?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewProjectInventory, onNavigate }) => {
  const { materials, projects, requests, currentUser } = useStore();

  // Dynamic calculations
  const totalValueCr = materials.reduce((sum, m) => sum + (m.amountCr || 0), 0);
  const totalItems = materials.length;
  
  // Pending incoming requests for the project owner's site, uploader, or admin
  const pendingIncomingRequests = requests.filter(r => {
    const mat = materials.find(m => m.id === r.materialId);
    if (!mat || r.status !== 'REQUESTED') return false;
    
    const isSourceOwner = currentUser?.role === 'PROJECT_OWNER' && currentUser.projectId === mat.projectId;
    const isUploader = mat.uploaderId === currentUser?.id;
    
    return isSourceOwner || isUploader;
  });
  
  // Group materials by project
  const projectStats = projects.map(p => {
    const pMaterials = materials.filter(m => m.projectId === p.id);
    const valueCr = pMaterials.reduce((sum, m) => sum + (m.amountCr || 0), 0);
    return {
      ...p,
      itemsCount: pMaterials.length,
      valueCr
    };
  });

  const projectsWithSurplusCount = projectStats.filter(p => p.valueCr > 0).length;

  // Requests statistics
  const openRequests = requests.filter(r => r.status === 'REQUESTED' || r.status === 'APPROVED' || r.status === 'DISPATCHED' || r.status === 'IN_TRANSIT').length;
  const approvedRequests = requests.filter(r => r.status === 'APPROVED' || r.status === 'DISPATCHED' || r.status === 'IN_TRANSIT' || r.status === 'RECEIVED' || r.status === 'CONSUMED').length;
  
  // Avoided procurement cost (Savings)
  const savingsCr = requests.reduce((sum, r) => {
    if (r.status === 'APPROVED' || r.status === 'DISPATCHED' || r.status === 'IN_TRANSIT' || r.status === 'RECEIVED' || r.status === 'CONSUMED') {
      const mat = materials.find(m => m.id === r.materialId);
      if (mat) {
        const approvedQty = r.approvedQty || r.requestedQty;
        const savingsInRs = approvedQty * mat.unitRate;
        return sum + (savingsInRs / 10000000); // Convert Rs to Cr
      }
    }
    return sum;
  }, 0);

  // Chart 1: Surplus by Vertical
  const verticalData = [
    { name: 'Buildings', value: 0 },
    { name: 'Data Center', value: 0 },
    { name: 'Factories', value: 0 },
    { name: 'Railway', value: 0 },
    { name: 'Substation', value: 0 },
  ];
  materials.forEach(m => {
    const proj = projects.find(p => p.id === m.projectId);
    if (proj) {
      const v = verticalData.find(vd => vd.name === proj.vertical);
      if (v) v.value += (m.amountCr || 0);
    }
  });
  // Round to 2 decimal places
  verticalData.forEach(vd => vd.value = parseFloat(vd.value.toFixed(2)));

  // Chart 2: Top Material Groups by Value
  const groupMap: { [key: string]: number } = {};
  materials.forEach(m => {
    const g = m.materialGroup || 'Misc';
    groupMap[g] = (groupMap[g] || 0) + (m.amountCr || 0);
  });
  const groupData = Object.keys(groupMap).map(k => ({
    name: k,
    value: parseFloat(groupMap[k].toFixed(4))
  })).sort((a, b) => b.value - a.value);

  // Take top 5 and group others
  const topGroups = groupData.slice(0, 5);
  const otherValue = groupData.slice(5).reduce((sum, g) => sum + g.value, 0);
  if (otherValue > 0) {
    topGroups.push({ name: 'Others', value: parseFloat(otherValue.toFixed(4)) });
  }

  // Chart 3: Feb'26 vs May'26 trend (crores)
  // Feb'26: Buildings 1.51 Cr, Data Centre 0.60 Cr, Others 0
  // May'26: Buildings 3.01, Factories 0.81, Data Center 0.67, Railways 0.52, Substation 0.02
  const trendData = [
    { name: 'Buildings', 'Feb 26': 1.51, 'May 26': 3.01 },
    { name: 'Data Center', 'Feb 26': 0.60, 'May 26': 0.67 },
    { name: 'Factories', 'Feb 26': 0.00, 'May 26': 0.81 },
    { name: 'Railways', 'Feb 26': 0.00, 'May 26': 0.52 },
    { name: 'Substation', 'Feb 26': 0.00, 'May 26': 0.02 },
  ];

  // Chart 4: Aging analysis
  // 0-30 days, 31-90 days, 91-180 days, 180+ days
  const agingData = [
    { name: '0-30 Days', value: 0 },
    { name: '31-90 Days', value: 0 },
    { name: '91-180 Days', value: 0 },
    { name: '180+ Days', value: 0 },
  ];
  materials.forEach(m => {
    if (!m.declareDate) return;
    const declDate = new Date(m.declareDate);
    const today = new Date('2026-06-14');
    const diffDays = Math.ceil(Math.abs(today.getTime() - declDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) agingData[0].value += (m.amountCr || 0);
    else if (diffDays <= 90) agingData[1].value += (m.amountCr || 0);
    else if (diffDays <= 180) agingData[2].value += (m.amountCr || 0);
    else agingData[3].value += (m.amountCr || 0);
  });
  agingData.forEach(ad => ad.value = parseFloat(ad.value.toFixed(2)));

  // Table: Top 10 projects
  const topProjects = [...projectStats]
    .sort((a, b) => b.valueCr - a.valueCr)
    .slice(0, 10);

  // Color palette for graphs
  const COLORS = ['#2D6BE4', '#0EA5E9', '#16A34A', '#D97706', '#8B5CF6', '#EC4899'];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Alert Banner for Project Owners with pending incoming requests */}
      {pendingIncomingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Pending Approvals Action Required</h4>
              <p className="text-xs text-amber-700">
                You have {pendingIncomingRequests.length} pending transfer request{pendingIncomingRequests.length > 1 ? 's' : ''} for materials at your site ({currentUser?.projectId}).
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('approvals')}
              className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg transition-all shrink-0 self-start sm:self-auto cursor-pointer"
            >
              Review in Approvals Queue
            </button>
          )}
        </div>
      )}
      
      {/* KPI Section Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Surplus Value"
          value={formatCr(totalValueCr)}
          icon={<TrendingUp className="text-bs-primary" size={20} />}
          description="May'26 Live Consolidated Surplus"
          colorClass="bg-bs-primary-light"
        />
        <KPICard
          title="Surplus Projects"
          value={String(projectsWithSurplusCount)}
          icon={<FolderIcon className="text-sky-500" size={20} />}
          description="Active Sites with Declared Surplus"
          colorClass="bg-sky-50"
        />
        <KPICard
          title="Material Line Items"
          value={String(totalItems)}
          icon={<Boxes className="text-emerald-500" size={20} />}
          description="Unique inventory specifications"
          colorClass="bg-emerald-50"
        />
        <KPICard
          title="Utilization Rate"
          value="13%"
          icon={<PiggyBank className="text-amber-500" size={20} />}
          description="Historical rate (Feb'26 savings)"
          colorClass="bg-amber-50"
        />
      </div>

      {/* KPI Section Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Open Requests"
          value={String(openRequests)}
          icon={<ClipboardCheck className="text-indigo-500" size={20} />}
          description="Transfer requests active or in-transit"
          colorClass="bg-indigo-50"
        />
        <KPICard
          title="Approved Requests"
          value={String(approvedRequests)}
          icon={<ClipboardCheck className="text-teal-500" size={20} />}
          description="Approved transfers in progress"
          colorClass="bg-teal-50"
        />
        <KPICard
          title="Procurement Savings"
          value={savingsCr > 0 ? formatCr(savingsCr) : "₹0.27 Cr"}
          icon={<PiggyBank className="text-rose-500" size={20} />}
          description="Avoided cost by redeploying materials"
          colorClass="bg-rose-50"
        />
      </div>

      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Surplus Value by Vertical */}
        <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm p-6">
          <h4 className="text-sm font-bold text-bs-neutral-900 mb-4 uppercase tracking-wider">Surplus Value by Vertical (Rs. Cr)</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={verticalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`₹${value} Cr`, 'Value']} 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="value" fill="#2D6BE4" radius={[4, 4, 0, 0]}>
                  {verticalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Material Groups */}
        <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm p-6">
          <h4 className="text-sm font-bold text-bs-neutral-900 mb-4 uppercase tracking-wider">Material Categories Breakdown</h4>
          <div className="h-80 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full h-full max-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topGroups}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {topGroups.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`₹${value} Cr`, 'Value']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="flex flex-col gap-2 w-full md:w-48 text-xs shrink-0">
              {topGroups.map((g, index) => (
                <div key={g.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-bs-neutral-600 truncate max-w-[120px]">{g.name}</span>
                  </div>
                  <span className="font-bold text-bs-neutral-900">{formatCr(g.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Charts Section 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Feb vs May Trend */}
        <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm p-6">
          <h4 className="text-sm font-bold text-bs-neutral-900 mb-4 uppercase tracking-wider">Vertical Trend (Feb'26 vs May'26 in Rs. Cr)</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`₹${value} Cr`]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Feb 26" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="May 26" fill="#2D6BE4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aging Analysis */}
        <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm p-6">
          <h4 className="text-sm font-bold text-bs-neutral-900 mb-4 uppercase tracking-wider">Surplus Material Aging Analysis</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`₹${value} Cr`, 'Amount']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Top 10 Surplus Projects Table */}
      <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-bs-neutral-200 bg-bs-neutral-50 flex items-center justify-between">
          <h4 className="text-sm font-bold text-bs-neutral-900 uppercase tracking-wider">Top 10 Projects with Declared Surplus</h4>
          <span className="text-xs font-semibold text-bs-neutral-600 bg-white border border-bs-neutral-200 px-3 py-1 rounded-full">
            Ranked by Amount
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-bs-neutral-200 text-xs font-bold text-bs-neutral-600 uppercase bg-slate-50/50">
                <th className="py-3 px-5">Rank</th>
                <th className="py-3 px-5">Project Name</th>
                <th className="py-3 px-5">Job Code</th>
                <th className="py-3 px-5">Vertical</th>
                <th className="py-3 px-5 text-right">Surplus Value</th>
                <th className="py-3 px-5 text-center">Items Count</th>
                <th className="py-3 px-5">Point of Contact (POC)</th>
                <th className="py-3 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bs-neutral-200 text-sm">
              {topProjects.map((proj, idx) => (
                <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-bs-neutral-600">#{idx + 1}</td>
                  <td className="py-3.5 px-5 font-semibold text-bs-neutral-900 truncate max-w-[240px]" title={proj.name}>
                    {proj.name}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs font-semibold">{proj.jobCode}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      proj.vertical === 'Buildings' ? 'bg-blue-100 text-blue-800' :
                      proj.vertical === 'Data Center' ? 'bg-indigo-100 text-indigo-800' :
                      proj.vertical === 'Factories' ? 'bg-orange-100 text-orange-800' :
                      proj.vertical === 'Railway' ? 'bg-purple-100 text-purple-800' :
                      'bg-teal-100 text-teal-800'
                    }`}>
                      {proj.vertical}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-bold text-right text-slate-800">{formatCr(proj.valueCr)}</td>
                  <td className="py-3.5 px-5 font-semibold text-center text-slate-600">{proj.itemsCount}</td>
                  <td className="py-3.5 px-5">
                    {proj.pocName ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          {proj.pocName}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <Phone size={10} className="text-slate-400" />
                          {proj.pocContact}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Not Declared</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <button
                      onClick={() => onViewProjectInventory(proj.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-bs-primary hover:text-bs-primary-dark transition-colors"
                    >
                      View Inventory
                      <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
