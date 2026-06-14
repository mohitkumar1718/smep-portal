import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  jobCode: { type: String, required: true },
  name: { type: String, required: true },
  vertical: { type: String, required: true },
  location: { type: String, required: true },
  jobValue: { type: Number, required: true },
  pocName: String,
  pocContact: String,
  pocEmail: String,
  isActive: { type: Boolean, default: true }
});

const materialSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  materialGroup: { type: String, required: true },
  description: { type: String, required: true },
  specification: String,
  make: String,
  quantity: { type: Number, required: true },
  uom: { type: String, required: true },
  unitRate: { type: Number, required: true },
  amountCr: { type: Number, required: true },
  declareDate: { type: String, required: true },
  status: { type: String, default: 'AVAILABLE' },
  availableQty: { type: Number, required: true },
  reservedQty: { type: Number, default: 0 },
  consumedQty: { type: Number, default: 0 },
  photoLink: String,
  uploaderId: String,
  uploaderName: String
});

const requestCommentSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const materialRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  requestNumber: { type: String, required: true, unique: true },
  materialId: { type: String, required: true },
  sourceProjectId: { type: String, required: true },
  destinationProjectId: { type: String, required: true },
  requestedById: { type: String, required: true },
  requestedByName: { type: String, required: true },
  approvedById: String,
  approvedByName: String,
  requestedQty: { type: Number, required: true },
  approvedQty: Number,
  dispatchedQty: Number,
  receivedQty: Number,
  priority: { type: String, required: true },
  purpose: { type: String, required: true },
  remarks: String,
  approverRemarks: String,
  requiredDate: String,
  status: { type: String, default: 'REQUESTED' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Dispatch details
  dispatchDate: String,
  vehicleNumber: String,
  transporter: String,
  lrNumber: String,
  
  // Chat / Clarification thread
  comments: [requestCommentSchema]
});

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true }, // NEW_SURPLUS, REQUEST_RAISED, etc.
  isRead: { type: Boolean, default: false },
  entityId: String,
  createdAt: { type: Date, default: Date.now }
});

const auditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  details: { type: String, required: true },
  prevValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed
});

export const Project = mongoose.model('Project', projectSchema);
export const Material = mongoose.model('Material', materialSchema);
export const MaterialRequest = mongoose.model('MaterialRequest', materialRequestSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
