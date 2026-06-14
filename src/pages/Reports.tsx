import React, { useState, useMemo } from 'react';
import { useStore, Material } from '../store/useStore';
import { 
  formatCr, 
  formatRupees, 
  formatDate 
} from '../utils/formatters';
import { 
  FileText, 
  Download, 
  Eye, 
  Filter,
  CheckCircle,
  Building,
  Layers,
  Calendar,
  Layers3,
  X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportCardProps {
  title: string;
  description: string;
  onPreview: () => void;
  onDownload: (format: 'pdf' | 'excel') => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, onPreview, onDownload }) => {
  return (
    <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
      <div>
        <div className="bg-bs-primary-light text-bs-primary p-3 rounded-lg w-12 h-12 flex items-center justify-center">
          <FileText size={22} />
        </div>
        <h4 className="font-bold text-sm text-slate-800 mt-4">{title}</h4>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{description}</p>
      </div>
      
      <div className="border-t border-bs-neutral-100 pt-4 mt-5 flex gap-2">
        <button
          onClick={onPreview}
          className="flex-1 border border-bs-neutral-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5"
        >
          <Eye size={12} />
          Preview Layout
        </button>
        <button
          onClick={() => onDownload('pdf')}
          className="bg-bs-primary hover:bg-bs-primary-dark text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
          title="Download PDF Report"
        >
          <Download size={12} />
          PDF
        </button>
        <button
          onClick={() => onDownload('excel')}
          className="border border-bs-neutral-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
          title="Download Excel Spreadsheet"
        >
          Spreadsheet
        </button>
      </div>
    </div>
  );
};

