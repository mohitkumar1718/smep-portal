import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Models
import { Project, Material, MaterialRequest, Notification, AuditLog } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smep_db';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let useMockDb = false;
const mockDbPath = path.join(__dirname, 'mock_db.json');
let mockDb = {
  projects: [],
  materials: [],
  requests: [],
  notifications: [],
  auditLogs: []
};

// Default seed structures
const DEFAULT_PROJECTS = [
  { id: 'G10-44040', jobCode: 'G10-44040', name: 'Sattva Image Tower-HVAC Works', vertical: 'Buildings', location: 'Hyderabad', jobValue: 24.93, pocName: 'Rakesh Murahari', pocContact: '7093850262', pocEmail: 'rakesh.m@bluestar.in', isActive: true },
  { id: 'G10-44039', jobCode: 'G10-44039', name: 'Apollo Hospitals - MEP Works - Hyd', vertical: 'Buildings', location: 'Hyderabad', jobValue: 80.02, pocName: 'K. Venkat Reddi', pocContact: '9848012345', pocEmail: 'venkat.k@bluestar.in', isActive: true },
  { id: 'G10-10030', jobCode: 'G10-10030', name: 'WMUD TOWER A RESIDENTIAL (NEW)', vertical: 'Buildings', location: 'Mumbai', jobValue: 41.44, pocName: 'Sanjay Deshmukh', pocContact: '9820098765', pocEmail: 'sanjay.d@bluestar.in', isActive: true },
  { id: 'G10-42020', jobCode: 'G10-42020', name: 'ETV Parcel 8-A,B,C-HVAC Works', vertical: 'Buildings', location: 'Hyderabad', jobValue: 18.18, pocName: 'Nageswara Rao', pocContact: '9988776655', pocEmail: 'nageswar.r@bluestar.in', isActive: true },
  { id: 'G10-34010', jobCode: 'G10-34010', name: 'HVAC Works for Medanta Hospital Noida', vertical: 'Buildings', location: 'Noida', jobValue: 33.07, pocName: 'Amit Sharma', pocContact: '9810012345', pocEmail: 'amit.s@bluestar.in', isActive: true },
  { id: 'G10-46003', jobCode: 'G10-46003', name: 'P&C Projects Pvt Ltd (DHK)', vertical: 'Buildings', location: 'Delhi', jobValue: 14.36, pocName: 'Ramesh Gupta', pocContact: '9811223344', pocEmail: 'ramesh.g@bluestar.in', isActive: true },
  { id: 'G10-46009', jobCode: 'G10-46009', name: 'Lulu Mall-Kottayam', vertical: 'Buildings', location: 'Kottayam', jobValue: 33.42, pocName: 'Thomas Kurian', pocContact: '9447012345', pocEmail: 'thomas.k@bluestar.in', isActive: true },
  { id: 'G10-46012', jobCode: 'G10-46012', name: 'V Guard Innovation Campus-Kochi', vertical: 'Buildings', location: 'Kochi', jobValue: 14.71, pocName: 'Mathew Joseph', pocContact: '9846054321', pocEmail: 'mathew.j@bluestar.in', isActive: true },
  { id: 'G10-46010', jobCode: 'G10-46010', name: 'TCS-TVM Misc. Civil & External Services', vertical: 'Buildings', location: 'Thiruvananthapuram', jobValue: 13.72, pocName: 'Prasanth Nair', pocContact: '9446098765', pocEmail: 'prasanth.n@bluestar.in', isActive: true },
  { id: 'C10-46030', jobCode: 'C10-46030', name: 'Sands Infin IT Park', vertical: 'Buildings', location: 'Hyderabad', jobValue: 134.99, pocName: 'Sridhar Rao', pocContact: '9000123456', pocEmail: 'sridhar.r@bluestar.in', isActive: true },
  { id: 'G10-24005', jobCode: 'G10-24005', name: 'LTIMINDTREE KOLKATA', vertical: 'Buildings', location: 'Kolkata', jobValue: 74.70, pocName: 'Subrata Sen', pocContact: '9830012345', pocEmail: 'subrata.s@bluestar.in', isActive: true },
  { id: 'G10-44027', jobCode: 'G10-44027', name: 'Kukatpally Developers Private Limited', vertical: 'Buildings', location: 'Hyderabad', jobValue: 100.00, pocName: 'Chandra Shekar', pocContact: '9959012345', pocEmail: 'shekar.c@bluestar.in', isActive: true },
  { id: 'G10-30013', jobCode: 'G10-30013', name: 'MEP works of Apollo Healthcity, Gurugram', vertical: 'Buildings', location: 'Gurugram', jobValue: 97.37, pocName: 'Vikram Singh', pocContact: '9818098765', pocEmail: 'vikram.s@bluestar.in', isActive: true },
  { id: 'G28-44006', jobCode: 'G28-44006', name: 'VITP Pvt Ltd – CapitaLand Hyd Pearl DC', vertical: 'Data Center', location: 'Hyderabad', jobValue: 115.66, pocName: 'Shaik Shareef Miya', pocContact: '9908085032', pocEmail: 'shareef.s@bluestar.in', isActive: true },
  { id: 'G28-44003', jobCode: 'G28-44003', name: 'HYD 121 (Amazon DC HYD121)', vertical: 'Data Center', location: 'Hyderabad', jobValue: 108.18, pocName: 'Markandeya N', pocContact: '9885611279', pocEmail: 'markandeya.n@bluestar.in', isActive: true },
  { id: 'G28-28003', jobCode: 'G28-28003', name: 'MEP works for Trimetro Factory Odisha', vertical: 'Factories', location: 'Odisha', jobValue: 55.10, pocName: 'Rajesh Kumar Jha', pocContact: '9811421201', pocEmail: 'rajesh.j@bluestar.in', isActive: true },
  { id: 'G28-28001', jobCode: 'G28-28001', name: 'Jockey Factory Cuttack', vertical: 'Factories', location: 'Cuttack', jobValue: 33.84, pocName: 'Ujjal Das', pocContact: '8104123877', pocEmail: 'ujjal.d@bluestar.in', isActive: true },
  { id: 'G28-42008', jobCode: 'G28-42008', name: 'Exide Energy – Mechanical Works', vertical: 'Factories', location: 'Bengaluru', jobValue: 101.73, pocName: 'Nikhil Gowda', pocContact: '9900012345', pocEmail: 'nikhil.g@bluestar.in', isActive: true },
  { id: 'G79-36001', jobCode: 'G79-36001', name: 'WCR EPC-01R-RJ: Nagda–Kota', vertical: 'Railway', location: 'Rajasthan', jobValue: 52.45, pocName: 'Gaurav', pocContact: '8429189006', pocEmail: 'gaurav.rail@bluestar.in', isActive: true },
  { id: 'G79-36002', jobCode: 'G79-36002', name: 'WCR EPC-3R: Gangapur City–Ramganjmandi', vertical: 'Railway', location: 'Rajasthan', jobValue: 138.21, pocName: 'Ankit Kumar', pocContact: '8882562046', pocEmail: 'ankit.k@bluestar.in', isActive: true },
  { id: 'G20-36003', jobCode: 'G20-36003', name: 'PGCIL-SS86 Fatehgarh', vertical: 'Substation', location: 'Fatehgarh', jobValue: 189.07, pocName: 'Satish Kumar', pocContact: '9876543210', pocEmail: 'satish.k@bluestar.in', isActive: true }
];

