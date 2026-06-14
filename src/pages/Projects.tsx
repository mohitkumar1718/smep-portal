import React, { useState, useMemo } from 'react';
import { useStore, Project } from '../store/useStore';
import { formatCr } from '../utils/formatters';
import { 
  Search, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  ArrowRight,
  Download,
  Building,
  CheckCircle2
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  valueCr: number;
  itemsCount: number;
  onViewInventory: () => void;
  onDownloadReport: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  valueCr, 
  itemsCount, 
  onViewInventory, 
  onDownloadReport 
}) => {
  return (
    <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            project.vertical === 'Buildings' ? 'bg-blue-100 text-blue-800' :
            project.vertical === 'Data Center' ? 'bg-indigo-100 text-indigo-800' :
            project.vertical === 'Factories' ? 'bg-orange-100 text-orange-800' :
            project.vertical === 'Railway' ? 'bg-purple-100 text-purple-800' :
            'bg-teal-100 text-teal-800'
          }`}>
            {project.vertical}
          </span>
          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
            {project.jobCode}
          </span>
        </div>

        <h4 className="font-bold text-slate-800 text-sm mt-3 h-10 line-clamp-2" title={project.name}>
          {project.name}
        </h4>

        <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
          <MapPin size={14} />
          <span className="font-semibold">{project.location}</span>
        </div>

        <div className="h-px bg-bs-neutral-100 my-4" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Surplus Items</p>
            <p className="font-bold text-sm text-slate-800 mt-0.5">{itemsCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Job Value</p>
            <p className="font-bold text-sm text-slate-800 mt-0.5">
              {project.jobValue ? `₹${project.jobValue} Cr` : '-'}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-bs-neutral-200 rounded-xl p-3.5 mt-4">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Surplus Value</p>
          <p className="text-xl font-bold text-bs-primary leading-none mt-1">
            {formatCr(valueCr)}
          </p>
        </div>
      </div>

      <div className="border-t border-bs-neutral-200 bg-slate-50/50 p-4">
        {/* POC Section */}
        {project.pocName ? (
          <div className="flex flex-col gap-1.5 text-xs mb-4">
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
              <User size={12} className="text-slate-400" />
              <span>{project.pocName}</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <a 
                href={`tel:${project.pocContact}`}
                className="flex items-center gap-1 text-[11px] font-semibold text-bs-primary hover:underline font-mono"
              >
                <Phone size={10} />
                {project.pocContact}
              </a>
              {project.pocEmail && (
                <a 
                  href={`mailto:${project.pocEmail}`}
                  className="flex items-center gap-1 text-[11px] font-semibold text-bs-primary hover:underline truncate max-w-[120px]"
                  title={project.pocEmail}
                >
                  <Mail size={10} />
                  Email
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic mb-4">Point of contact not assigned</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onViewInventory}
            className="flex-1 bg-bs-primary hover:bg-bs-primary-dark text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            View Inventory
            <ArrowRight size={12} />
          </button>
          <button
            onClick={onDownloadReport}
            className="p-2 border border-bs-neutral-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
            title="Download Project wise PDF Report"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface ProjectsProps {
  onViewProjectInventory: (projectId: string) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ onViewProjectInventory }) => {
  const { projects, materials } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVertical, setActiveVertical] = useState<string>('ALL');

  // Compute surplus metrics for each project
  const projectStats = useMemo(() => {
    return projects.map(p => {
      const pMaterials = materials.filter(m => m.projectId === p.id);
      const valueCr = pMaterials.reduce((sum, m) => sum + (m.amountCr || 0), 0);
      return {
        ...p,
        itemsCount: pMaterials.length,
        valueCr
      };
    });
  }, [projects, materials]);

  // Filter project cards
  const filteredProjects = useMemo(() => {
    return projectStats.filter(p => {
      // 1. Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = p.name.toLowerCase().includes(query);
        const codeMatch = p.id.toLowerCase().includes(query);
        const locMatch = p.location.toLowerCase().includes(query);
        if (!nameMatch && !codeMatch && !locMatch) return false;
      }
      
      // 2. Vertical filter
      if (activeVertical !== 'ALL' && p.vertical !== activeVertical) return false;
      
      return true;
    });
  }, [projectStats, searchQuery, activeVertical]);

  // Mock download report for project
  const handleDownloadProjectReport = (projName: string, code: string) => {
    alert(`Generating PDF Surplus Report for ${code} — ${projName}...\nBranded report downloaded successfully!`);
    
    // Create a mock text file download
    const element = document.createElement("a");
    const file = new Blob([
      `BLUE STAR PROJECTS\nSURPLUS MATERIAL EXCHANGE PORTAL\n\nPROJECT REPORT: ${code} - ${projName}\nGenerated: June 2026\n\nThis is a mock PDF/Excel report export for inventory site ${code}.\nPortal pre-seeded with May'26 datasets.`
    ], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${code}_surplus_report.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Search & Tabs Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search projects by name, code, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-bs-neutral-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-bs-primary/20 bg-white shadow-sm"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex overflow-x-auto gap-1 border border-bs-neutral-200 p-1 bg-white rounded-xl shadow-sm shrink-0 scrollbar-none">
          {['ALL', 'Buildings', 'Data Center', 'Factories', 'Railway', 'Substation'].map(v => (
            <button
              key={v}
              onClick={() => setActiveVertical(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeVertical === v 
                  ? 'bg-bs-primary text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {v === 'ALL' ? 'All Verticals' : v}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredProjects.length === 0 ? (
        <div className="border border-dashed border-bs-neutral-200 rounded-xl bg-white p-12 text-center flex flex-col items-center justify-center gap-4">
          <Building className="text-slate-300" size={48} />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">No Projects Found</h4>
            <p className="text-xs text-slate-400 mt-1">Try adapting your search parameters or selecting another vertical tab filter.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              valueCr={p.valueCr}
              itemsCount={p.itemsCount}
              onViewInventory={() => onViewProjectInventory(p.id)}
              onDownloadReport={() => handleDownloadProjectReport(p.name, p.id)}
            />
          ))}
        </div>
      )}

    </div>
  );
};
