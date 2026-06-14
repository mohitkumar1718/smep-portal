import React, { useState, useMemo } from 'react';
import { useStore, MaterialRequest, RequestPriority, MaterialStatus } from '../store/useStore';
import { 
  formatCr, 
  formatRupees, 
  formatDate 
} from '../utils/formatters';
import { 
  Search, 
  Clock, 
  MapPin, 
  User, 
  Truck, 
  CheckSquare, 
  XSquare, 
  AlertTriangle,
  Building,
  Info,
  Calendar,
  X,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StepperProps {
  status: MaterialStatus;
}

const RequestStepper: React.FC<StepperProps> = ({ status }) => {
  const steps = [
    { label: 'Requested', states: ['REQUESTED'] },
    { label: 'Approved', states: ['APPROVED'] },
    { label: 'Dispatched', states: ['DISPATCHED'] },
    { label: 'Received', states: ['RECEIVED'] },
    { label: 'Consumed', states: ['CONSUMED'] },
  ];

  if (status === 'REJECTED') {
    return (
      <div className="flex items-center justify-between w-full mt-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs font-bold text-rose-700">
        <div className="flex items-center gap-2">
          <XSquare size={16} />
          <span>This request has been rejected by the source site owner.</span>
        </div>
      </div>
    );
  }

  // Get active step index
  let activeIdx = 0;
  if (status === 'APPROVED') activeIdx = 1;
  else if (status === 'DISPATCHED') activeIdx = 2;
  else if (status === 'RECEIVED') activeIdx = 3;
  else if (status === 'CONSUMED') activeIdx = 4;

  return (
    <div className="flex items-center w-full mt-4 text-[10px] md:text-xs">
      {steps.map((step, idx) => {
        const isCompleted = idx <= activeIdx;
        const isActive = idx === activeIdx;
        
        return (
          <React.Fragment key={step.label}>
            {/* Step Node */}
            <div className="flex flex-col items-center shrink-0 relative">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                isCompleted 
                  ? 'bg-bs-primary border-bs-primary text-white shadow-sm' 
                  : 'bg-white border-bs-neutral-200 text-slate-400'
              } ${isActive ? 'ring-4 ring-bs-primary/20' : ''}`}>
                {idx + 1}
              </div>
              <span className={`mt-1 font-bold ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</span>
            </div>
            
            {/* Step Line */}
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-bs-neutral-200 relative -top-3">
                <div className={`absolute inset-0 bg-bs-primary transition-all duration-300`} style={{ width: isCompleted && idx < activeIdx ? '100%' : '0%' }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const MaterialRequests: React.FC = () => {
  const { 
    requests, 
    materials, 
    projects, 
    currentUser, 
    dispatchRequest, 
    receiveRequest, 
    consumeRequest,
    addComment
  } = useStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'MY' | 'INCOMING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const user = currentUser;
  if (!user) {
    return null;
  }

  // Modal Dispatch State
  const [dispatchReq, setDispatchReq] = useState<MaterialRequest | null>(null);
  const [dispDate, setDispDate] = useState('');
  const [dispVehicle, setDispVehicle] = useState('');
  const [dispTransporter, setDispTransporter] = useState('');
  const [dispLr, setDispLr] = useState('');
  const [dispError, setDispError] = useState('');

  // Modal Consume State
  const [consumeReq, setConsumeReq] = useState<MaterialRequest | null>(null);
  const [consumeQtyVal, setConsumeQtyVal] = useState<number>(0);
  const [consumeError, setConsumeError] = useState('');

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // 1. Tab filters
      if (activeTab === 'MY' && r.requestedById !== user.id) return false;
      
      if (activeTab === 'INCOMING') {
        const mat = materials.find(m => m.id === r.materialId);
        if (!mat || mat.projectId !== user.projectId) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

      // 3. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const numMatch = r.requestNumber.toLowerCase().includes(q);
        const purposeMatch = r.purpose.toLowerCase().includes(q);
        
        // Find material description
        const mat = materials.find(m => m.id === r.materialId);
        const matMatch = mat?.description.toLowerCase().includes(q);
        
        if (!numMatch && !purposeMatch && !matMatch) return false;
      }

      return true;
    });
  }, [requests, materials, currentUser, activeTab, statusFilter, searchQuery]);

  // Submit Dispatch Action
  const handleSubmitDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchReq) return;

    if (!dispDate || !dispVehicle.trim() || !dispTransporter.trim() || !dispLr.trim()) {
      setDispError('All dispatch details are mandatory.');
      return;
    }

    const approvedQty = dispatchReq.approvedQty || dispatchReq.requestedQty;

    dispatchRequest(dispatchReq.id, {
      dispatchDate: dispDate,
      vehicleNumber: dispVehicle,
      transporter: dispTransporter,
      lrNumber: dispLr,
      dispatchedQty: approvedQty
    });

    setDispatchReq(null);
    setDispError('');
    alert(`Materials dispatched successfully for request ${dispatchReq.requestNumber}!`);
  };

  // Submit Consume Action
  const handleSubmitConsume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumeReq) return;

    const approvedQty = consumeReq.approvedQty || consumeReq.requestedQty;

    if (consumeQtyVal <= 0 || consumeQtyVal > approvedQty) {
      setConsumeError(`Please enter a quantity between 1 and approved quantity (${approvedQty}).`);
      return;
    }

    consumeRequest(consumeReq.id, consumeQtyVal);
    setConsumeReq(null);
    setConsumeError('');

    confetti({
      particleCount: 50,
      spread: 40,
      origin: { y: 0.8 }
    });

    alert(`Transfer request ${consumeReq.requestNumber} is now completed and fully consumed.`);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Search & Tabs Panel */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        
        {/* Role tabs */}
        <div className="flex overflow-x-auto gap-1 border border-bs-neutral-200 p-1 bg-white rounded-xl shadow-sm shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'ALL' ? 'bg-bs-primary text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Requests ({requests.length})
          </button>
          
          {user.projectId && (
            <>
              <button
                onClick={() => setActiveTab('MY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'MY' ? 'bg-bs-primary text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                My Requests ({requests.filter(r => r.requestedById === user.id).length})
              </button>
              <button
                onClick={() => setActiveTab('INCOMING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'INCOMING' ? 'bg-bs-primary text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Incoming Requests ({requests.filter(r => {
                  const m = materials.find(x => x.id === r.materialId);
                  return m && m.projectId === user.projectId;
                }).length})
              </button>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-1 max-w-lg gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="Search by req number, material desc, purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-bs-neutral-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-bs-primary/20 bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-bs-neutral-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-bs-primary/20 bg-white shrink-0"
          >
            <option value="ALL">All Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="RECEIVED">Received</option>
            <option value="CONSUMED">Consumed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

      </div>

      {/* Grid of requests */}
      {filteredRequests.length === 0 ? (
        <div className="border border-dashed border-bs-neutral-200 rounded-xl bg-white p-12 text-center flex flex-col items-center justify-center gap-4">
          <Building className="text-slate-300" size={48} />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">No Transfer Requests Found</h4>
            <p className="text-xs text-slate-400 mt-1">Try toggling filter tabs or typing a different query.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRequests.map(r => {
            const mat = materials.find(m => m.id === r.materialId);
            const sourceProj = projects.find(p => p.id === r.sourceProjectId);
            const destProj = projects.find(p => p.id === r.destinationProjectId);
            
            const isRequester = r.requestedById === user.id;
            const isSourceOwner = mat?.projectId === user.projectId;
            const isSuperAdmin = user.role === 'SUPER_ADMIN';
            
            return (
              <div 
                key={r.id} 
                className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{r.requestNumber}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Created: {formatDate(r.createdAt.split('T')[0])}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Priority chip */}
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        r.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                        r.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                        r.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {r.priority}
                      </span>
                      {/* Status chip */}
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800' :
                        r.status === 'RECEIVED' ? 'bg-teal-100 text-teal-800' :
                        r.status === 'CONSUMED' ? 'bg-slate-100 text-slate-600' :
                        r.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>

                  {/* Material Info Banner */}
                  <div className="bg-slate-50 border border-bs-neutral-200 rounded-lg p-3 mt-3">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{mat?.materialGroup}</p>
                    <p className="font-bold text-xs text-slate-800 mt-0.5">{mat?.description}</p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Qty Requested: <span className="font-bold text-slate-900">{r.requestedQty} {mat?.uom}</span>
                      {r.approvedQty !== undefined && r.approvedQty !== null && (
                        <> · Qty Approved: <span className="font-bold text-emerald-600">{r.approvedQty} {mat?.uom}</span></>
                      )}
                    </p>
                  </div>

                  {/* Counter-Offer Alert Banner */}
                  {r.approvedQty !== undefined && r.approvedQty !== null && r.approvedQty < r.requestedQty && r.status !== 'REJECTED' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mt-3 text-xs text-amber-800 flex items-start gap-2.5 shadow-sm">
                      <AlertTriangle className="shrink-0 mt-0.5 text-amber-600 animate-pulse" size={16} />
                      <div>
                        <p className="font-extrabold text-amber-900">⚠️ Counter-Offer Approved: {r.approvedQty} {mat?.uom} (Requested {r.requestedQty} {mat?.uom})</p>
                        {r.approverRemarks && (
                          <p className="mt-1 text-amber-700 italic font-medium">Reason: "{r.approverRemarks}"</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sites Connection Row */}
                  <div className="flex items-center justify-between gap-4 mt-4 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">From (Source)</p>
                      <p className="font-bold text-slate-700 truncate" title={sourceProj?.name}>{sourceProj?.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{sourceProj?.jobCode} · {sourceProj?.location}</p>
                    </div>
                    <div className="text-slate-300 font-bold shrink-0">➔</div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">To (Destination)</p>
                      <p className="font-bold text-slate-700 truncate" title={destProj?.name}>{destProj?.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{destProj?.jobCode} · {destProj?.location}</p>
                    </div>
                  </div>

                  {/* Purpose & Remarks */}
                  <div className="mt-4 text-xs bg-slate-50/50 p-3 rounded-lg border border-bs-neutral-200/50">
                    <p className="text-slate-600 leading-relaxed"><span className="font-bold text-slate-700">Purpose:</span> "{r.purpose}"</p>
                    {r.approverRemarks && (
                      <p className="text-slate-600 leading-relaxed mt-1"><span className="font-bold text-slate-700">Approver Remarks:</span> "{r.approverRemarks}"</p>
                    )}
                  </div>

                  {/* Stepper tracking */}
                  <RequestStepper status={r.status} />

                  {/* Discussion Section */}
                  {expandedComments[r.id] && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1">
                        <MessageSquare size={14} className="text-slate-400" />
                        <span>Clarification Thread</span>
                      </h5>
                      
                      {/* Comments List */}
                      <div className="max-h-40 overflow-y-auto space-y-2.5 pr-1 text-[11px] flex flex-col">
                        {!r.comments || r.comments.length === 0 ? (
                          <p className="text-slate-400 italic py-1">No messages yet. Start the conversation to clarify specifications or quantity requirements.</p>
                        ) : (
                          r.comments.map((comment, index) => {
                            const isMe = comment.senderId === user.id;
                            return (
                              <div key={index} className={`flex flex-col gap-0.5 rounded-lg p-2 max-w-[85%] ${
                                isMe ? 'bg-bs-primary-light/40 border border-bs-primary/10 self-end ml-auto' : 'bg-slate-100 border border-slate-200 self-start mr-auto'
                              }`}>
                                <div className="flex items-center gap-1.5 justify-between">
                                  <span className="font-bold text-slate-700">{comment.senderName}</span>
                                  <span className="text-[9px] text-slate-400">
                                    {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-slate-600 leading-normal whitespace-pre-line mt-0.5">{comment.text}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                      
                      {/* Comment Input */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          const textInput = form.elements.namedItem('commentText') as HTMLInputElement;
                          const text = textInput.value.trim();
                          if (text) {
                            addComment(r.id, text);
                            textInput.value = '';
                          }
                        }}
                        className="flex gap-2 items-center"
                      >
                        <input 
                          name="commentText"
                          type="text"
                          placeholder="Type a message to clarify transfer details..."
                          className="flex-1 border border-bs-neutral-200 rounded-lg px-3 py-1.5 text-[11px] focus:ring-1 focus:ring-bs-primary"
                        />
                        <button 
                          type="submit"
                          className="bg-bs-primary hover:bg-bs-primary-dark text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Card footer actions */}
                <div className="mt-5 pt-4 border-t border-bs-neutral-200 flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      <span>Requested by: {r.requestedByName}</span>
                    </div>
                    <span>·</span>
                    <button
                      onClick={() => {
                        setExpandedComments(prev => ({
                          ...prev,
                          [r.id]: !prev[r.id]
                        }));
                      }}
                      className="flex items-center gap-1 text-bs-primary hover:text-bs-primary-dark font-bold transition-all cursor-pointer"
                    >
                      <MessageSquare size={12} />
                      <span>Discussion ({r.comments?.length || 0})</span>
                    </button>
                  </div>

                  {/* Action triggers depending on status */}
                  <div className="flex gap-2">
                    
                    {/* Log Dispatch: Available to source site owner or admin once approved */}
                    {r.status === 'APPROVED' && (isSourceOwner || isSuperAdmin) && (
                      <button
                        onClick={() => {
                          setDispatchReq(r);
                          setDispDate(new Date().toISOString().split('T')[0]);
                          setDispVehicle('');
                          setDispTransporter('');
                          setDispLr('');
                        }}
                        className="bg-bs-primary hover:bg-bs-primary-dark text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Truck size={12} />
                        Log Dispatch
                      </button>
                    )}

                    {/* Confirm Receipt: Available to destination requester once dispatched */}
                    {r.status === 'DISPATCHED' && (isRequester || isSuperAdmin) && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Confirm receipt of materials for request ${r.requestNumber} at your site?`)) {
                            receiveRequest(r.id);
                          }
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckSquare size={12} />
                        Confirm Receipt
                      </button>
                    )}

                    {/* Mark as Consumed: Available to destination requester once received */}
                    {r.status === 'RECEIVED' && (isRequester || isSuperAdmin) && (
                      <button
                        onClick={() => {
                          setConsumeReq(r);
                          setConsumeQtyVal(r.approvedQty || r.requestedQty);
                        }}
                        className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckSquare size={12} />
                        Mark as Consumed
                      </button>
                    )}

                    {/* Info badge when completed */}
                    {r.status === 'CONSUMED' && (
                      <span className="text-slate-400 text-xs font-semibold italic flex items-center gap-1">
                        <Info size={12} />
                        Fully Consumed on site
                      </span>
                    )}

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 1. Log Dispatch Modal */}
      {dispatchReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-bs-neutral-200 rounded-2xl max-w-sm w-full shadow-2xl z-50 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-bs-neutral-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm uppercase">Log Dispatch Details</h3>
              <button onClick={() => setDispatchReq(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitDispatch} className="p-5 flex flex-col gap-4 text-xs">
              {dispError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 font-semibold p-2.5 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{dispError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Dispatch Date</label>
                <input 
                  type="date"
                  value={dispDate}
                  onChange={(e) => setDispDate(e.target.value)}
                  className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Transporter Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Bluestar Logistics, Gati, VRL"
                  value={dispTransporter}
                  onChange={(e) => setDispTransporter(e.target.value)}
                  className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Vehicle Number</label>
                  <input 
                    type="text"
                    placeholder="e.g. MH-12-PQ-9876"
                    value={dispVehicle}
                    onChange={(e) => setDispVehicle(e.target.value)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">LR Number (Lorry Receipt)</label>
                  <input 
                    type="text"
                    placeholder="e.g. LR-987654"
                    value={dispLr}
                    onChange={(e) => setDispLr(e.target.value)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-bs-neutral-200 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setDispatchReq(null)}
                  className="flex-1 bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-800 font-bold py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-bs-primary hover:bg-bs-primary-dark text-white font-bold py-2 rounded-lg shadow-sm"
                >
                  Confirm Dispatch
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Mark as Consumed Modal */}
      {consumeReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-bs-neutral-200 rounded-2xl max-w-sm w-full shadow-2xl z-50 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-bs-neutral-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm uppercase">Mark as Consumed on Site</h3>
              <button onClick={() => setConsumeReq(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitConsume} className="p-5 flex flex-col gap-4 text-xs">
              {consumeError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 font-semibold p-2.5 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{consumeError}</span>
                </div>
              )}

              <div className="bg-slate-50 border border-bs-neutral-200 p-3 rounded-lg leading-relaxed">
                <p className="font-semibold text-slate-700">Enter quantity that has been installed/consumed on site.</p>
                <p className="text-[10px] text-slate-400 mt-1">Max allowed: {consumeReq.approvedQty || consumeReq.requestedQty} UoM</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Installed Quantity</label>
                <input 
                  type="number"
                  min="1"
                  max={consumeReq.approvedQty || consumeReq.requestedQty}
                  value={consumeQtyVal}
                  onChange={(e) => setConsumeQtyVal(parseInt(e.target.value) || 0)}
                  className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-bs-neutral-200 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setConsumeReq(null)}
                  className="flex-1 bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-800 font-bold py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-bs-primary hover:bg-bs-primary-dark text-white font-bold py-2 rounded-lg shadow-sm"
                >
                  Confirm Consumption
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