const loadCleanMaterialsJson = () => {
  const jsonPath = path.join(__dirname, '..', 'src', 'data', 'materials_clean.json');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const list = JSON.parse(rawData);
  return list.map((m, idx) => ({
    id: `mat-${idx + 1}`,
    projectId: m.projectCode,
    materialGroup: m.materialGroup,
    description: m.description,
    specification: m.specification || '-',
    make: m.make || '-',
    quantity: m.quantity,
    uom: m.uom,
    unitRate: m.unitRate,
    amountCr: m.amountCr,
    declareDate: m.declareDate,
    status: 'AVAILABLE',
    availableQty: m.quantity,
    reservedQty: 0,
    consumedQty: 0
  }));
};

// Helper: Save Mock DB to file
const saveMockDb = () => {
  if (useMockDb) {
    fs.writeFileSync(mockDbPath, JSON.stringify(mockDb, null, 2));
  }
};

// Helper: Initialize Mock DB
const initializeMockDb = () => {
  if (fs.existsSync(mockDbPath)) {
    try {
      mockDb = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
      console.log('Mock DB loaded from backend/mock_db.json.');
      return;
    } catch (e) {
      console.error('Error reading mock_db.json, re-seeding...');
    }
  }
  
  mockDb.projects = DEFAULT_PROJECTS;
  mockDb.materials = loadCleanMaterialsJson();
  mockDb.requests = [];
  mockDb.notifications = [];
  mockDb.auditLogs = [{
    id: 'log-init',
    timestamp: new Date().toISOString(),
    userName: 'System',
    userRole: 'SUPER_ADMIN',
    action: 'SYSTEM_INITIALIZATION',
    entityType: 'System',
    entityId: 'INITIALIZE',
    details: 'Mock DB pre-seeded with May\'26 surplus inventory records (737 items, ₹5.21 Cr value).'
  }];
  saveMockDb();
  console.log('Mock DB initialized with pre-seeded datasets.');
};

// Seed MongoDB if empty
async function seedMongoDB() {
  try {
    const projCount = await Project.countDocuments();
    if (projCount === 0) {
      await Project.insertMany(DEFAULT_PROJECTS);
      const mats = loadCleanMaterialsJson();
      await Material.insertMany(mats);
      
      const initLog = new AuditLog({
        id: 'log-init',
        timestamp: new Date(),
        userName: 'System',
        userRole: 'SUPER_ADMIN',
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'System',
        entityId: 'INITIALIZE',
        details: 'MongoDB pre-seeded with May\'26 surplus inventory records (737 items, ₹5.21 Cr value).'
      });
      await initLog.save();
      console.log('MongoDB successfully seeded with projects and materials.');
    }
  } catch (error) {
    console.error('Error seeding MongoDB:', error);
  }
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected successfully at:', MONGODB_URI);
    seedMongoDB();
  })
  .catch(err => {
    console.warn('\n==================================================================');
    console.warn('WARNING: Failed to connect to MongoDB server.');
    console.warn('Mongoose threw:', err.message);
    console.warn('Falling back to LOCAL JSON-FILE database mock (backend/mock_db.json).');
    console.warn('The portal will remain 100% functional without a running MongoDB server!');
    console.warn('==================================================================\n');
    useMockDb = true;
    initializeMockDb();
  });

