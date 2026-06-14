import { create } from 'zustand';
import materialsData from '../data/materials_clean.json';

// Types and Interfaces
export type UserRole = 'SUPER_ADMIN' | 'PROJECT_OWNER' | 'REQUESTING_PROJECT' | 'MANAGEMENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  projectId?: string; // Assigned project for project owners/requesters
}

export type Vertical = 'Buildings' | 'Factories' | 'Data Center' | 'Railway' | 'Substation';

export interface Project {
  id: string;
  jobCode: string;
  name: string;
  vertical: Vertical;
  location: string;
  jobValue: number;
  pocName?: string;
  pocContact?: string;
  pocEmail?: string;
  isActive: boolean;
}

export type MaterialStatus = 'AVAILABLE' | 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'RESERVED' | 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED' | 'CONSUMED' | 'CLOSED' | 'REJECTED';

export interface Material {
  id: string;
  projectId: string;
  materialGroup: string;
  description: string;
  specification?: string;
  make?: string;
  quantity: number;
  uom: string;
  unitRate: number;
  amountCr: number;
  declareDate: string;
  status: MaterialStatus;
  availableQty: number;
  reservedQty: number;
  consumedQty: number;
  photoLink?: string;
  uploaderId?: string;
  uploaderName?: string;
}

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface MaterialRequest {
  id: string;
  requestNumber: string;
  materialId: string;
  sourceProjectId: string;
  destinationProjectId: string;
  requestedById: string;
  requestedByName: string;
  approvedById?: string;
  approvedByName?: string;
  requestedQty: number;
  approvedQty?: number;
  dispatchedQty?: number;
  receivedQty?: number;
  priority: RequestPriority;
  purpose: string;
  remarks?: string;
  approverRemarks?: string;
  requiredDate?: string;
  status: MaterialStatus;
  createdAt: string;
  updatedAt: string;
  
  // Dispatch details
  dispatchDate?: string;
  vehicleNumber?: string;
  transporter?: string;
  lrNumber?: string;

  // Chat / Clarification thread
  comments?: {
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  prevValue?: any;
  newValue?: any;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string; // 'NEW_SURPLUS' | 'REQUEST_RAISED' | 'APPROVAL_PENDING' | 'REQUEST_UPDATED'
  isRead: boolean;
  entityId?: string;
  createdAt: string;
}

interface SMEPState {
  currentUser: User | null;
  usersList: User[];
  projects: Project[];
  materials: Material[];
  requests: MaterialRequest[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  fetchInitialData: () => Promise<void>;
  addProject: (project: Omit<Project, 'isActive'>) => Promise<void>;
  addMaterial: (material: Omit<Material, 'id' | 'availableQty' | 'reservedQty' | 'consumedQty'>) => Promise<void>;
  updateMaterial: (id: string, updates: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  bulkUploadExcel: (newMaterials: Omit<Material, 'id' | 'availableQty' | 'reservedQty' | 'consumedQty'>[]) => Promise<{ inserted: number; skipped: number }>;
  
  raiseRequest: (request: Omit<MaterialRequest, 'id' | 'requestNumber' | 'status' | 'createdAt' | 'updatedAt' | 'requestedById' | 'requestedByName'>) => Promise<string>;
  approveRequest: (id: string, approvedQty: number, remarks: string, approverName: string) => Promise<void>;
  rejectRequest: (id: string, remarks: string, approverName: string) => Promise<void>;
  dispatchRequest: (id: string, details: { dispatchDate: string; vehicleNumber: string; transporter: string; lrNumber: string; dispatchedQty: number }) => Promise<void>;
  receiveRequest: (id: string) => Promise<void>;
  consumeRequest: (id: string, qty: number) => Promise<void>;
  
  addComment: (requestId: string, text: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

// Default Seed Data
const DEFAULT_PROJECTS: Project[] = [
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
  { id: 'G20-36003', jobCode: 'G20-36003', name: 'PGCIL-SS86 Fatehgarh', vertical: 'Substation', location: 'Fatehgarh', jobValue: 189.07, pocName: 'Satish Kumar', pocContact: '9876543210', pocEmail: 'satish.k@bluestar.in', isActive: true },
];

const DEFAULT_USERS: User[] = [
  { id: 'usr-1', name: 'Twinkle (Super Admin)', email: 'twinkle.admin@bluestar.in', role: 'SUPER_ADMIN' },
  { id: 'usr-2', name: 'User1 (Project Manager)', email: 'user1.pm@bluestar.in', role: 'PROJECT_OWNER', projectId: 'G10-44040' },
  { id: 'usr-3', name: 'User2 (Project Manager)', email: 'user2.pm@bluestar.in', role: 'PROJECT_OWNER', projectId: 'G10-34010' },
];

const getLocalStorageData = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

const setLocalStorageData = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // ignore
  }
};

// API Client Helper
const apiFetch = async (url: string, options: RequestInit = {}): Promise<any> => {
  const currentUser = getLocalStorageData<User | null>('smep_currentUser', null);
  
  const headers = {
    'Content-Type': 'application/json',
    ...(currentUser ? {
      'x-user-id': currentUser.id,
      'x-user-name': currentUser.name,
      'x-user-role': currentUser.role
    } : {}),
    ...(options.headers || {})
  };
  
  const isDev = typeof window !== 'undefined' && window.location.port === '5173';
  const apiBase = isDev ? 'http://localhost:3001' : '';
  const res = await fetch(`${apiBase}${url}`, {
    ...options,
    headers
  });
  
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${res.status}`);
  }
  
  return res.json();
};

export const useStore = create<SMEPState>((set, get) => ({
  currentUser: getLocalStorageData<User | null>('smep_currentUser', null),
  usersList: DEFAULT_USERS,
  projects: DEFAULT_PROJECTS,
  materials: [],
  requests: [],
  notifications: [],
  auditLogs: [],
  isLoading: false,
  
  // Actions
  setCurrentUser: (user) => {
    set({ currentUser: user });
    if (user) {
      setLocalStorageData('smep_currentUser', user);
      get().fetchInitialData();
    } else {
      localStorage.removeItem('smep_currentUser');
      set({ materials: [], requests: [], notifications: [], auditLogs: [] });
    }
  },

  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const [projects, materials, requests, notifications, auditLogs] = await Promise.all([
        apiFetch('/api/projects'),
        apiFetch('/api/materials'),
        apiFetch('/api/requests'),
        apiFetch('/api/notifications'),
        apiFetch('/api/audit')
      ]);
      set({ projects, materials, requests, notifications, auditLogs });
    } catch (error) {
      console.error('Failed to load portal records:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addProject: async (project) => {
    try {
      await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(project)
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to add project:', error);
      throw error;
    }
  },

  addMaterial: async (material) => {
    try {
      await apiFetch('/api/materials', {
        method: 'POST',
        body: JSON.stringify(material)
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to add material:', error);
      throw error;
    }
  },

  updateMaterial: async (id, updates) => {
    try {
      await apiFetch(`/api/materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to update material:', error);
      throw error;
    }
  },

  deleteMaterial: async (id) => {
    try {
      await apiFetch(`/api/materials/${id}`, {
        method: 'DELETE'
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to delete material:', error);
      throw error;
    }
  },

  bulkUploadExcel: async (newMaterials) => {
    try {
      const response = await apiFetch('/api/materials/bulk', {
        method: 'POST',
        body: JSON.stringify(newMaterials)
      });
      await get().fetchInitialData();
      return response;
    } catch (error) {
      console.error('Failed to perform bulk upload:', error);
      throw error;
    }
  },

  raiseRequest: async (reqData) => {
    try {
      const response = await apiFetch('/api/requests', {
        method: 'POST',
        body: JSON.stringify(reqData)
      });
      await get().fetchInitialData();
      return response.requestNumber;
    } catch (error) {
      console.error('Failed to raise transfer request:', error);
      throw error;
    }
  },

  approveRequest: async (id, approvedQty, remarks, approverName) => {
    try {
      await apiFetch(`/api/requests/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ approvedQty, remarks })
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to approve request:', error);
      throw error;
    }
  },

  rejectRequest: async (id, remarks, approverName) => {
    try {
      await apiFetch(`/api/requests/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ remarks })
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to reject request:', error);
      throw error;
    }
  },

  dispatchRequest: async (id, details) => {
    try {
      await apiFetch(`/api/requests/${id}/dispatch`, {
        method: 'PUT',
        body: JSON.stringify(details)
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to dispatch request:', error);
      throw error;
    }
  },

  receiveRequest: async (id) => {
    try {
      await apiFetch(`/api/requests/${id}/receive`, {
        method: 'PUT'
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to receive request:', error);
      throw error;
    }
  },

  consumeRequest: async (id, qty) => {
    try {
      await apiFetch(`/api/requests/${id}/consume`, {
        method: 'PUT',
        body: JSON.stringify({ qty })
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to consume materials:', error);
      throw error;
    }
  },

  addComment: async (requestId, text) => {
    try {
      await apiFetch(`/api/requests/${requestId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      await apiFetch('/api/notifications/read', {
        method: 'PUT'
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  },

  clearNotifications: async () => {
    try {
      await apiFetch('/api/notifications', {
        method: 'DELETE'
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  },

  resetAllData: async () => {
    try {
      await apiFetch('/api/reset', {
        method: 'POST'
      });
      await get().fetchInitialData();
    } catch (error) {
      console.error('Failed to reset data:', error);
    }
  }
}));

// Run checkInit initially to fetch data if user is already logged in
const checkInit = () => {
  const store = useStore.getState();
  if (store.currentUser) {
    store.fetchInitialData();
  }
};
checkInit();
