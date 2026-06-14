import React, { useState, useMemo } from 'react';
import { useStore, MaterialRequest, Material } from '../store/useStore';
import { 
  formatCr, 
  formatRupees, 
  formatDate,
  calculateAgeMonths
} from '../utils/formatters';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  User, 
  Clipboard, 
  Calendar,
  X,
  MessageSquare
} from 'lucide-react';

export const Approvals: React.FC = () => {
  const { 
    requests, 
    materials, 
    projects, 
    currentUser, 
    approveRequest, 
    rejectRequest,
    addComment
  } = useStore();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const user = currentUser;
  if (!user) {
    return null;
  }
  
  // Action Modal States
  const [actionReq, setActionReq] = useState<MaterialRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'PARTIAL' | 'REJECT' | null>(null);
  const [actionQty, setActionQty] = useState<number>(0);
  const [actionRemarks, setActionRemarks] = useState('');
  const [actionError, setActionError] = useState('');

  // Filter requests that require this user's approval
  const approverRequests = useMemo(() => {
    return requests.filter(r => {
      // Find material project owner
      const mat = materials.find(m => m.id === r.materialId);
      if (!mat) return false;
      
      const isSuperAdmin = user.role === 'SUPER_ADMIN';
      const isSourceOwner = mat.projectId === user.projectId;
      const isUploader = mat.uploaderId === user.id;
      
      // Approvers can only see incoming requests if they are the uploader, the site owner, or Super Admin
      if (!isSuperAdmin && !isSourceOwner && !isUploader) return false;

      // Filter by tab status
      if (activeTab === 'PENDING') return r.status === 'REQUESTED';
      if (activeTab === 'APPROVED') return r.status === 'APPROVED' || r.status === 'DISPATCHED' || r.status === 'IN_TRANSIT' || r.status === 'RECEIVED' || r.status === 'CONSUMED';
      if (activeTab === 'REJECTED') return r.status === 'REJECTED';
      
      return true;
    });
  }, [requests, materials, currentUser, activeTab]);

  const handleOpenActionModal = (req: MaterialRequest, type: 'APPROVE' | 'PARTIAL' | 'REJECT') => {
    setActionReq(req);
    setActionType(type);
    setActionQty(req.requestedQty);
    setActionRemarks('');
    setActionError('');
  };

  const handleProcessApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionReq || !actionType) return;

    if ((actionType === 'REJECT' || actionType === 'PARTIAL') && !actionRemarks.trim()) {
      setActionError(`Remarks are mandatory when ${actionType === 'REJECT' ? 'rejecting a transfer' : 'making a partial counter-offer'}.`);
      return;
    }

    if (actionType === 'PARTIAL') {
      if (actionQty <= 0 || actionQty >= actionReq.requestedQty) {
        setActionError(`Please enter a partial quantity less than requested (${actionReq.requestedQty}).`);
        return;
      }
      const mat = materials.find(m => m.id === actionReq.materialId);
      if (mat && actionQty > mat.availableQty) {
        setActionError(`Quantity exceeds available stock of ${mat.availableQty} ${mat.uom}.`);
        return;
      }
    }

    try {
      if (actionType === 'APPROVE') {
        approveRequest(actionReq.id, actionReq.requestedQty, actionRemarks, user.name);
        alert(`Request ${actionReq.requestNumber} approved successfully!`);
      } else if (actionType === 'PARTIAL') {
        approveRequest(actionReq.id, actionQty, actionRemarks, user.name);
        alert(`Request ${actionReq.requestNumber} partially approved for ${actionQty} units!`);
      } else {
        rejectRequest(actionReq.id, actionRemarks, user.name);
        alert(`Request ${actionReq.requestNumber} has been rejected.`);
      }
      
      setActionReq(null);
      setActionType(null);
    } catch (err: any) {
      setActionError(err.message || 'Operation failed.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Tab select */}
      <div className="flex overflow-x-auto gap-1 border border-bs-neutral-200 p-1 bg-white rounded-xl shadow-sm self-start shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'PENDING' ? 'bg-bs-primary text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending Approvals ({requests.filter(r => {
            const m = materials.find(x => x.id === r.materialId);
            const isMatch = user.role === 'SUPER_ADMIN' || (m && (m.projectId === user.projectId || m.uploaderId === user.id));
            return r.status === 'REQUESTED' && isMatch;
          }).length})
        </button>
        <button
          onClick={() => setActiveTab('APPROVED')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'APPROVED' ? 'bg-bs-primary text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'REJECTED' ? 'bg-bs-primary text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'ALL' ? 'bg-bs-primary text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Decisions
        </button>
      </div>

      {/* Grid List */}
      {approverRequests.length === 0 ? (
        <div className="border border-dashed border-bs-neutral-200 rounded-xl bg-white p-12 text-center flex flex-col items-center justify-center gap-4">
          <CheckCircle2 className="text-slate-300" size={48} />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">No Approvals Found</h4>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'PENDING' 
                ? 'Excellent! No transfer requests are currently pending your decision.' 
                : 'No historical approvals found matching this category.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {approverRequests.map(r => {
            const mat = materials.find(m => m.id === r.materialId);
            const sourceProj = projects.find(p => p.id === r.sourceProjectId);
            const destProj = projects.find(p => p.id === r.destinationProjectId);
            
            // Calculate age in months
            const ageMonths = mat ? calculateAgeMonths(mat.declareDate) : 0;
            
            return (
              <div 
                key={r.id} 
                className="border border-bs-neutral-200 rounded-xl bg-white shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{r.requestNumber}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Requested: {formatDate(r.createdAt.split('T')[0])}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      r.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                      r.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {r.priority}
                    </span>
                  </div>

                  {/* Material Info Block */}
                  <div className="bg-slate-50 border border-bs-neutral-200 rounded-lg p-3 mt-3">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{mat?.materialGroup}</p>
                    <p className="font-bold text-xs text-slate-800 mt-0.5">{mat?.description}</p>
                    <p className="text-[10px] text-slate-600 mt-1 font-semibold">
                      Stock Available: {mat?.availableQty} {mat?.uom} · Age: {ageMonths} Months
                    </p>
                  </div>

                  {/* Connection Details */}
                  <div className="flex items-center justify-between gap-4 mt-4 text-xs font-semibold">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">From (Source)</p>
                      <p className="font-bold text-slate-700">{sourceProj?.jobCode}</p>
                      <p className="text-[10px] text-slate-400">{sourceProj?.location}</p>
                    </div>
                    <div className="text-slate-300">➔</div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">To (Destination)</p>
                      <p className="font-bold text-slate-700">{destProj?.jobCode}</p>
                      <p className="text-[10px] text-slate-400">{destProj?.location}</p>
                    </div>
                  </div>

                  <div className="mt-4 text-xs p-3 rounded-lg border border-bs-neutral-200 bg-slate-50/50">
                    <p className="text-slate-600 leading-relaxed"><span className="font-bold text-slate-700">Requested Qty:</span> {r.requestedQty} {mat?.uom}</p>
                    <p className="text-slate-600 leading-relaxed mt-1"><span className="font-bold text-slate-700">Estimated Value:</span> {mat ? formatCr((r.requestedQty * mat.unitRate) / 10000000) : '-'}</p>
                    <p className="text-slate-600 leading-relaxed mt-1"><span className="font-bold text-slate-700">Purpose:</span> "{r.purpose}"</p>
                  </div>

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

                {/* Approver Footer Controls */}
                <div className="mt-5 pt-4 border-t border-bs-neutral-200 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      <span>By: {r.requestedByName}</span>
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

                  {r.status === 'REQUESTED' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenActionModal(r, 'REJECT')}
                        className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <XCircle size={12} />
                        Reject
                      </button>
                      <button
                        onClick={() => handleOpenActionModal(r, 'PARTIAL')}
                        className="bg-white border border-bs-primary/20 text-bs-primary hover:bg-bs-primary-light/50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Partial
                      </button>
                      <button
                        onClick={() => handleOpenActionModal(r, 'APPROVE')}
                        className="bg-bs-primary hover:bg-bs-primary-dark text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 size={12} />
                        Approve
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic font-semibold">
                      Processed by: {r.approvedByName || 'Approver'}
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Approval Process Modal */}
      {actionReq && actionType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-bs-neutral-200 rounded-2xl max-w-sm w-full shadow-2xl z-50 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-bs-neutral-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm uppercase">
                {actionType === 'APPROVE' ? 'Approve Transfer' : 
                 actionType === 'PARTIAL' ? 'Issue Partial Approval' : 
                 'Reject Transfer'}
              </h3>
              <button onClick={() => { setActionReq(null); setActionType(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleProcessApproval} className="p-5 flex flex-col gap-4 text-xs">
              
              {actionError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 font-semibold p-2.5 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Informative banners */}
              <div className="bg-slate-50 border border-bs-neutral-200 p-3 rounded-lg leading-relaxed">
                <p className="font-bold text-slate-700">Request Details:</p>
                <p className="mt-1">Item: {materials.find(m => m.id === actionReq.materialId)?.description}</p>
                <p>Requested Qty: {actionReq.requestedQty} {materials.find(m => m.id === actionReq.materialId)?.uom}</p>
              </div>

              {/* Qty Selector for Partial Approvals */}
              {actionType === 'PARTIAL' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Approved Quantity</label>
                  <input 
                    type="number"
                    min="1"
                    max={actionReq.requestedQty - 1}
                    value={actionQty}
                    onChange={(e) => setActionQty(parseInt(e.target.value) || 0)}
                    className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Value: {formatRupees(actionQty * (materials.find(m => m.id === actionReq.materialId)?.unitRate || 0))}
                  </p>
                </div>
              )}

              {/* Approver Remarks */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Approver Remarks {(actionType === 'REJECT' || actionType === 'PARTIAL') && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    actionType === 'REJECT' ? 'Reason for rejection is mandatory...' :
                    actionType === 'PARTIAL' ? 'Reason for partial counter-offer is mandatory...' :
                    'Specify guidelines, delivery notes or approvals...'
                  }
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  className="w-full border border-bs-neutral-200 rounded-lg p-2 font-medium"
                  required={actionType === 'REJECT' || actionType === 'PARTIAL'}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-bs-neutral-200 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => { setActionReq(null); setActionType(null); }}
                  className="flex-1 bg-white border border-bs-neutral-200 hover:bg-slate-50 text-slate-800 font-bold py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 text-white font-bold py-2 rounded-lg shadow-sm ${
                    actionType === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-bs-primary hover:bg-bs-primary-dark'
                  }`}
                >
                  Confirm
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