// API ROUTE HANDLERS

// 1. Projects API
app.get('/api/projects', async (req, res) => {
  if (useMockDb) {
    return res.json(mockDb.projects);
  }
  try {
    const projCount = await Project.countDocuments();
    if (projCount === 0) {
      await seedMongoDB();
    }
    const list = await Project.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  const p = req.body;
  const projectData = {
    ...p,
    id: p.id || p.jobCode,
    isActive: true
  };

  if (useMockDb) {
    const exists = mockDb.projects.find(proj => proj.id === projectData.id);
    if (exists) {
      return res.status(400).json({ error: 'Project with this Job Code already exists.' });
    }
    mockDb.projects.unshift(projectData);
    
    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: req.headers['x-user-name'] || 'System',
      userRole: req.headers['x-user-role'] || 'SUPER_ADMIN',
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: projectData.id,
      details: `Created new project site: ${projectData.name} (${projectData.location}) with Job Value: ${projectData.jobValue} Cr.`
    });
    
    saveMockDb();
    return res.json(projectData);
  }

  try {
    const exists = await Project.findOne({ id: projectData.id });
    if (exists) {
      return res.status(400).json({ error: 'Project with this Job Code already exists.' });
    }
    const project = new Project(projectData);
    await project.save();
    
    const log = new AuditLog({
      id: `log-${Date.now()}`,
      userName: req.headers['x-user-name'] || 'System',
      userRole: req.headers['x-user-role'] || 'SUPER_ADMIN',
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: projectData.id,
      details: `Created new project site: ${projectData.name} (${projectData.location}) with Job Value: ${projectData.jobValue} Cr.`
    });
    await log.save();
    
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Materials API
app.get('/api/materials', async (req, res) => {
  if (useMockDb) {
    return res.json(mockDb.materials);
  }
  try {
    const projCount = await Project.countDocuments();
    if (projCount === 0) {
      await seedMongoDB();
    }
    const list = await Material.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/materials', async (req, res) => {
  const m = req.body;
  const newId = `mat-${Date.now()}`;
  const materialData = {
    ...m,
    id: newId,
    status: 'AVAILABLE',
    availableQty: m.quantity,
    reservedQty: 0,
    consumedQty: 0,
    uploaderId: req.headers['x-user-id'] || 'usr-default',
    uploaderName: req.headers['x-user-name'] || 'Uploader'
  };

  if (useMockDb) {
    mockDb.materials.unshift(materialData);
    
    // Add audit log
    const log = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: req.headers['x-user-name'] || 'System',
      userRole: req.headers['x-user-role'] || 'SUPER_ADMIN',
      action: 'MATERIAL_ADDED',
      entityType: 'Material',
      entityId: newId,
      details: `Declared surplus: ${m.quantity} ${m.uom} of ${m.description} at project ${m.projectId}.`,
      newValue: materialData
    };
    mockDb.auditLogs.unshift(log);
    
    // Add notification
    const notif = {
      id: `notif-${Date.now()}`,
      title: 'New Surplus Declared',
      message: `${m.quantity} ${m.uom} of ${m.description} has been declared surplus at site ${m.projectId}.`,
      type: 'NEW_SURPLUS',
      isRead: false,
      entityId: newId,
      createdAt: new Date().toISOString()
    };
    mockDb.notifications.unshift(notif);
    
    saveMockDb();
    return res.json(materialData);
  }

  try {
    const material = new Material(materialData);
    await material.save();
    
    const log = new AuditLog({
      id: `log-${Date.now()}`,
      userName: req.headers['x-user-name'] || 'System',
      userRole: req.headers['x-user-role'] || 'SUPER_ADMIN',
      action: 'MATERIAL_ADDED',
      entityType: 'Material',
      entityId: newId,
      details: `Declared surplus: ${m.quantity} ${m.uom} of ${m.description} at project ${m.projectId}.`,
      newValue: materialData
    });
    await log.save();
    
    const notif = new Notification({
      id: `notif-${Date.now()}`,
      title: 'New Surplus Declared',
      message: `${m.quantity} ${m.uom} of ${m.description} has been declared surplus at site ${m.projectId}.`,
      type: 'NEW_SURPLUS',
      entityId: newId
    });
    await notif.save();

    res.json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/materials/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (useMockDb) {
    let found = null;
    mockDb.materials = mockDb.materials.map(m => {
      if (m.id === id) {
        found = { ...m, ...updates };
        
        mockDb.auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userName: req.headers['x-user-name'] || 'System',
          userRole: req.headers['x-user-role'] || 'SUPER_ADMIN',
          action: 'MATERIAL_UPDATED',
          entityType: 'Material',
          entityId: id,
          details: `Updated material details for ${m.description}.`,
          prevValue: m,
          newValue: found
        });
        
        return found;
      }
      return m;
    });
    saveMockDb();
    return res.json(found);
  }

  try {
    const prev = await Material.findOne({ id });
    const next = await Material.findOneAndUpdate({ id }, { $set: updates }, { new: true });
    
    const log = new AuditLog({
      id: `log-${Date.now()}`,
      userName: req.headers['x-user-name'] || 'System',
      userRole: req.headers['x-user-role'] || 'SUPER_ADMIN',
      action: 'MATERIAL_UPDATED',
      entityType: 'Material',
      entityId: id,
      details: `Updated material details for ${next.description}.`,
      prevValue: prev,
      newValue: next
    });
    await log.save();
    
    res.json(next);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/materials/:id', async (req, res) => {
  const { id } = req.params;

  if (useMockDb) {
    const prev = mockDb.materials.find(m => m.id === id);
    if (!prev) return res.status(404).json({ error: 'Not found' });
    
    mockDb.materials = mockDb.materials.filter(m => m.id !== id);
    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: req.headers['x-user-name'] || 'System',
      userRole: req.headers['x-user-role'] || 'SUPER_ADMIN',
      action: 'MATERIAL_DELETED',
      entityType: 'Material',
      entityId: id,
      details: `Removed material: ${prev.description} from inventory declarations.`,
      prevValue: prev
    });
    saveMockDb();
    return res.json({ success: true });
  }

  try {
    const prev = await Material.findOne({ id });
    await Material.findOneAndDelete({ id });
    
    const log = new AuditLog({
      id: `log-${Date.now()}`,
      userName: req.headers['x-user-name'] || 'System',
      userRole: req.headers['x-user-role'] || 'SUPER_ADMIN',
      action: 'MATERIAL_DELETED',
      entityType: 'Material',
      entityId: id,
      details: `Removed material: ${prev.description} from inventory declarations.`,
      prevValue: prev
    });
    await log.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/materials/bulk', async (req, res) => {
  const newMaterials = req.body;
  let inserted = 0;
  let skipped = 0;
  const addedList = [];

  for (let i = 0; i < newMaterials.length; i++) {
    const m = newMaterials[i];
    if (!m.description || m.quantity <= 0) {
      skipped++;
      continue;
    }
    const newId = `mat-${Date.now()}-${i}`;
    const materialData = {
      ...m,
      id: newId,
      status: 'AVAILABLE',
      availableQty: m.quantity,
      reservedQty: 0,
      consumedQty: 0,
      uploaderId: req.headers['x-user-id'] || 'usr-default',
      uploaderName: req.headers['x-user-name'] || 'Uploader'
    };
    addedList.push(materialData);
    inserted++;
  }

  if (inserted > 0) {
    if (useMockDb) {
      mockDb.materials = [...addedList, ...mockDb.materials];
      mockDb.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userName: req.headers['x-user-name'] || 'System',
        userRole: req.headers['x-user-role'] || 'SUPER_ADMIN',
        action: 'BULK_UPLOAD_COMPLETED',
        entityType: 'Material',
        entityId: 'BULK',
        details: `Excel import completed: Inserted ${inserted} items, skipped ${skipped}.`
      });
      mockDb.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Bulk Import Completed',
        message: `Imported ${inserted} new items into the surplus portal.`,
        type: 'NEW_SURPLUS',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      saveMockDb();
    } else {
      try {
        await Material.insertMany(addedList);
        const log = new AuditLog({
          id: `log-${Date.now()}`,
          userName: req.headers['x-user-name'] || 'System',
          userRole: req.headers['x-user-role'] || 'SUPER_ADMIN',
          action: 'BULK_UPLOAD_COMPLETED',
          entityType: 'Material',
          entityId: 'BULK',
          details: `Excel import completed: Inserted ${inserted} items, skipped ${skipped}.`
        });
        await log.save();
        const notif = new Notification({
          id: `notif-${Date.now()}`,
          title: 'Bulk Import Completed',
          message: `Imported ${inserted} new items into the surplus portal.`,
          type: 'NEW_SURPLUS'
        });
        await notif.save();
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }
  }

  res.json({ inserted, skipped });
});

