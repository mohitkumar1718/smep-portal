import React, { useState, useMemo } from 'react';
import { useStore, Material, MaterialStatus, RequestPriority } from '../store/useStore';
import { 
  formatCr, 
  formatRupees, 
  formatDate,
  calculateAgeMonths
} from '../utils/formatters';
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Briefcase, 
  Clock, 
  Send, 
  Info,
  Calendar,
  AlertTriangle,
  X,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Marketplace: React.FC = () => {
  const { 
    materials, 
    projects, 
    requests,
    currentUser, 
    raiseRequest
  } = useStore();

  const user = currentUser;
  if (!user) {
    return null;
  }

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [minRate, setMinRate] = useState<string>('');
  const [maxRate, setMaxRate] = useState<string>('');
  const [selectedAgeBrackets, setSelectedAgeBrackets] = useState<string[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  // Detail Modal States
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Request Form Modal States
  const [requestMaterial, setRequestMaterial] = useState<Material | null>(null);
  const [reqProjectId, setReqProjectId] = useState('');
  const [reqQty, setReqQty] = useState<number>(1);
  const [reqRequiredDate, setReqRequiredDate] = useState('');
  const [reqPriority, setReqPriority] = useState<RequestPriority>('MEDIUM');
  const [reqPurpose, setReqPurpose] = useState('');
  const [reqRemarks, setReqRemarks] = useState('');
  const [formError, setFormError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  // Extract unique filter lists from data
  const distinctGroups = useMemo(() => {
    const set = new Set(materials.map(m => m.materialGroup));
    return Array.from(set).filter(Boolean).sort();
  }, [materials]);

  const distinctLocations = useMemo(() => {
    const set = new Set(projects.map(p => p.location));
    return Array.from(set).filter(Boolean).sort();
  }, [projects]);

  const distinctMakes = useMemo(() => {
    const set = new Set(materials.map(m => m.make));
    return Array.from(set).filter((m): m is string => !!m && m !== '-').sort();
  }, [materials]);

  // Handle toggles
  const handleToggleFilter = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(x => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Age calculations in days
  const getAgeBracket = (declareDateStr: string): string => {
    const declDate = new Date(declareDateStr);
    const today = new Date('2026-06-14');
    const diffDays = Math.ceil(Math.abs(today.getTime() - declDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) return '0-30';
    if (diffDays <= 90) return '31-90';
    if (diffDays <= 180) return '91-180';
    return '180+';
  };

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      // Find project details
      const proj = projects.find(p => p.id === m.projectId);
      if (!proj) return false;

      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const descMatch = m.description.toLowerCase().includes(query);
        const specMatch = (m.specification || '').toLowerCase().includes(query);
        const makeMatch = (m.make || '').toLowerCase().includes(query);
        const codeMatch = m.projectId.toLowerCase().includes(query);
        if (!descMatch && !specMatch && !makeMatch && !codeMatch) return false;
      }

      // 2. Status check
      if (m.availableQty <= 0) return false;

      // 3. Verticals
      if (selectedVerticals.length > 0 && !selectedVerticals.includes(proj.vertical)) return false;

      // 4. Material Groups
      if (selectedGroups.length > 0 && !selectedGroups.includes(m.materialGroup)) return false;

      // 5. Locations
      if (selectedLocations.length > 0 && !selectedLocations.includes(proj.location)) return false;

      // 6. Makes
      if (selectedMakes.length > 0 && !selectedMakes.includes(m.make || '')) return false;

      // 7. Rate range
      if (minRate && m.unitRate < parseFloat(minRate)) return false;
      if (maxRate && m.unitRate > parseFloat(maxRate)) return false;

      // 8. Age Brackets
      if (selectedAgeBrackets.length > 0) {
        const bracket = getAgeBracket(m.declareDate);
        if (!selectedAgeBrackets.includes(bracket)) return false;
      }

      return true;
    });
  }, [
    materials, 
    projects, 
    searchQuery, 
    onlyAvailable, 
    selectedVerticals, 
    selectedGroups, 
    selectedLocations, 
    selectedMakes, 
    minRate, 
    maxRate, 
    selectedAgeBrackets
  ]);

  // Open Request Modal Helper
  const handleOpenRequestModal = (mat: Material) => {
    setRequestMaterial(mat);
    setReqQty(1);
    setReqRequiredDate('');
    setReqPurpose('');
    setReqRemarks('');
    setFormError('');
    setRequestSuccess('');
    
    // Set default requesting project
    if (user.projectId) {
      setReqProjectId(user.projectId);
    } else {
      // Find first active project that is NOT the source project
      const otherProj = projects.find(p => p.id !== mat.projectId);
      setReqProjectId(otherProj ? otherProj.id : '');
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestMaterial) return;

    if (!reqProjectId) {
      setFormError('Please select a requesting project.');
      return;
    }

    if (reqProjectId === requestMaterial.projectId) {
      setFormError('Destination project cannot be the same as the source project.');
      return;
    }

    if (reqQty <= 0 || isNaN(reqQty)) {
      setFormError('Please enter a valid quantity.');
      return;
    }

    const pendingQty = requests
      .filter(r => r.materialId === requestMaterial.id && r.status === 'REQUESTED')
      .reduce((sum, r) => sum + r.requestedQty, 0);
    const freeQty = Math.max(0, requestMaterial.availableQty - pendingQty);

    if (reqQty > freeQty) {
      setFormError(`Requested quantity exceeds available free stock (${freeQty} ${requestMaterial.uom}).`);
      return;
    }

    if (!reqRequiredDate) {
      setFormError('Please pick a required delivery date.');
      return;
    }

    if (reqPurpose.trim().length < 20) {
      setFormError('Please provide a descriptive purpose (minimum 20 characters).');
      return;
    }

    try {
      const reqNo = await raiseRequest({
        materialId: requestMaterial.id,
        sourceProjectId: requestMaterial.projectId,
        destinationProjectId: reqProjectId,
        requestedQty: reqQty,
        priority: reqPriority,
        purpose: reqPurpose,
        remarks: reqRemarks,
        requiredDate: reqRequiredDate,
      });

      // Celebration effect for successful requests!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      setRequestSuccess(`Request ${reqNo} submitted successfully! The owner of project site ${requestMaterial.projectId} has been notified.`);
      setFormError('');
      
      // Update the local available status of the item
      const updatedMat = materials.find(m => m.id === requestMaterial.id);
      if (updatedMat) {
        setRequestMaterial({
          ...requestMaterial,
          availableQty: requestMaterial.availableQty
        });
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit request.');
    }
  };

  const handleClearAllFilters = () => {
    setSelectedVerticals([]);
    setSelectedGroups([]);
    setSelectedLocations([]);
    setSelectedMakes([]);
    setMinRate('');
    setMaxRate('');
    setSelectedAgeBrackets([]);
    setSearchQuery('');
  };

  return (
    <div className="flex gap-6 items-start">
      
      {/* Filters Sidebar */}
      <aside className="w-64 bg-white border border-bs-neutral-200 rounded-xl p-5 shrink-0 sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto hidden md:block">
        <div className="flex items-center justify-between border-b border-bs-neutral-200 pb-4 mb-4">
          <div className="flex items-center gap-2 font-bold text-bs-neutral-900 text-sm">
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </div>
          <button 
            onClick={handleClearAllFilters}
            className="text-[10px] text-slate-400 hover:text-bs-primary font-bold uppercase transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Status Toggle */}
        <div className="mb-4 pb-4 border-b border-bs-neutral-100">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input 
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded text-bs-primary focus:ring-bs-primary/20 w-4 h-4"
            />
            Show Available Only
          </label>
        </div>

        {/* Verticals Filter */}
        <div className="mb-5">
          <h5 className="text-xs font-bold text-bs-neutral-900 uppercase tracking-wider mb-2">Verticals</h5>
          <div className="flex flex-col gap-1.5">
            {['Buildings', 'Data Center', 'Factories', 'Railway', 'Substation'].map(v => (
              <label key={v} className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={selectedVerticals.includes(v)}
                  onChange={() => handleToggleFilter(selectedVerticals, setSelectedVerticals, v)}
                  className="rounded text-bs-primary focus:ring-bs-primary/20"
                />
                {v}
              </label>
            ))}
          </div>
        </div>

        {/* Locations Filter */}
        <div className="mb-5">
          <h5 className="text-xs font-bold text-bs-neutral-900 uppercase tracking-wider mb-2">Locations</h5>
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
            {distinctLocations.map(loc => (
              <label key={loc} className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={selectedLocations.includes(loc)}
                  onChange={() => handleToggleFilter(selectedLocations, setSelectedLocations, loc)}
                  className="rounded text-bs-primary focus:ring-bs-primary/20"
                />
                {loc}
              </label>
            ))}
          </div>
        </div>

        {/* Material Groups Filter */}
        <div className="mb-5">
          <h5 className="text-xs font-bold text-bs-neutral-900 uppercase tracking-wider mb-2">Material Groups</h5>
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
            {distinctGroups.map(g => (
              <label key={g} className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={selectedGroups.includes(g)}
                  onChange={() => handleToggleFilter(selectedGroups, setSelectedGroups, g)}
                  className="rounded text-bs-primary focus:ring-bs-primary/20"
                />
                {g}
              </label>
            ))}
          </div>
        </div>

        {/* Brand Makes Filter */}
        <div className="mb-5">
          <h5 className="text-xs font-bold text-bs-neutral-900 uppercase tracking-wider mb-2">Makes / Brands</h5>
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
            {distinctMakes.map(m => (
              <label key={m} className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={selectedMakes.includes(m)}
                  onChange={() => handleToggleFilter(selectedMakes, setSelectedMakes, m)}
                  className="rounded text-bs-primary focus:ring-bs-primary/20"
                />
                {m}
              </label>
            ))}
          </div>
        </div>

        {/* Rate Filter */}
        <div className="mb-5">
          <h5 className="text-xs font-bold text-bs-neutral-900 uppercase tracking-wider mb-2">Unit Rate (Rs.)</h5>
          <div className="flex items-center gap-2">
            <input 
              type="number"
              placeholder="Min"
              value={minRate}
              onChange={(e) => setMinRate(e.target.value)}
              className="w-full border border-bs-neutral-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-bs-primary/20"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input 
              type="number"
              placeholder="Max"
              value={maxRate}
              onChange={(e) => setMaxRate(e.target.value)}
              className="w-full border border-bs-neutral-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-bs-primary/20"
            />
          </div>
        </div>

        {/* Age Filter */}
        <div>
          <h5 className="text-xs font-bold text-bs-neutral-900 uppercase tracking-wider mb-2">Declaration Age</h5>
          <div className="flex flex-col gap-1.5">
            {[
              { id: '0-30', label: 'Recent (0-30 days)' },
              { id: '31-90', label: 'Medium (1-3 months)' },
              { id: '91-180', label: 'Aging (3-6 months)' },
              { id: '180+', label: 'Obsolete (6+ months)' },
            ].map(item => (
              <label key={item.id} className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={selectedAgeBrackets.includes(item.id)}
                  onChange={() => handleToggleFilter(selectedAgeBrackets, setSelectedAgeBrackets, item.id)}
                  className="rounded text-bs-primary focus:ring-bs-primary/20"
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

      </aside>

      {/* Main Grid View */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Search Bar & Result Count */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search materials by name, spec, make, or project job code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-bs-neutral-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-bs-primary/20 bg-white shadow-sm"
            />
          </div>
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
            <span className="text-xs font-semibold text-slate-600">
              Showing <span className="font-bold text-bs-neutral-900">{filteredMaterials.length}</span> matching materials
            </span>
          </div>
        </div>

        {/* Materials Cards Grid */}
        {filteredMaterials.length === 0 ? (
          <div className="border border-dashed border-bs-neutral-200 rounded-xl bg-white p-12 text-center flex flex-col items-center justify-center gap-4">
            <AlertTriangle className="text-slate-300" size={48} />
            <div>
              <h4 className="font-bold text-slate-800 text-sm">No Surplus Materials Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">We couldn't find matches for your search filters. Try clearing some filters or searching for keywords.</p>
            </div>
            <button
              onClick={handleClearAllFilters}
              className="bg-bs-primary hover:bg-bs-primary-dark text-white font-bold rounded-lg px-4 py-2 text-xs transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map(m => {
              const proj = projects.find(p => p.id === m.projectId);
              const ageMonths = calculateAgeMonths(m.declareDate);
              const isCurrentUserProject = user.projectId === m.projectId;
              
              const pendingQty = requests
                .filter(r => r.materialId === m.id && r.status === 'REQUESTED')
                .reduce((sum, r) => sum + r.requestedQty, 0);
              const freeQty = Math.max(0, m.availableQty - pendingQty);
              const isFullyRequested = freeQty <= 0;
              
              return (
                <div 
                  key={m.id}
                  className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Card Top */}
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-bs-primary-light text-bs-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {m.materialGroup}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] font-bold ${
                        ageMonths >= 6 ? 'text-rose-500 bg-rose-50' : 'text-slate-400 bg-slate-100'
                      } px-2 py-0.5 rounded-full`}>
                        <Clock size={10} />
                        {ageMonths} mo old
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight hover:text-bs-primary cursor-pointer line-clamp-2" onClick={() => setSelectedMaterial(m)} title={m.description}>
                        {m.description}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-xs text-slate-600 font-medium truncate">Spec: {m.specification}</p>
                        {m.photoLink && (
                          <a 
                            href={m.photoLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-bs-primary hover:text-bs-primary-dark hover:underline transition-colors"
                          >
                            <span>📎 Photo</span>
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium truncate">Make: {m.make}</p>
                    </div>

                    <div className="h-px bg-bs-neutral-100 my-1" />

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Total Declared</p>
                        <p className="font-extrabold text-slate-800 mt-0.5 text-xs">{m.availableQty} {m.uom}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Pending</p>
                        <p className="font-extrabold text-amber-600 mt-0.5 text-xs">{pendingQty} {m.uom}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Free Stock</p>
                        <p className="font-extrabold text-emerald-600 mt-0.5 text-xs">{freeQty} {m.uom}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Unit Rate</p>
                        <p className="font-bold text-slate-800 mt-0.5">{formatRupees(m.unitRate)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Surplus Value</p>
                        <p className="font-bold text-bs-primary mt-0.5">{formatCr(m.amountCr)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Project Info */}
                  <div className="border-t border-bs-neutral-200 bg-slate-50/50 p-4">
                    <div className="flex items-start gap-2 text-xs">
                      <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <div className="truncate">
                        <p className="font-bold text-slate-800 truncate" title={proj?.name}>{proj?.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {proj?.jobCode} · {proj?.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setSelectedMaterial(m)}
                        className="flex-1 bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-800 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Info size={12} />
                        View Details
                      </button>
                      <button
                        onClick={() => handleOpenRequestModal(m)}
                        disabled={isCurrentUserProject || m.availableQty <= 0 || isFullyRequested}
                        className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                          isCurrentUserProject 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                            : isFullyRequested
                            ? 'bg-amber-100 text-amber-700 cursor-not-allowed border border-amber-200'
                            : 'bg-bs-primary hover:bg-bs-primary-dark text-white shadow-sm'
                        }`}
                        title={
                          isCurrentUserProject 
                            ? 'Owned by your project' 
                            : isFullyRequested 
                            ? 'All stock is currently requested' 
                            : 'Request material'
                        }
                      >
                        <Send size={12} />
                        {isCurrentUserProject ? 'Own Item' : isFullyRequested ? 'Fully Requested' : 'Request Transfer'}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 1. Material Details Modal */}
      {selectedMaterial && (() => {
        const proj = projects.find(p => p.id === selectedMaterial.projectId);
        const ageMonths = calculateAgeMonths(selectedMaterial.declareDate);
        const isCurrentUserProject = user.projectId === selectedMaterial.projectId;
        
        const selectedPendingQty = requests
          .filter(r => r.materialId === selectedMaterial.id && r.status === 'REQUESTED')
          .reduce((sum, r) => sum + r.requestedQty, 0);
        const selectedFreeQty = Math.max(0, selectedMaterial.availableQty - selectedPendingQty);
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white border border-bs-neutral-200 rounded-2xl max-w-2xl w-full shadow-2xl relative z-50 animate-in zoom-in-95 duration-150">
              
              <div className="p-6 border-b border-bs-neutral-200 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-bs-primary-light text-bs-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedMaterial.materialGroup}
                    </span>
                    <span className="bg-slate-100 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ID: {selectedMaterial.id}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{selectedMaterial.description}</h3>
                </div>
                <button 
                  onClick={() => setSelectedMaterial(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Specifications Column */}
                <div>
                  <h4 className="text-xs font-bold text-bs-neutral-900 uppercase tracking-wider mb-3">Specifications</h4>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-bs-neutral-200">
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-400 font-semibold">Specification</td>
                        <td className="font-bold text-slate-800 text-right">{selectedMaterial.specification || '-'}</td>
                      </tr>
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-400 font-semibold">Make / Brand</td>
                        <td className="font-bold text-slate-800 text-right">{selectedMaterial.make || '-'}</td>
                      </tr>
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-400 font-semibold">Original Quantity</td>
                        <td className="font-bold text-slate-800 text-right">{selectedMaterial.quantity} {selectedMaterial.uom}</td>
                      </tr>
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-400 font-semibold">Total Declared Stock</td>
                        <td className="font-bold text-slate-700 text-right">{selectedMaterial.availableQty} {selectedMaterial.uom}</td>
                      </tr>
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-400 font-semibold text-amber-600">Pending Requests</td>
                        <td className="font-bold text-amber-600 text-right">{selectedPendingQty} {selectedMaterial.uom}</td>
                      </tr>
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-400 font-bold text-emerald-600">Free Stock</td>
                        <td className="font-extrabold text-emerald-600 text-right">{selectedFreeQty} {selectedMaterial.uom}</td>
                      </tr>
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-400 font-semibold">Reserved Stock</td>
                        <td className="font-bold text-bs-primary text-right">{selectedMaterial.reservedQty} {selectedMaterial.uom}</td>
                      </tr>
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-400 font-semibold">Consumed Stock</td>
                        <td className="font-bold text-slate-400 text-right">{selectedMaterial.consumedQty} {selectedMaterial.uom}</td>
                      </tr>
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-400 font-semibold">Unit rate</td>
                        <td className="font-bold text-slate-800 text-right">{formatRupees(selectedMaterial.unitRate)}</td>
                      </tr>
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-400 font-semibold">Surplus Value</td>
                        <td className="font-bold text-bs-primary text-right">{formatCr(selectedMaterial.amountCr)}</td>
                      </tr>
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-400 font-semibold">Declare Date</td>
                        <td className="font-bold text-slate-800 text-right">{formatDate(selectedMaterial.declareDate)}</td>
                      </tr>
                      <tr className="py-2 flex justify-between">
                        <td className="text-slate-400 font-semibold">Material Age</td>
                        <td className="font-bold text-slate-800 text-right">{ageMonths} Months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Project Site Column */}
                <div className="flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-bs-neutral-900 uppercase tracking-wider mb-3">Surplus Location</h4>
                    <div className="border border-bs-neutral-200 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex items-start gap-2">
                        <Briefcase size={16} className="text-bs-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-xs text-slate-800 leading-none">{proj?.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">
                            {proj?.jobCode} · {proj?.vertical}
                          </p>
                        </div>
                      </div>
                      
                      <div className="h-px bg-bs-neutral-200 my-3" />
                      
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-700 font-bold leading-none">{proj?.location}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">Declared Point of Delivery</p>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-bs-neutral-900 uppercase tracking-wider mb-3 mt-5">Site Point of Contact</h4>
                    <div className="border border-bs-neutral-200 rounded-xl p-4 bg-white">
                      {proj?.pocName ? (
                        <div className="flex flex-col gap-2 text-xs">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="bg-slate-100 p-1 rounded-full text-slate-600"><Sparkles size={12} /></span>
                            {proj.pocName}
                          </p>
                          <p className="text-slate-600 flex items-center gap-1.5 font-mono">
                            <span className="bg-slate-100 p-1 rounded-full text-slate-400"><Info size={12} /></span>
                            {proj.pocContact}
                          </p>
                          <p className="text-slate-600 flex items-center gap-1.5">
                            <span className="bg-slate-100 p-1 rounded-full text-slate-400"><Calendar size={12} /></span>
                            {proj.pocEmail}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No POC details registered</p>
                      )}
                    </div>
                    
                    {selectedMaterial.photoLink && (
                      <div className="mt-4">
                        <a
                          href={selectedMaterial.photoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 border border-bs-primary text-bs-primary hover:bg-bs-primary-light/30 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          <span>📎 View Material Photo (Drive Link)</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setSelectedMaterial(null);
                        handleOpenRequestModal(selectedMaterial);
                      }}
                      disabled={isCurrentUserProject || selectedMaterial.availableQty <= 0 || selectedFreeQty <= 0}
                      className={`w-full py-2.5 rounded-lg font-bold text-xs text-white transition-all shadow-sm ${
                        isCurrentUserProject 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                          : selectedFreeQty <= 0
                          ? 'bg-amber-100 text-amber-700 cursor-not-allowed border border-amber-200'
                          : 'bg-bs-primary hover:bg-bs-primary-dark'
                      }`}
                    >
                      {isCurrentUserProject 
                        ? 'Item Declared by Your Project' 
                        : selectedFreeQty <= 0
                        ? 'Fully Requested'
                        : 'Raise Material Request'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 2. Raise Request Form Modal */}
      {requestMaterial && (() => {
        const otherProjects = projects.filter(p => p.id !== requestMaterial.projectId);
        const pendingQty = requests
          .filter(r => r.materialId === requestMaterial.id && r.status === 'REQUESTED')
          .reduce((sum, r) => sum + r.requestedQty, 0);
        const freeQty = Math.max(0, requestMaterial.availableQty - pendingQty);
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white border border-bs-neutral-200 rounded-2xl max-w-lg w-full shadow-2xl relative z-50 animate-in zoom-in-95 duration-150">
              
              <div className="p-6 border-b border-bs-neutral-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Raise Inter-Project Transfer Request</h3>
                  <p className="text-xs text-slate-400 mt-1">REQ Number will be auto-generated sequentially.</p>
                </div>
                <button 
                  onClick={() => setRequestMaterial(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="p-6 flex flex-col gap-4">
                
                {requestSuccess ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center flex flex-col items-center gap-3">
                    <div className="bg-emerald-100 text-emerald-800 p-2 rounded-full">
                      <Sparkles size={24} />
                    </div>
                    <p className="text-xs font-semibold text-emerald-800">{requestSuccess}</p>
                    <button
                      type="button"
                      onClick={() => setRequestMaterial(null)}
                      className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-4 py-2 text-xs transition-colors"
                    >
                      Close Window
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Material Overview Banner */}
                    <div className="bg-bs-primary-light/50 border border-bs-primary/10 rounded-xl p-4 flex flex-col gap-1">
                      <p className="text-[10px] text-bs-primary font-bold uppercase tracking-wider">{requestMaterial.materialGroup}</p>
                      <h4 className="font-bold text-slate-800 text-xs">{requestMaterial.description}</h4>
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-semibold mt-1 bg-white/60 p-2 rounded-lg border border-bs-primary/5">
                        <div>
                          <span className="block text-slate-400 text-[8px] uppercase">Declared</span>
                          <span className="font-bold text-slate-800">{requestMaterial.availableQty} {requestMaterial.uom}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[8px] uppercase">Pending</span>
                          <span className="font-bold text-amber-600">{pendingQty} {requestMaterial.uom}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[8px] uppercase">Free Stock</span>
                          <span className="font-bold text-emerald-600">{freeQty} {requestMaterial.uom}</span>
                        </div>
                      </div>
                    </div>

                    {formError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* Destination Project Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Destination Project (Requesting Site)</label>
                      {user.projectId ? (
                        <input 
                          type="text"
                          value={`${user.projectId} — ${projects.find(p => p.id === user.projectId)?.name}`}
                          disabled
                          className="w-full bg-slate-50 border border-bs-neutral-200 rounded-lg p-2 text-xs text-slate-600 font-medium cursor-not-allowed"
                        />
                      ) : (
                        <select
                          value={reqProjectId}
                          onChange={(e) => setReqProjectId(e.target.value)}
                          className="w-full border border-bs-neutral-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-bs-primary/20 bg-white"
                          required
                        >
                          <option value="">-- Select requesting project site --</option>
                          {otherProjects.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.jobCode} — {p.name} ({p.vertical})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Quantity & Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Requested Quantity</label>
                        <div className="relative">
                          <input 
                            type="number"
                            min="1"
                            max={freeQty}
                            value={reqQty}
                            onChange={(e) => setReqQty(parseInt(e.target.value) || 0)}
                            className="w-full border border-bs-neutral-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-bs-primary/20 pr-12"
                            required
                          />
                          <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold uppercase">{requestMaterial.uom}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Value: {formatCr((reqQty * requestMaterial.unitRate) / 10000000)} · Max Allowed: {freeQty} {requestMaterial.uom}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Required Date</label>
                        <input 
                          type="date"
                          min="2026-06-14"
                          value={reqRequiredDate}
                          onChange={(e) => setReqRequiredDate(e.target.value)}
                          className="w-full border border-bs-neutral-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-bs-primary/20 bg-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Priority Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Priority</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as RequestPriority[]).map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setReqPriority(p)}
                            className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              reqPriority === p 
                                ? p === 'LOW' ? 'bg-slate-100 border-slate-400 text-slate-800' :
                                  p === 'MEDIUM' ? 'bg-blue-50 border-blue-400 text-blue-700' :
                                  p === 'HIGH' ? 'bg-amber-50 border-amber-400 text-amber-700' :
                                  'bg-rose-50 border-rose-400 text-rose-700 font-extrabold'
                                : 'bg-white border-bs-neutral-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Purpose of Request */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Purpose of Transfer (Min 20 chars)</label>
                      <textarea
                        rows={2}
                        placeholder="Provide details on project requirement, drawing references, or site schedules..."
                        value={reqPurpose}
                        onChange={(e) => setReqPurpose(e.target.value)}
                        className="w-full border border-bs-neutral-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-bs-primary/20"
                        required
                      />
                      <span className="text-[10px] text-slate-400 float-right">{reqPurpose.length}/20 chars min</span>
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Remarks (Optional)</label>
                      <textarea
                        rows={1}
                        placeholder="Additional delivery instructions or notes..."
                        value={reqRemarks}
                        onChange={(e) => setReqRemarks(e.target.value)}
                        className="w-full border border-bs-neutral-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-bs-primary/20"
                      />
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="mt-2 border-t border-bs-neutral-200 pt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRequestMaterial(null)}
                        className="flex-1 bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-800 text-xs font-bold py-2.5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-bs-primary hover:bg-bs-primary-dark text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm"
                      >
                        Submit Request
                      </button>
                    </div>
                  </>
                )}

              </form>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