export const Reports: React.FC = () => {
  const { materials, projects, requests } = useStore();

  // Filters State
  const [filterVertical, setFilterVertical] = useState('ALL');
  const [filterProjectId, setFilterProjectId] = useState('ALL');
  const [filterGroup, setFilterGroup] = useState('ALL');

  // Preview States
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);

  const distinctGroups = useMemo(() => {
    const set = new Set(materials.map(m => m.materialGroup));
    return Array.from(set).filter(Boolean).sort();
  }, [materials]);

  // Reconciled list based on filters
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const proj = projects.find(p => p.id === m.projectId);
      if (!proj) return false;

      if (filterVertical !== 'ALL' && proj.vertical !== filterVertical) return false;
      if (filterProjectId !== 'ALL' && m.projectId !== filterProjectId) return false;
      if (filterGroup !== 'ALL' && m.materialGroup !== filterGroup) return false;

      return true;
    });
  }, [materials, projects, filterVertical, filterProjectId, filterGroup]);

  // Aggregate totals
  const totalValueCr = useMemo(() => {
    return filteredMaterials.reduce((sum, m) => sum + m.amountCr, 0);
  }, [filteredMaterials]);

  // Download simulation
  const handleDownload = (reportName: string, format: 'pdf' | 'excel') => {
    alert(`Generating ${reportName} in ${format.toUpperCase()} format...\nDocument exported successfully!`);
    
    const element = document.createElement("a");
    const file = new Blob([
      `BLUE STAR PROJECTS\nREPORT: ${reportName.toUpperCase()}\nFormat: ${format.toUpperCase()}\nGenerated: June 2026\n\nTotal Record Count: ${filteredMaterials.length}\nTotal Valuation: ${formatCr(totalValueCr)}\nFilters:\n- Vertical: ${filterVertical}\n- Project: ${filterProjectId}\n- Group: ${filterGroup}`
    ], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${reportName.toLowerCase().replace(/\s+/g, '_')}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Vertical aggregation for preview
  const verticalBreakdown = useMemo(() => {
    const vMap: { [key: string]: number } = {
      Buildings: 0,
      'Data Center': 0,
      Factories: 0,
      Railway: 0,
      Substation: 0
    };
    filteredMaterials.forEach(m => {
      const proj = projects.find(p => p.id === m.projectId);
      if (proj && vMap[proj.vertical] !== undefined) {
        vMap[proj.vertical] += m.amountCr;
      }
    });
    return Object.keys(vMap).map(k => ({
      name: k,
      amountCr: parseFloat(vMap[k].toFixed(2))
    }));
  }, [filteredMaterials, projects]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Global Filter Bar */}
      <div className="bg-white border border-bs-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-bs-neutral-900 text-xs uppercase mb-4">
          <Filter size={16} className="text-bs-primary" />
          <span>Report Scope Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-500 mb-1.5">Vertical Designation</label>
            <select
              value={filterVertical}
              onChange={(e) => { setFilterVertical(e.target.value); setFilterProjectId('ALL'); }}
              className="w-full border border-bs-neutral-200 rounded-lg p-2 focus:ring-2 focus:ring-bs-primary/20 bg-white"
            >
              <option value="ALL">All Verticals Consolidated</option>
              <option value="Buildings">Buildings</option>
              <option value="Data Center">Data Center</option>
              <option value="Factories">Factories</option>
              <option value="Railway">Railway</option>
              <option value="Substation">Substation</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1.5">Specific Project Site</label>
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="w-full border border-bs-neutral-200 rounded-lg p-2 focus:ring-2 focus:ring-bs-primary/20 bg-white"
            >
              <option value="ALL">All Projects Consolidated</option>
              {projects
                .filter(p => filterVertical === 'ALL' || p.vertical === filterVertical)
                .map(p => (
                  <option key={p.id} value={p.id}>{p.jobCode} — {p.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1.5">Material Category Group</label>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="w-full border border-bs-neutral-200 rounded-lg p-2 focus:ring-2 focus:ring-bs-primary/20 bg-white"
            >
              <option value="ALL">All Categories Consolidated</option>
              {distinctGroups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard
          title="Executive Summary"
          description="1-page corporate PDF layout. Provides vertical breakdown stats, utilization rate graphs, and executive overview KPI dashboards."
          onPreview={() => setPreviewTitle("Executive Summary")}
          onDownload={(fmt) => handleDownload("Executive Summary", fmt)}
        />
        <ReportCard
          title="Project-wise Surplus"
          description="Consolidated overview report grouped by project site. Showcases items counts, POCs, and valuations per individual site."
          onPreview={() => setPreviewTitle("Project-wise Surplus")}
          onDownload={(fmt) => handleDownload("Project-wise Surplus", fmt)}
        />
        <ReportCard
          title="Detailed Inventory Listing"
          description="Tabular report listing all surplus items. Shows description, spec, makes, quantity, rates, amount, age, and declaration status."
          onPreview={() => setPreviewTitle("Detailed Inventory Listing")}
          onDownload={(fmt) => handleDownload("Detailed Inventory Listing", fmt)}
        />
        <ReportCard
          title="Consumption & Savings"
          description="Calculates redeployed transfer values, avoided procurement costs (savings), and segmented consumption lists by vertical."
          onPreview={() => setPreviewTitle("Consumption & Savings")}
          onDownload={(fmt) => handleDownload("Consumption & Savings", fmt)}
        />
        <ReportCard
          title="Surplus Aging Report"
          description="Groups surplus items into age brackets: 0-30 days, 31-90 days, 91-180 days, and 180+ days obsolete items."
          onPreview={() => setPreviewTitle("Surplus Aging Report")}
          onDownload={(fmt) => handleDownload("Surplus Aging Report", fmt)}
        />
        <ReportCard
          title="Custom Query Report"
          description="Compiles custom listings from your filtered scope above. Export raw datasets containing full audit records."
          onPreview={() => setPreviewTitle("Custom Query Report")}
          onDownload={(fmt) => handleDownload("Custom Query Report", fmt)}
        />
      </div>

      {/* Branded PDF Layout Preview Drawer */}
      {previewTitle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border border-bs-neutral-200 rounded-2xl max-w-4xl w-full shadow-2xl relative z-50 animate-in zoom-in-95 duration-150 p-6 flex flex-col justify-between max-h-[90vh]">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-bs-neutral-200 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-bs-primary p-1.5 rounded-lg text-white">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase">Blue Star Corporate Report Preview</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Template Layout: {previewTitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewTitle(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Layout Body (Branded PDF Schema) */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-8 rounded-xl border border-bs-neutral-200 flex flex-col gap-6">
              
              {/* Branded Cover Header */}
              <div className="bg-white border border-bs-neutral-200 rounded-lg p-6 shadow-sm relative overflow-hidden flex justify-between items-center">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-bs-primary" />
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">SURPLUS MATERIAL REPORT</h2>
                  <p className="text-xs text-slate-400 font-bold tracking-widest mt-1">BLUE STAR PROJECTS · JUNE 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-bs-primary">CONFIDENTIAL</p>
                  <p className="text-[10px] text-slate-400 mt-1">SMEP Systems v0.1</p>
                </div>
              </div>

              {/* KPI Summary Block */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-bs-neutral-200 shadow-sm text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Consolidated Valuation</p>
                  <p className="text-lg font-bold text-bs-primary mt-1">{formatCr(totalValueCr)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-bs-neutral-200 shadow-sm text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Record Count</p>
                  <p className="text-lg font-bold text-slate-700 mt-1">{filteredMaterials.length} Items</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-bs-neutral-200 shadow-sm text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Scope Vertical</p>
                  <p className="text-lg font-bold text-slate-700 mt-1 truncate">{filterVertical === 'ALL' ? 'All Sites' : filterVertical}</p>
                </div>
              </div>

              {/* Visual segment (only for executive overview) */}
              {(previewTitle === 'Executive Summary' || previewTitle === 'Custom Query Report') && (
                <div className="bg-white p-5 rounded-lg border border-bs-neutral-200 shadow-sm flex flex-col gap-3">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Surplus Valuation by Vertical (Cr)</p>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={verticalBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                        <Tooltip formatter={(v) => [`₹${v} Cr`]} />
                        <Bar dataKey="amountCr" fill="#2D6BE4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Branded Tabular List Preview */}
              <div className="bg-white rounded-lg border border-bs-neutral-200 overflow-hidden shadow-sm flex-1">
                <div className="p-4 border-b border-bs-neutral-200 bg-bs-neutral-50">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sample Record Layout Preview</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px] md:text-xs">
                    <thead>
                      <tr className="border-b border-bs-neutral-200 font-bold text-slate-600 bg-slate-50 uppercase">
                        <th className="py-2.5 px-4">Job Code</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4 text-right">Qty</th>
                        <th className="py-2.5 px-4 text-right">Rate (Rs)</th>
                        <th className="py-2.5 px-4 text-right">Amount (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bs-neutral-200 font-medium text-slate-700">
                      {filteredMaterials.slice(0, 5).map(m => (
                        <tr key={m.id}>
                          <td className="py-2 px-4 font-mono font-bold text-slate-500">{m.projectId}</td>
                          <td className="py-2 px-4 font-bold text-slate-600">{m.materialGroup}</td>
                          <td className="py-2 px-4 text-slate-800 font-semibold truncate max-w-[180px]" title={m.description}>{m.description}</td>
                          <td className="py-2 px-4 text-right">{m.quantity} {m.uom}</td>
                          <td className="py-2 px-4 text-right">{formatRupees(m.unitRate)}</td>
                          <td className="py-2 px-4 text-right font-bold text-bs-primary">{formatCr(m.amountCr)}</td>
                        </tr>
                      ))}
                      {filteredMaterials.length > 5 && (
                        <tr>
                          <td colSpan={6} className="py-2.5 px-4 text-center text-slate-400 italic">
                            ... and {filteredMaterials.length - 5} more surplus rows in report scope.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Branded Footer */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-4 border-t border-bs-neutral-200 bg-white rounded-lg p-4 shadow-sm">
                <span>Blue Star Projects · Corporate Surplus Management Portal</span>
                <span>Page 1 of 1</span>
              </div>

            </div>

            {/* Drawer footer controls */}
            <div className="border-t border-bs-neutral-200 pt-4 mt-4 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setPreviewTitle(null)}
                className="bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-800 text-xs font-bold px-4 py-2 rounded-lg"
              >
                Close Preview
              </button>
              <button 
                onClick={() => { handleDownload(previewTitle, 'pdf'); setPreviewTitle(null); }}
                className="bg-bs-primary hover:bg-bs-primary-dark text-white text-xs font-bold px-5 py-2 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Download size={14} />
                Download PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