// 3. Requests API (State Machine)
app.get('/api/requests', async (req, res) => {
  if (useMockDb) {
    return res.json(mockDb.requests);
  }
  try {
    const list = await MaterialRequest.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests', async (req, res) => {
  const reqData = req.body;
  const reqId = `req-${Date.now()}`;
  
  if (useMockDb) {
    const mat = mockDb.materials.find(m => m.id === reqData.materialId);
    if (!mat || reqData.requestedQty > mat.availableQty) {
      return res.status(400).json({ error: 'Requested quantity exceeds stock availability.' });
    }

    const newSeq = mockDb.requests.length + 1;
    const reqNo = `REQ-2026-${String(newSeq).padStart(4, '0')}`;

    const newRequest = {
      ...reqData,
      id: reqId,
      requestNumber: reqNo,
      requestedById: req.headers['x-user-id'] || 'usr-default',
      requestedByName: req.headers['x-user-name'] || 'Requester',
      status: 'REQUESTED',
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockDb.requests.unshift(newRequest);
    
    // Update material status
    mockDb.materials = mockDb.materials.map(m => {
      if (m.id === reqData.materialId) {
        return { ...m, status: 'REQUESTED' };
      }
      return m;
    });

    // Audit Log
    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: req.headers['x-user-name'] || 'Requester',
      userRole: req.headers['x-user-role'] || 'REQUESTING_PROJECT',
      action: 'REQUEST_RAISED',
      entityType: 'MaterialRequest',
      entityId: reqId,
      details: `Raised transfer request ${reqNo} for ${reqData.requestedQty} ${mat.uom} of ${mat.description}.`
    });

    // Notify source owner
    mockDb.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Transfer Request Received',
      message: `Project ${reqData.destinationProjectId} has requested ${reqData.requestedQty} ${mat.uom} of ${mat.description}. Approval required.`,
      type: 'REQUEST_RAISED',
      isRead: false,
      entityId: reqId,
      createdAt: new Date().toISOString()
    });

    saveMockDb();
    return res.json(newRequest);
  }

  try {
    const mat = await Material.findOne({ id: reqData.materialId });
    if (!mat || reqData.requestedQty > mat.availableQty) {
      return res.status(400).json({ error: 'Requested quantity exceeds stock availability.' });
    }

    const count = await MaterialRequest.countDocuments();
    const reqNo = `REQ-2026-${String(count + 1).padStart(4, '0')}`;

    const newRequest = new MaterialRequest({
      ...reqData,
      id: reqId,
      requestNumber: reqNo,
      requestedById: req.headers['x-user-id'] || 'usr-default',
      requestedByName: req.headers['x-user-name'] || 'Requester',
      status: 'REQUESTED',
      comments: []
    });
    await newRequest.save();

    await Material.findOneAndUpdate({ id: reqData.materialId }, { status: 'REQUESTED' });

    const log = new AuditLog({
      id: `log-${Date.now()}`,
      userName: req.headers['x-user-name'] || 'Requester',
      userRole: req.headers['x-user-role'] || 'REQUESTING_PROJECT',
      action: 'REQUEST_RAISED',
      entityType: 'MaterialRequest',
      entityId: reqId,
      details: `Raised transfer request ${reqNo} for ${reqData.requestedQty} ${mat.uom} of ${mat.description}.`
    });
    await log.save();

    const notif = new Notification({
      id: `notif-${Date.now()}`,
      title: 'Transfer Request Received',
      message: `Project ${reqData.destinationProjectId} has requested ${reqData.requestedQty} ${mat.uom} of ${mat.description}. Approval required.`,
      type: 'REQUEST_RAISED',
      entityId: reqId
    });
    await notif.save();

    res.json(newRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post comment/chat message inside request
app.post('/api/requests/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const comment = {
    senderId: req.headers['x-user-id'] || 'usr-default',
    senderName: req.headers['x-user-name'] || 'User',
    text,
    timestamp: new Date()
  };

  if (useMockDb) {
    let found = null;
    mockDb.requests = mockDb.requests.map(r => {
      if (r.id === id) {
        found = { ...r };
        found.comments = [...(found.comments || []), { ...comment, timestamp: comment.timestamp.toISOString() }];
        found.updatedAt = new Date().toISOString();
        return found;
      }
      return r;
    });
    saveMockDb();
    if (!found) return res.status(404).json({ error: 'Request not found' });
    return res.json(found);
  }

  try {
    const updated = await MaterialRequest.findOneAndUpdate(
      { id },
      { 
        $push: { comments: comment },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/requests/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { approvedQty, remarks } = req.body;
  const approverName = req.headers['x-user-name'] || 'Approver';

  if (useMockDb) {
    const req = mockDb.requests.find(r => r.id === id);
    if (!req) return res.status(404).json({ error: 'Request not found' });
    
    const mat = mockDb.materials.find(m => m.id === req.materialId);
    if (!mat || approvedQty > mat.availableQty) {
      return res.status(400).json({ error: 'Quantity exceeds available inventory.' });
    }

    // Update Request
    const updatedRequest = {
      ...req,
      status: 'APPROVED',
      approvedQty,
      approverRemarks: remarks,
      approvedById: req.headers['x-user-id'] || 'usr-approver',
      approvedByName: approverName,
      updatedAt: new Date().toISOString()
    };

    mockDb.requests = mockDb.requests.map(r => r.id === id ? updatedRequest : r);

    // Update Material stock
    mockDb.materials = mockDb.materials.map(m => {
      if (m.id === req.materialId) {
        const nextAvail = m.availableQty - approvedQty;
        return {
          ...m,
          availableQty: nextAvail,
          reservedQty: m.reservedQty + approvedQty,
          status: nextAvail === 0 ? 'RESERVED' : 'AVAILABLE'
        };
      }
      return m;
    });

    // Log & notify
    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: approverName,
      userRole: req.headers['x-user-role'] || 'PROJECT_OWNER',
      action: 'REQUEST_APPROVED',
      entityType: 'MaterialRequest',
      entityId: id,
      details: `Request ${req.requestNumber} approved by ${approverName} for Qty: ${approvedQty}.`
    });

    mockDb.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Transfer Request Approved',
      message: `Your request ${req.requestNumber} for ${mat.description} was approved for ${approvedQty} ${mat.uom}.`,
      type: 'REQUEST_UPDATED',
      isRead: false,
      entityId: id,
      createdAt: new Date().toISOString()
    });

    saveMockDb();
    return res.json(updatedRequest);
  }

  try {
    const request = await MaterialRequest.findOne({ id });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const mat = await Material.findOne({ id: request.materialId });
    if (!mat || approvedQty > mat.availableQty) {
      return res.status(400).json({ error: 'Quantity exceeds available inventory.' });
    }

    const nextRequest = await MaterialRequest.findOneAndUpdate(
      { id },
      {
        $set: {
          status: 'APPROVED',
          approvedQty,
          approverRemarks: remarks,
          approvedById: req.headers['x-user-id'] || 'usr-approver',
          approvedByName: approverName,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    const nextAvail = mat.availableQty - approvedQty;
    await Material.findOneAndUpdate(
      { id: request.materialId },
      {
        $set: {
          availableQty: nextAvail,
          reservedQty: mat.reservedQty + approvedQty,
          status: nextAvail === 0 ? 'RESERVED' : 'AVAILABLE'
        }
      }
    );

    const log = new AuditLog({
      id: `log-${Date.now()}`,
      userName: approverName,
      userRole: req.headers['x-user-role'] || 'PROJECT_OWNER',
      action: 'REQUEST_APPROVED',
      entityType: 'MaterialRequest',
      entityId: id,
      details: `Request ${request.requestNumber} approved by ${approverName} for Qty: ${approvedQty}.`
    });
    await log.save();

    const notif = new Notification({
      id: `notif-${Date.now()}`,
      title: 'Transfer Request Approved',
      message: `Your request ${request.requestNumber} for ${mat.description} was approved for ${approvedQty} ${mat.uom}.`,
      type: 'REQUEST_UPDATED',
      entityId: id
    });
    await notif.save();

    res.json(nextRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/requests/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;
  const approverName = req.headers['x-user-name'] || 'Approver';

  if (useMockDb) {
    const req = mockDb.requests.find(r => r.id === id);
    if (!req) return res.status(404).json({ error: 'Request not found' });

    const updatedRequest = {
      ...req,
      status: 'REJECTED',
      approverRemarks: remarks,
      approvedById: req.headers['x-user-id'] || 'usr-approver',
      approvedByName: approverName,
      updatedAt: new Date().toISOString()
    };

    mockDb.requests = mockDb.requests.map(r => r.id === id ? updatedRequest : r);

    // Restore material status
    const otherReqs = mockDb.requests.filter(r => r.materialId === req.materialId && r.status === 'REQUESTED');
    mockDb.materials = mockDb.materials.map(m => {
      if (m.id === req.materialId) {
        return { ...m, status: otherReqs.length > 0 ? 'REQUESTED' : 'AVAILABLE' };
      }
      return m;
    });

    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: approverName,
      userRole: req.headers['x-user-role'] || 'PROJECT_OWNER',
      action: 'REQUEST_REJECTED',
      entityType: 'MaterialRequest',
      entityId: id,
      details: `Request ${req.requestNumber} rejected by ${approverName}. Reason: ${remarks}`
    });

    mockDb.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Transfer Request Rejected',
      message: `Your request ${req.requestNumber} was rejected. Reason: ${remarks}`,
      type: 'REQUEST_UPDATED',
      isRead: false,
      entityId: id,
      createdAt: new Date().toISOString()
    });

    saveMockDb();
    return res.json(updatedRequest);
  }

  try {
    const request = await MaterialRequest.findOne({ id });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const nextRequest = await MaterialRequest.findOneAndUpdate(
      { id },
      {
        $set: {
          status: 'REJECTED',
          approverRemarks: remarks,
          approvedById: req.headers['x-user-id'] || 'usr-approver',
          approvedByName: approverName,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    const otherReqs = await MaterialRequest.find({ materialId: request.materialId, status: 'REQUESTED' });
    await Material.findOneAndUpdate(
      { id: request.materialId },
      { $set: { status: otherReqs.length > 0 ? 'REQUESTED' : 'AVAILABLE' } }
    );

    const log = new AuditLog({
      id: `log-${Date.now()}`,
      userName: approverName,
      userRole: req.headers['x-user-role'] || 'PROJECT_OWNER',
      action: 'REQUEST_REJECTED',
      entityType: 'MaterialRequest',
      entityId: id,
      details: `Request ${request.requestNumber} rejected by ${approverName}. Reason: ${remarks}`
    });
    await log.save();

    const notif = new Notification({
      id: `notif-${Date.now()}`,
      title: 'Transfer Request Rejected',
      message: `Your request ${request.requestNumber} was rejected.`,
      type: 'REQUEST_UPDATED',
      entityId: id
    });
    await notif.save();

    res.json(nextRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/requests/:id/dispatch', async (req, res) => {
  const { id } = req.params;
  const details = req.body; // dispatchDate, transporter, vehicleNumber, lrNumber, dispatchedQty
  const userName = req.headers['x-user-name'] || 'User';

  if (useMockDb) {
    const req = mockDb.requests.find(r => r.id === id);
    if (!req) return res.status(404).json({ error: 'Request not found' });

    const updatedRequest = {
      ...req,
      ...details,
      status: 'DISPATCHED',
      updatedAt: new Date().toISOString()
    };

    mockDb.requests = mockDb.requests.map(r => r.id === id ? updatedRequest : r);

    // Update material status
    mockDb.materials = mockDb.materials.map(m => {
      if (m.id === req.materialId) {
        return { ...m, status: 'DISPATCHED' };
      }
      return m;
    });

    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName,
      userRole: req.headers['x-user-role'] || 'PROJECT_OWNER',
      action: 'REQUEST_DISPATCHED',
      entityType: 'MaterialRequest',
      entityId: id,
      details: `Request ${req.requestNumber} dispatched via vehicle ${details.vehicleNumber}.`
    });

    mockDb.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Material Dispatched',
      message: `Materials for request ${req.requestNumber} have been dispatched.`,
      type: 'REQUEST_UPDATED',
      isRead: false,
      entityId: id,
      createdAt: new Date().toISOString()
    });

    saveMockDb();
    return res.json(updatedRequest);
  }

  try {
    const request = await MaterialRequest.findOne({ id });
    const nextRequest = await MaterialRequest.findOneAndUpdate(
      { id },
      { $set: { ...details, status: 'DISPATCHED', updatedAt: new Date() } },
      { new: true }
    );

    await Material.findOneAndUpdate({ id: request.materialId }, { status: 'DISPATCHED' });

    const log = new AuditLog({
      id: `log-${Date.now()}`,
      userName,
      userRole: req.headers['x-user-role'] || 'PROJECT_OWNER',
      action: 'REQUEST_DISPATCHED',
      entityType: 'MaterialRequest',
      entityId: id,
      details: `Request ${request.requestNumber} dispatched via vehicle ${details.vehicleNumber}.`
    });
    await log.save();

    const notif = new Notification({
      id: `notif-${Date.now()}`,
      title: 'Material Dispatched',
      message: `Materials for request ${request.requestNumber} have been dispatched.`,
      type: 'REQUEST_UPDATED',
      entityId: id
    });
    await notif.save();

    res.json(nextRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/requests/:id/receive', async (req, res) => {
  const { id } = req.params;
  const userName = req.headers['x-user-name'] || 'User';

  if (useMockDb) {
    const req = mockDb.requests.find(r => r.id === id);
    if (!req) return res.status(404).json({ error: 'Request not found' });

    const qty = req.approvedQty || req.requestedQty;
    const updatedRequest = {
      ...req,
      status: 'RECEIVED',
      receivedQty: qty,
      updatedAt: new Date().toISOString()
    };

    mockDb.requests = mockDb.requests.map(r => r.id === id ? updatedRequest : r);

    mockDb.materials = mockDb.materials.map(m => {
      if (m.id === req.materialId) {
        return { ...m, status: 'RECEIVED' };
      }
      return m;
    });

    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName,
      userRole: req.headers['x-user-role'] || 'REQUESTING_PROJECT',
      action: 'REQUEST_RECEIVED',
      entityType: 'MaterialRequest',
      entityId: id,
      details: `Request ${req.requestNumber} received at site. Qty: ${qty}`
    });

    mockDb.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Materials Received',
      message: `Project ${req.destinationProjectId} confirmed receipt for request ${req.requestNumber}.`,
      type: 'REQUEST_UPDATED',
      isRead: false,
      entityId: id,
      createdAt: new Date().toISOString()
    });

    saveMockDb();
    return res.json(updatedRequest);
  }

  try {
    const request = await MaterialRequest.findOne({ id });
    const qty = request.approvedQty || request.requestedQty;

    const nextRequest = await MaterialRequest.findOneAndUpdate(
      { id },
      { $set: { status: 'RECEIVED', receivedQty: qty, updatedAt: new Date() } },
      { new: true }
    );

    await Material.findOneAndUpdate({ id: request.materialId }, { status: 'RECEIVED' });

    const log = new AuditLog({
      id: `log-${Date.now()}`,
      userName,
      userRole: req.headers['x-user-role'] || 'REQUESTING_PROJECT',
      action: 'REQUEST_RECEIVED',
      entityType: 'MaterialRequest',
      entityId: id,
      details: `Request ${request.requestNumber} received at site. Qty: ${qty}`
    });
    await log.save();

    const notif = new Notification({
      id: `notif-${Date.now()}`,
      title: 'Materials Received',
      message: `Project ${request.destinationProjectId} confirmed receipt for request ${request.requestNumber}.`,
      type: 'REQUEST_UPDATED',
      entityId: id
    });
    await notif.save();

    res.json(nextRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/requests/:id/consume', async (req, res) => {
  const { id } = req.params;
  const { qty } = req.body;
  const userName = req.headers['x-user-name'] || 'User';

  if (useMockDb) {
    const req = mockDb.requests.find(r => r.id === id);
    if (!req) return res.status(404).json({ error: 'Request not found' });

    const updatedRequest = {
      ...req,
      status: 'CONSUMED',
      consumedQty: qty,
      updatedAt: new Date().toISOString()
    };

    mockDb.requests = mockDb.requests.map(r => r.id === id ? updatedRequest : r);

    // Update material quantities
    mockDb.materials = mockDb.materials.map(m => {
      if (m.id === req.materialId) {
        const approved = req.approvedQty || req.requestedQty;
        const nextReserved = Math.max(0, m.reservedQty - approved);
        return {
          ...m,
          reservedQty: nextReserved,
          consumedQty: m.consumedQty + qty,
          status: m.availableQty === 0 && nextReserved <= 0 ? 'CONSUMED' : m.status
        };
      }
      return m;
    });

    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName,
      userRole: req.headers['x-user-role'] || 'REQUESTING_PROJECT',
      action: 'MATERIAL_CONSUMED',
      entityType: 'MaterialRequest',
      entityId: id,
      details: `Request ${req.requestNumber} marked as consumed. Installed Qty: ${qty}`
    });

    saveMockDb();
    return res.json(updatedRequest);
  }

  try {
    const request = await MaterialRequest.findOne({ id });
    const nextRequest = await MaterialRequest.findOneAndUpdate(
      { id },
      { $set: { status: 'CONSUMED', consumedQty: qty, updatedAt: new Date() } },
      { new: true }
    );

    const mat = await Material.findOne({ id: request.materialId });
    const approved = request.approvedQty || request.requestedQty;
    const nextReserved = Math.max(0, mat.reservedQty - approved);
    const finalStatus = mat.availableQty === 0 && nextReserved <= 0 ? 'CONSUMED' : mat.status;
    
    await Material.findOneAndUpdate(
      { id: request.materialId },
      {
        $set: {
          reservedQty: nextReserved,
          consumedQty: mat.consumedQty + qty,
          status: finalStatus
        }
      }
    );

    const log = new AuditLog({
      id: `log-${Date.now()}`,
      userName,
      userRole: req.headers['x-user-role'] || 'REQUESTING_PROJECT',
      action: 'MATERIAL_CONSUMED',
      entityType: 'MaterialRequest',
      entityId: id,
      details: `Request ${request.requestNumber} marked as consumed. Installed Qty: ${qty}`
    });
    await log.save();

    res.json(nextRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Notifications API
app.get('/api/notifications', async (req, res) => {
  if (useMockDb) {
    return res.json(mockDb.notifications);
  }
  try {
    const list = await Notification.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/read', async (req, res) => {
  if (useMockDb) {
    mockDb.notifications = mockDb.notifications.map(n => ({ ...n, isRead: true }));
    saveMockDb();
    return res.json({ success: true });
  }
  try {
    await Notification.updateMany({}, { $set: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications', async (req, res) => {
  if (useMockDb) {
    mockDb.notifications = [];
    saveMockDb();
    return res.json({ success: true });
  }
  try {
    await Notification.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Audit Logs API
app.get('/api/audit', async (req, res) => {
  if (useMockDb) {
    return res.json(mockDb.auditLogs);
  }
  try {
    const list = await AuditLog.find().sort({ timestamp: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Reset API
app.post('/api/reset', async (req, res) => {
  if (useMockDb) {
    mockDb.materials = loadCleanMaterialsJson();
    mockDb.requests = [];
    mockDb.notifications = [];
    mockDb.auditLogs = [{
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: 'System',
      userRole: 'SUPER_ADMIN',
      action: 'SYSTEM_RESET',
      entityType: 'System',
      entityId: 'ALL',
      details: 'Mock DB reset: pre-seeded with original May\'26 datasets (737 items, ₹5.21 Cr).'
    }];
    saveMockDb();
    return res.json({ success: true });
  }

  try {
    await Project.deleteMany({});
    await Material.deleteMany({});
    await MaterialRequest.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});
    
    await Project.insertMany(DEFAULT_PROJECTS);
    const mats = loadCleanMaterialsJson();
    await Material.insertMany(mats);
    
    const resetLog = new AuditLog({
      id: `log-${Date.now()}`,
      userName: 'System',
      userRole: 'SUPER_ADMIN',
      action: 'SYSTEM_RESET',
      entityType: 'System',
      entityId: 'ALL',
      details: 'Database reset: pre-seeded with original May\'26 datasets (737 items, ₹5.21 Cr).'
    });
    await resetLog.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static assets from frontend build in production
const frontendDistPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
