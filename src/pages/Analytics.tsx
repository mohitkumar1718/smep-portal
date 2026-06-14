import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCr } from '../utils/formatters';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { TrendingUp, PiggyBank, Calendar, Layers } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { materials, projects, requests } = useStore();

  // Colors
  const COLORS = ['#2D6BE4', '#0EA5E9', '#16A34A', '#D97706', '#8B5CF6', '#EC4899'];

  // 1. Monthly Surplus Valuation trend (Jan to May 2026)
  // Feb'26 surplus: Rs 2.10 Cr
  // May'26 surplus: Rs 5.03 Cr (consolidated)
  const monthlyTrendData = [
    { name: 'Jan 26', Value: 1.80 },
    { name: 'Feb 26', Value: 2.10 },
    { name: 'Mar 26', Value: 3.20 },
    { name: 'Apr 26', Value: 4.10 },
    { name: 'May 26', Value: 5.21 }, // May'26 Seed valuation
  ];

  // 2. Vertical Distribution over Time (Stacked Area)
  // Maps the monthly trend value across verticals
  const stackedAreaData = [
    { name: 'Jan 26', Buildings: 1.30, 'Data Center': 0.50, Factories: 0.00, Railways: 0.00, Substation: 0.00 },
    { name: 'Feb 26', Buildings: 1.51, 'Data Center': 0.60, Factories: 0.00, Railways: 0.00, Substation: 0.00 },
    { name: 'Mar 26', Buildings: 2.10, 'Data Center': 0.60, Factories: 0.30, Railways: 0.20, Substation: 0.00 },
    { name: 'Apr 26', Buildings: 2.60, 'Data Center': 0.65, Factories: 0.50, Railways: 0.35, Substation: 0.00 },
    { name: 'May 26', Buildings: 3.21, 'Data Center': 0.67, Factories: 0.81, Railways: 0.52, Substation: 0.02 },
  ];

  // 3. Top 10 material categories by value (Horizontal Bar Chart)
  const categoryChartData = useMemo(() => {
    const map: { [key: string]: number } = {};
    materials.forEach(m => {
      const g = m.materialGroup || 'Misc';
      map[g] = (map[g] || 0) + m.amountCr;
    });
    return Object.keys(map)
      .map(k => ({
        name: k,
        value: parseFloat(map[k].toFixed(4))
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8
  }, [materials]);

  // 4. Savings Generated (Feb'26 vs May'26)
  // Feb'26 redeployment actual: 0.27 Cr
  const currentSavingsCr = useMemo(() => {
    return requests.reduce((sum, r) => {
      if (r.status === 'APPROVED' || r.status === 'DISPATCHED' || r.status === 'IN_TRANSIT' || r.status === 'RECEIVED' || r.status === 'CONSUMED') {
        const mat = materials.find(m => m.id === r.materialId);
        if (mat) {
          const qty = r.approvedQty || r.requestedQty;
          return sum + ((qty * mat.unitRate) / 10000000);
        }
      }
      return sum;
    }, 0);
  }, [requests, materials]);

  const savingsTrendData = [
    { name: 'Feb 26 (Actual)', Savings: 0.27 },
    { name: 'May 26 (Consolidated)', Savings: currentSavingsCr > 0 ? parseFloat(currentSavingsCr.toFixed(4)) : 0.00 }
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-bs-neutral-200 rounded-xl p-5 shadow-sm">
        
        <div className="flex items-center gap-4">
          <div className="bg-bs-primary-light p-3 rounded-lg text-bs-primary">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Compound Monthly Growth</p>
            <h3 className="text-xl font-bold text-slate-800">+29% / month</h3>
            <p className="text-[10px] text-slate-400 mt-1">Valuation increment Jan-May'26</p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-l border-bs-neutral-200 pl-6">
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
            <PiggyBank size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Redeployed Savings</p>
            <h3 className="text-xl font-bold text-slate-800">
              {currentSavingsCr > 0 ? formatCr(currentSavingsCr) : "₹0.27 Cr"}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Cost savings by transfer</p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-l border-bs-neutral-200 pl-6">
          <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Consolidated Valuation</p>
            <h3 className="text-xl font-bold text-slate-800">₹5.21 Cr</h3>
            <p className="text-[10px] text-slate-400 mt-1">Total surplus pre-seeded</p>
          </div>
        </div>

      </div>

      {/* Row 1 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Trend Line */}
        <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm p-6">
          <h4 className="text-sm font-bold text-bs-neutral-900 mb-4 uppercase tracking-wider">Surplus Valuation Growth (Rs. Cr)</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip formatter={(v) => [`₹${v} Cr`]} />
                <Line type="monotone" dataKey="Value" stroke="#2D6BE4" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stacked Area Vertical Distribution */}
        <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm p-6">
          <h4 className="text-sm font-bold text-bs-neutral-900 mb-4 uppercase tracking-wider">Vertical Mix Trend Over Time (Rs. Cr)</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stackedAreaData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip formatter={(v) => [`₹${v} Cr`]} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="Buildings" stackId="1" stroke="#2D6BE4" fill="#2D6BE4" />
                <Area type="monotone" dataKey="Data Center" stackId="1" stroke="#0EA5E9" fill="#0EA5E9" />
                <Area type="monotone" dataKey="Factories" stackId="1" stroke="#16A34A" fill="#16A34A" />
                <Area type="monotone" dataKey="Railways" stackId="1" stroke="#D97706" fill="#D97706" />
                <Area type="monotone" dataKey="Substation" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Material Categories */}
        <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm p-6">
          <h4 className="text-sm font-bold text-bs-neutral-900 mb-4 uppercase tracking-wider">Top 8 Material Categories by Value (Rs. Cr)</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={11} tickLine={false} width={80} />
                <Tooltip formatter={(v) => [`₹${v} Cr`]} />
                <Bar dataKey="value" fill="#0EA5E9" radius={[0, 4, 4, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avoided procurement cost */}
        <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm p-6">
          <h4 className="text-sm font-bold text-bs-neutral-900 mb-4 uppercase tracking-wider">Avoided Procurement Savings Trend (Rs. Cr)</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={savingsTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip formatter={(v) => [`₹${v} Cr`]} />
                <Bar dataKey="Savings" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={120}>
                  <Cell fill="#0EA5E9" />
                  <Cell fill="#16A34A" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
