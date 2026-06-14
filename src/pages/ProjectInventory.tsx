import React, { useState, useMemo } from 'react';
import { useStore, Material, MaterialStatus } from '../store/useStore';
import { 
  formatCr, 
  formatRupees, 
  formatDate,
  calculateAgeMonths
} from '../utils/formatters';
import { 
  Plus, 
  Upload, 
  Download, 
  Search, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Edit3, 
  X, 
  AlertTriangle,
  Building,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectInventoryProps {
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
}

type SortField = 'id' | 'materialGroup' | 'description' | 'quantity' | 'unitRate' | 'amountCr' | 'declareDate' | 'availableQty';
type SortOrder = 'asc' | 'desc';

export const ProjectInventory: React.FC<ProjectInventoryProps> = ({ 
  selectedProjectId, 
  setSelectedProjectId 
}) => {
  const { 
    materials, 
    projects, 
    currentUser, 
    addProject,
    addMaterial, 
    updateMaterial, 
    deleteMaterial, 
    bulkUploadExcel
  } = useStore();

  const user = currentUser;
  if (!user) {
    return null;
  }

  // Local UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [showMyUploadsOnly, setShowMyUploadsOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Sort States
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Modals States
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);

  // Create Project Form State
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjName, setNewProjName] = useState('');
  const [newProjVertical, setNewProjVertical] = useState<'Buildings' | 'Factories' | 'Data Center' | 'Railway' | 'Substation'>('Buildings');
  const [newProjLocation, setNewProjLocation] = useState('');
  const [newProjValue, setNewProjValue] = useState<number>(0);
  const [newProjPocName, setNewProjPocName] = useState('');
  const [newProjPocContact, setNewProjPocContact] = useState('');
  const [newProjPocEmail, setNewProjPocEmail] = useState('');
  const [newProjError, setNewProjError] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // Declare Form State
  const [formProjId, setFormProjId] = useState('');
  const [formGroup, setFormGroup] = useState('Pipe');
  const [formDesc, setFormDesc] = useState('');
  const [formSpec, setFormSpec] = useState('');
  const [formMake, setFormMake] = useState('');
  const [formQty, setFormQty] = useState<number>(0);
  const [formUom, setFormUom] = useState('Nos');
  const [formRate, setFormRate] = useState<number>(0);
  const [formInvoiceDate, setFormInvoiceDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formPhotoLink, setFormPhotoLink] = useState('');

  // Bulk Form State
  const [bulkText, setBulkText] = useState('');
  const [bulkSummary, setBulkSummary] = useState('');

  // Determine current active project details
  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Set default form project based on session
  React.useEffect(() => {
    if (selectedProjectId) {
      setFormProjId(selectedProjectId);
    } else if (user.projectId) {
      setFormProjId(user.projectId);
    } else {
      setFormProjId(projects[0].id);
    }
  }, [selectedProjectId, user, projects]);

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort Materials
  const processedMaterials = useMemo(() => {
    let result = [...materials];

    // 1. Filter by Project Code
    if (selectedProjectId) {
      result = result.filter(m => m.projectId === selectedProjectId);
    } else if (user.role === 'PROJECT_OWNER' && user.projectId && !showMyUploadsOnly) {
      // If Project Owner and not showing my uploads only, restrict view to their site unless they clear it
      result = result.filter(m => m.projectId === user.projectId);
    }

    // 2. Filter by Category Group
    if (selectedGroupFilter !== 'ALL') {
      result = result.filter(m => m.materialGroup === selectedGroupFilter);
    }

    // 2.5 Filter by My Uploads
    if (showMyUploadsOnly) {
      result = result.filter(m => m.uploaderId === user.id);
    }

    // 3. Filter by Search Text
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(m => 
        m.description.toLowerCase().includes(q) ||
        (m.specification || '').toLowerCase().includes(q) ||
        (m.make || '').toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    }

    // 4. Sort
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle ID sort numerically
      if (sortField === 'id') {
        const numA = parseInt(a.id.replace('mat-', '')) || 0;
        const numB = parseInt(b.id.replace('mat-', '')) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });

    return result;
  }, [materials, selectedProjectId, currentUser, selectedGroupFilter, searchTerm, sortField, sortOrder, showMyUploadsOnly]);

  // Paginated data
  const paginatedMaterials = useMemo(() => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    return processedMaterials.slice(startIdx, startIdx + rowsPerPage);
  }, [processedMaterials, currentPage]);

  const totalPages = Math.ceil(processedMaterials.length / rowsPerPage);

  // Group list for filtering
  const distinctGroups = useMemo(() => {
    const set = new Set(materials.map(m => m.materialGroup));
    return Array.from(set).filter(Boolean).sort();
  }, [materials]);

  // Handle Declare Submission
  const handleDeclareSurplus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProjId) {
      setFormError('Please select a project site.');
      return;
    }
    if (!formDesc.trim()) {
      setFormError('Material description is required.');
      return;
    }
    if (formQty <= 0) {
      setFormError('Quantity must be greater than 0.');
      return;
    }
    if (formRate <= 0) {
      setFormError('Unit rate must be greater than 0.');
      return;
    }

    const valueCr = (formQty * formRate) / 10000000;
    const declareDate = new Date().toISOString().split('T')[0];

    setIsSubmitting(true);
    setFormError('');

    try {
      await addMaterial({
        projectId: formProjId,
        materialGroup: formGroup,
        description: formDesc,
        specification: formSpec || '-',
        make: formMake || '-',
        quantity: formQty,
        uom: formUom,
        unitRate: formRate,
        amountCr: parseFloat(valueCr.toFixed(5)),
        declareDate,
        status: 'AVAILABLE',
        photoLink: formPhotoLink.trim() || undefined
      });

      // Reset Form
      setFormDesc('');
      setFormSpec('');
      setFormMake('');
      setFormQty(0);
      setFormRate(0);
      setFormPhotoLink('');
      setFormError('');
      setShowDeclareModal(false);
      
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 }
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to declare surplus.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Submission
  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMaterial) return;

    const qty = editMaterial.quantity;
    const rate = editMaterial.unitRate;
    const amountCr = (qty * rate) / 10000000;

    setIsSubmitting(true);
    try {
      await updateMaterial(editMaterial.id, {
        materialGroup: editMaterial.materialGroup,
        description: editMaterial.description,
        specification: editMaterial.specification,
        make: editMaterial.make,
        quantity: qty,
        uom: editMaterial.uom,
        unitRate: rate,
        amountCr: parseFloat(amountCr.toFixed(5)),
        availableQty: qty - editMaterial.reservedQty - editMaterial.consumedQty,
        photoLink: editMaterial.photoLink?.trim() || undefined
      });

      setEditMaterial(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Click
  const handleDeleteMaterial = async (id: string, desc: string) => {
    if (window.confirm(`Are you sure you want to delete material declaration:\n"${desc}"?`)) {
      setDeletingId(id);
      try {
        await deleteMaterial(id);
      } catch (err) {
        console.error(err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Handle Project Creation Submission
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjCode.trim()) {
      setNewProjError('Project Code is required.');
      return;
    }
    if (!newProjName.trim()) {
      setNewProjError('Project Name is required.');
      return;
    }
    if (!newProjLocation.trim()) {
      setNewProjError('Location is required.');
      return;
    }
    if (newProjValue < 0) {
      setNewProjError('Job value must be positive.');
      return;
    }

    setIsSubmitting(true);
    setNewProjError('');

    try {
      await addProject({
        id: newProjCode.trim().toUpperCase(),
        jobCode: newProjCode.trim().toUpperCase(),
        name: newProjName.trim(),
        vertical: newProjVertical,
        location: newProjLocation.trim(),
        jobValue: newProjValue,
        pocName: newProjPocName.trim() || undefined,
        pocContact: newProjPocContact.trim() || undefined,
        pocEmail: newProjPocEmail.trim() || undefined,
      });

      // Reset Form & Close
      setNewProjCode('');
      setNewProjName('');
      setNewProjVertical('Buildings');
      setNewProjLocation('');
      setNewProjValue(0);
      setNewProjPocName('');
      setNewProjPocContact('');
      setNewProjPocEmail('');
      setNewProjError('');
      setShowCreateProjectModal(false);

      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 }
      });
    } catch (err: any) {
      setNewProjError(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Bulk Import Simulation
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) {
      alert('Please copy and paste template rows first.');
      return;
    }

    // Parse tab-separated or comma-separated clipboard text
    const rows = bulkText.split('\n');
    const parsedMaterials: any[] = [];
    
    rows.forEach((row, index) => {
      if (index === 0 && row.toLowerCase().includes('project')) {
        // Skip header row
        return;
      }
      
      const cols = row.split(/\t|,/);
      if (cols.length < 5) return; // invalid row
      
      const pCode = cols[0]?.trim();
      const group = cols[1]?.trim() || 'Misc';
      const desc = cols[2]?.trim();
      const spec = cols[3]?.trim() || '-';
      const qty = parseFloat(cols[4]?.trim());
      const uom = cols[5]?.trim() || 'Nos';
      const make = cols[6]?.trim() || '-';
      const rate = parseFloat(cols[7]?.trim()) || 0;
      
      if (pCode && desc && !isNaN(qty) && qty > 0) {
        const amtCr = (qty * rate) / 10000000;
        parsedMaterials.push({
          projectId: pCode.toUpperCase(),
          materialGroup: group,
          description: desc,
          specification: spec,
          quantity: qty,
          uom: uom,
          make: make,
          unitRate: rate,
          amountCr: parseFloat(amtCr.toFixed(5)),
          declareDate: new Date().toISOString().split('T')[0]
        });
      }
    });

    if (parsedMaterials.length === 0) {
      alert('Could not parse any valid rows. Please check template format:\nProject Code | Group | Description | Spec | Qty | UoM | Make | Rate');
      return;
    }

    const res = await bulkUploadExcel(parsedMaterials);
    setBulkSummary(`Bulk Import Completed!\nSuccessfully Inserted: ${res.inserted} items.\nSkipped/Invalid: ${res.skipped} items.`);
    setBulkText('');

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  // Mock Export Excel/PDF
  const handleExport = (type: 'excel' | 'pdf') => {
    const code = selectedProjectId || 'Consolidated';
    alert(`Exporting ${code} Surplus Inventory to ${type === 'excel' ? 'Excel Spreadsheet' : 'PDF Document'}...\nFile exported successfully!`);
    
    const element = document.createElement("a");
    const file = new Blob([
      `BLUE STAR PROJECTS\nSURPLUS INVENTORY: ${code}\nGenerated: June 2026\n\nTotal Line Items: ${processedMaterials.length}\nTotal Surplus Value: ${formatCr(processedMaterials.reduce((sum, m) => sum + m.amountCr, 0))}`
    ], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${code}_surplus_inventory.${type === 'excel' ? 'xlsx' : 'pdf'}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Panel */}
      <div className="bg-white border border-bs-neutral-200 rounded-xl p-5 shadow-sm flex flex-col lg:flex-row gap-5 items-stretch lg:items-center justify-between">
        
        {/* Project Selector dropdown */}
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-bs-primary-light p-2.5 rounded-lg text-bs-primary shrink-0">
            <Building size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Viewing Surplus For</p>
            <select
              value={selectedProjectId}
              onChange={(e) => { setSelectedProjectId(e.target.value); setCurrentPage(1); }}
              className="mt-1 font-bold text-slate-800 border-none bg-transparent p-0 focus:ring-0 cursor-pointer text-sm max-w-full truncate"
            >
              <option value="">Consolidated Inventory (All 21 Sites)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.jobCode} — {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Aggregate Value Indicator */}
        <div className="flex gap-6 divide-x divide-bs-neutral-200 border border-bs-neutral-200 rounded-xl p-3 bg-slate-50/50 shrink-0">
          <div className="px-3">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Value</p>
            <p className="text-base font-bold text-bs-primary mt-0.5">
              {formatCr(processedMaterials.reduce((sum, m) => sum + m.amountCr, 0))}
            </p>
          </div>
          <div className="px-5">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Surplus Items</p>
            <p className="text-base font-bold text-slate-700 mt-0.5">{processedMaterials.length}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setShowDeclareModal(true)}
            className="inline-flex items-center gap-1 bg-bs-primary hover:bg-bs-primary-dark text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={14} />
            Declare Surplus
          </button>
          
          <button
            onClick={() => setShowCreateProjectModal(true)}
            className="inline-flex items-center gap-1 bg-white border border-bs-primary/25 hover:bg-bs-primary-light/20 text-bs-primary text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={14} />
            Create Project
          </button>
          
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-1 bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            <Upload size={14} />
            Bulk Upload
          </button>

          <button
            onClick={() => handleExport('excel')}
            className="inline-flex items-center gap-1 bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            <Download size={14} />
            Excel
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-1 bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            <Download size={14} />
            PDF Report
          </button>
        </div>

      </div>

      {/* Inventory Filtering Grid */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input 
            type="text"
            placeholder="Search within this project's surplus items..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full border border-bs-neutral-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-bs-primary/20 bg-white"
          />
        </div>

        {/* Category select & My Uploads toggle */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={showMyUploadsOnly}
                onChange={(e) => { 
                  setShowMyUploadsOnly(e.target.checked); 
                  setCurrentPage(1); 
                  if (e.target.checked) {
                    // Default to All Projects when checking My Uploads
                    setSelectedProjectId('');
                  } else {
                    // Restore to user's assigned project when unchecked
                    if (user.projectId) {
                      setSelectedProjectId(user.projectId);
                    }
                  }
                }}
                className="rounded text-bs-primary focus:ring-bs-primary/20 w-4 h-4"
              />
              Show My Uploads Only
            </label>
            
            {showMyUploadsOnly && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setSelectedProjectId(''); setCurrentPage(1); }}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                      selectedProjectId === '' 
                        ? 'bg-white text-bs-primary shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    All Projects
                  </button>
                  <button
                    type="button"
                    onClick={() => { 
                      setSelectedProjectId(user.projectId || projects[0]?.id || ''); 
                      setCurrentPage(1); 
                    }}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                      selectedProjectId !== '' 
                        ? 'bg-white text-bs-primary shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Specific Project
                  </button>
                </div>
                
                {selectedProjectId !== '' && (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => { setSelectedProjectId(e.target.value); setCurrentPage(1); }}
                    className="border border-slate-200 rounded-lg py-1 px-2 text-[10px] font-bold text-slate-700 focus:ring-2 focus:ring-bs-primary/20 bg-white"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.jobCode} — {p.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
          
          <select
            value={selectedGroupFilter}
            onChange={(e) => { setSelectedGroupFilter(e.target.value); setCurrentPage(1); }}
            className="border border-bs-neutral-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-bs-primary/20 bg-white"
          >
            <option value="ALL">All Categories</option>
            {distinctGroups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Inventory Table Grid */}
      <div className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-bs-neutral-200 text-xs font-bold text-bs-neutral-600 uppercase bg-slate-50/50">
                <th className="py-3 px-4 w-16 text-center cursor-pointer" onClick={() => handleSort('id')}>
                  ID {sortField === 'id' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
                </th>
                {!selectedProjectId && <th className="py-3 px-4 w-28">Project Code</th>}
                <th className="py-3 px-4 w-32 cursor-pointer" onClick={() => handleSort('materialGroup')}>
                  Group {sortField === 'materialGroup' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
                </th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('description')}>
                  Description {sortField === 'description' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
                </th>
                <th className="py-3 px-4">Specification</th>
                <th className="py-3 px-4">Make</th>
                <th className="py-3 px-4 text-right cursor-pointer" onClick={() => handleSort('quantity')}>
                  Qty {sortField === 'quantity' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
                </th>
                <th className="py-3 px-4 w-16">UoM</th>
                <th className="py-3 px-4 text-right cursor-pointer" onClick={() => handleSort('unitRate')}>
                  Unit Rate {sortField === 'unitRate' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
                </th>
                <th className="py-3 px-4 text-right cursor-pointer" onClick={() => handleSort('amountCr')}>
                  Value (Cr) {sortField === 'amountCr' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
                </th>
                <th className="py-3 px-4 text-right cursor-pointer" onClick={() => handleSort('availableQty')}>
                  Avail Qty {sortField === 'availableQty' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
                </th>
                <th className="py-3 px-4 text-center cursor-pointer" onClick={() => handleSort('declareDate')}>
                  Age {sortField === 'declareDate' && (sortOrder === 'asc' ? <ChevronUp className="inline" size={12} /> : <ChevronDown className="inline" size={12} />)}
                </th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bs-neutral-200 text-xs font-medium text-slate-700">
              {paginatedMaterials.length === 0 ? (
                <tr>
                  <td colSpan={selectedProjectId ? 11 : 12} className="py-10 text-center text-slate-400 italic">
                    No surplus items match this query.
                  </td>
                </tr>
              ) : (
                paginatedMaterials.map(m => {
                  const ageMonths = calculateAgeMonths(m.declareDate);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">{m.id.replace('mat-', '')}</td>
                      {!selectedProjectId && <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.projectId}</td>}
                      <td className="py-3 px-4">
                        <span className="bg-bs-primary-light text-bs-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {m.materialGroup}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 max-w-[200px] truncate" title={m.description}>{m.description}</td>
                      <td className="py-3 px-4 max-w-[150px] truncate" title={m.specification}>{m.specification}</td>
                      <td className="py-3 px-4">{m.make}</td>
                      <td className="py-3 px-4 font-bold text-right text-slate-800">{m.quantity}</td>
                      <td className="py-3 px-4 font-bold text-slate-400 uppercase">{m.uom}</td>
                      <td className="py-3 px-4 font-mono text-right text-slate-600">{formatRupees(m.unitRate)}</td>
                      <td className="py-3 px-4 font-bold text-right text-slate-900">{formatCr(m.amountCr)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold ${m.availableQty > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {m.availableQty}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={ageMonths >= 6 ? 'text-rose-600' : 'text-slate-500'}>
                          {ageMonths} mo
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setEditMaterial(m)}
                            disabled={deletingId !== null}
                            className="p-1 text-slate-400 hover:text-bs-primary rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Edit Material"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(m.id, m.description)}
                            disabled={deletingId !== null}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Delete Material"
                          >
                            {deletingId === m.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-bs-neutral-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-600">
              Page <span className="font-bold text-bs-neutral-900">{currentPage}</span> of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-bs-neutral-200 bg-white rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-bs-neutral-200 bg-white rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Declare Surplus Modal */}
      {showDeclareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-bs-neutral-200 rounded-2xl max-w-md w-full shadow-2xl z-50 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-bs-neutral-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm uppercase">Declare New Surplus Material</h3>
              <button onClick={() => setShowDeclareModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleDeclareSurplus} className="p-5 flex flex-col gap-4 text-xs">
              
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 font-semibold p-2.5 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Project selector */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Project Site</label>
                <select
                  value={formProjId}
                  onChange={(e) => setFormProjId(e.target.value)}
                  className="w-full border border-bs-neutral-200 rounded-lg p-2 bg-white font-medium"
                  required
                >
                  <option value="">-- Select project site --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.jobCode} — {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Group */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Material Category Group</label>
                <select
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value)}
                  className="w-full border border-bs-neutral-200 rounded-lg p-2 bg-white font-medium"
                >
                  {distinctGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                  <option value="Misc">Misc</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. PIBCV Valve-40mm, PN16, Danfoss"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              {/* Specification & Make */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Specification</label>
                  <input
                    type="text"
                    placeholder="e.g. PN16, 10mm Thick"
                    value={formSpec}
                    onChange={(e) => setFormSpec(e.target.value)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Make / Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Danfoss, Jindal"
                    value={formMake}
                    onChange={(e) => setFormMake(e.target.value)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              {/* Quantity, UoM, Unit rate */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formQty || ''}
                    onChange={(e) => setFormQty(parseInt(e.target.value) || 0)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">UoM</label>
                  <input
                    type="text"
                    placeholder="Nos, M, Rmt"
                    value={formUom}
                    onChange={(e) => setFormUom(e.target.value)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Unit Rate (Rs)</label>
                  <input
                    type="number"
                    min="1"
                    value={formRate || ''}
                    onChange={(e) => setFormRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Estimation value */}
              <div className="bg-slate-50 border border-bs-neutral-200 rounded-lg p-3 mt-2 flex justify-between font-bold text-xs">
                <span className="text-slate-400">Total Surplus Value:</span>
                <span className="text-bs-primary">
                  {formatCr((formQty * formRate) / 10000000)}
                </span>
              </div>

              {/* Photo Link */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Photo / Google Drive Link (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g. Google Drive link or image URL"
                  value={formPhotoLink}
                  onChange={(e) => setFormPhotoLink(e.target.value)}
                  className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-bs-neutral-200 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowDeclareModal(false)}
                  className="flex-1 bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-800 font-bold py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-bs-primary hover:bg-bs-primary-dark text-white font-bold py-2 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Declaring...
                    </>
                  ) : (
                    'Declare Surplus'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Material Modal */}
      {editMaterial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-bs-neutral-200 rounded-2xl max-w-md w-full shadow-2xl z-50 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-bs-neutral-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm uppercase">Edit Material Details</h3>
              <button onClick={() => setEditMaterial(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateMaterial} className="p-5 flex flex-col gap-4 text-xs">
              
              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <input
                  type="text"
                  value={editMaterial.description}
                  onChange={(e) => setEditMaterial({ ...editMaterial, description: e.target.value })}
                  className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              {/* Specification & Make */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Specification</label>
                  <input
                    type="text"
                    value={editMaterial.specification || ''}
                    onChange={(e) => setEditMaterial({ ...editMaterial, specification: e.target.value })}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Make / Brand</label>
                  <input
                    type="text"
                    value={editMaterial.make || ''}
                    onChange={(e) => setEditMaterial({ ...editMaterial, make: e.target.value })}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              {/* Quantity, UoM, Unit rate */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editMaterial.quantity || ''}
                    onChange={(e) => setEditMaterial({ ...editMaterial, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">UoM</label>
                  <input
                    type="text"
                    value={editMaterial.uom}
                    onChange={(e) => setEditMaterial({ ...editMaterial, uom: e.target.value })}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Unit Rate (Rs)</label>
                  <input
                    type="number"
                    min="1"
                    value={editMaterial.unitRate || ''}
                    onChange={(e) => setEditMaterial({ ...editMaterial, unitRate: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Estimation value */}
              <div className="bg-slate-50 border border-bs-neutral-200 rounded-lg p-3 mt-2 flex justify-between font-bold text-xs">
                <span className="text-slate-400">Total Surplus Value:</span>
                <span className="text-bs-primary">
                  {formatCr((editMaterial.quantity * editMaterial.unitRate) / 10000000)}
                </span>
              </div>

              {/* Photo Link */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Photo / Google Drive Link (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g. Google Drive link or image URL"
                  value={editMaterial.photoLink || ''}
                  onChange={(e) => setEditMaterial({ ...editMaterial, photoLink: e.target.value })}
                  className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-bs-neutral-200 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setEditMaterial(null)}
                  className="flex-1 bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-800 font-bold py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-bs-primary hover:bg-bs-primary-dark text-white font-bold py-2 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 3. Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-bs-neutral-200 rounded-2xl max-w-xl w-full shadow-2xl z-50 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-bs-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase">Simulate Excel Import</h3>
                <p className="text-[10px] text-slate-400 mt-1">Accepts spreadsheet clipboard layout data.</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleBulkImport} className="p-5 flex flex-col gap-4 text-xs">
              
              {bulkSummary ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold p-4 rounded-lg flex flex-col gap-3 items-center text-center">
                  <Check className="bg-emerald-100 text-emerald-800 p-1.5 rounded-full" size={28} />
                  <pre className="font-sans text-xs font-bold leading-relaxed">{bulkSummary}</pre>
                  <button
                    type="button"
                    onClick={() => { setBulkSummary(''); setShowBulkModal(false); }}
                    className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-4 py-2 text-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-bs-primary-light/50 border border-bs-primary/10 rounded-xl p-3.5 leading-relaxed text-bs-primary">
                    <p className="font-bold">Copy-Paste Format Guideline:</p>
                    <p className="mt-1 font-medium">To upload multiple items, copy spreadsheet rows from Excel and paste them here. Columns should match exactly:</p>
                    <p className="font-mono mt-1.5 text-[10px] font-bold">Project Code [TAB] Material Group [TAB] Description [TAB] Specification [TAB] Quantity [TAB] UoM [TAB] Make [TAB] Unit Rate</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1.5">Paste Clipboard Rows</label>
                    <textarea
                      rows={6}
                      placeholder="G10-44040&#9;Pipe&#9;900 mm dia MS Pipe&#9;10mm Thick&#9;60&#9;Rmt&#9;JCO&#9;13800"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="w-full border border-bs-neutral-200 rounded-lg p-2 font-mono text-[10px] focus:ring-2 focus:ring-bs-primary/20"
                      required
                    />
                  </div>

                  {/* Sample Trigger links */}
                  <div className="flex justify-between items-center bg-slate-50 border border-bs-neutral-200 p-2.5 rounded-lg text-[10px] text-slate-500 font-medium">
                    <span>Quick simulator templates:</span>
                    <button
                      type="button"
                      onClick={() => setBulkText("G10-44039\tValve\tGate Valve 100mm\tPN16\t10\tNos\tZoloto\t12500\nG10-44039\tPanel\t55KW Starter Panel\tStandard\t1\tNos\tSiemens\t45000")}
                      className="text-bs-primary hover:underline font-bold"
                    >
                      Load Demo Rows
                    </button>
                  </div>

                  <div className="flex gap-2 border-t border-bs-neutral-200 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkModal(false)}
                      className="flex-1 bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-800 font-bold py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-bs-primary hover:bg-bs-primary-dark text-white font-bold py-2 rounded-lg shadow-sm"
                    >
                      Import Rows
                    </button>
                  </div>
                </>
              )}

            </form>
          </div>
        </div>
      )}

      {/* 4. Create Project Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-bs-neutral-200 rounded-2xl max-w-md w-full shadow-2xl z-50 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-bs-neutral-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm uppercase">Create New Project Site</h3>
              <button onClick={() => setShowCreateProjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-5 flex flex-col gap-4 text-xs">
              
              {newProjError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 font-semibold p-2.5 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{newProjError}</span>
                </div>
              )}

              {/* Project Code & Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Project Job Code</label>
                  <input
                    type="text"
                    placeholder="e.g. G10-44045"
                    value={newProjCode}
                    onChange={(e) => setNewProjCode(e.target.value)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Project Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apollo Phase 2"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Vertical & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Vertical / Segment</label>
                  <select
                    value={newProjVertical}
                    onChange={(e) => setNewProjVertical(e.target.value as any)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 bg-white font-medium"
                  >
                    <option value="Buildings">Buildings</option>
                    <option value="Factories">Factories</option>
                    <option value="Data Center">Data Center</option>
                    <option value="Railway">Railway</option>
                    <option value="Substation">Substation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Location / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={newProjLocation}
                    onChange={(e) => setNewProjLocation(e.target.value)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Job Value (Cr) */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Job Value (Cr)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 15.50"
                  value={newProjValue || ''}
                  onChange={(e) => setNewProjValue(parseFloat(e.target.value) || 0)}
                  className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div className="border-t border-bs-neutral-100 pt-3">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2">Point of Contact Details (Optional)</p>
                
                {/* POC Name */}
                <div className="mb-3">
                  <label className="block font-bold text-slate-700 uppercase mb-1">POC Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Kumar"
                    value={newProjPocName}
                    onChange={(e) => setNewProjPocName(e.target.value)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                  />
                </div>

                {/* POC Contact & Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">POC Contact</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={newProjPocContact}
                      onChange={(e) => setNewProjPocContact(e.target.value)}
                      className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">POC Email</label>
                    <input
                      type="email"
                      placeholder="e.g. suresh.k@bluestar.in"
                      value={newProjPocEmail}
                      onChange={(e) => setNewProjPocEmail(e.target.value)}
                      className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-bs-neutral-200 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="flex-1 bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-800 font-bold py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-bs-primary hover:bg-bs-primary-dark text-white font-bold py-2 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
