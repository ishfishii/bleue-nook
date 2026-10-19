import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

// --- TypeScript Interfaces ---
export interface ExpenseItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  productLink?: string | null;
}

export interface Expense {
  id: string;
  merchantId: string;
  merchantName: string;
  totalAmount: number;
  categoryId: string;
  categoryName: string;
  autoInventory: boolean;
  categoryIcon?: string;
  orderReference?: string;
  date?: string;
  createdAt: string;
  items: ExpenseItem[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  lowStockThreshold: number;
  storageLocation: string | null;
  status: 'out' | 'low' | 'in_stock';
  lastPurchasedFrom: string | null;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  autoInventory: boolean;
  icon?: string;
}

export interface Merchant {
  id: string;
  name: string;
  type: string;
  platformUrl?: string | null;
}

// --- Helper to get headers with user ID ---
export const getAuthHeaders = async () => {
  try {
    const userJson = await AsyncStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    return {
      'Content-Type': 'application/json',
      ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
    };
  } catch (error) {
    console.error('Error reading user session:', error);
    return { 'Content-Type': 'application/json' };
  }
};

// --- API Methods ---

export const checkServerHealth = async (): Promise<{ ok: boolean } | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

export const fetchExpenses = async (): Promise<Expense[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/expenses`, { headers });
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

export const createExpense = async (data: {
  merchantId: string;
  categoryId: string;
  orderReference?: string;
  items: ExpenseItem[];
}) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create expense');
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

export const updateExpense = async (
  id: string,
  values: {
    merchantId: string;
    categoryId: string;
    orderReference?: string;
    items: { name: string; quantity: number; unitPrice: number }[];
  }
): Promise<Expense | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error('Failed to update expense');
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/inventory`, { headers });
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

// --- Category Management API ---
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/categories`, { headers });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

export const createCategory = async (values: { name: string; autoInventory: boolean }) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error('Failed to create category');
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

export const updateCategory = async (id: string, values: { name: string; autoInventory: boolean }) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error('Failed to update category');
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

// --- Merchant Management API ---
export const fetchMerchants = async (): Promise<Merchant[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/merchants`, { headers });
    if (!res.ok) throw new Error('Failed to fetch merchants');
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

export const createMerchant = async (name: string, type: string = 'Online'): Promise<Merchant | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/merchants`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, type }),
    });
    if (!res.ok) throw new Error('Failed to create merchant');
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};