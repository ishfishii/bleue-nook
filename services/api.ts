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

// ==========================================
// EXPENSE API SERVICES
// ==========================================

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

export const deleteExpense = async (id: string): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to delete expense');
    return true;
  } catch (error) {
    console.error('API Error:', error);
    return false;
  }
};

// ==========================================
// INVENTORY API SERVICES
// ==========================================

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

export const createInventoryItem = async (values: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/inventory`, {
    method: 'POST',
    headers,
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error('Failed to create inventory item');
  return res.json();
};

export const updateInventoryItem = async (id: string, values: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error('Failed to update inventory item');
  return res.json();
};

export const deleteInventoryItem = async (id: string): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to delete inventory item');
    return true;
  } catch (error) {
    console.error('API Error:', error);
    return false;
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

// ==========================================
// NUTRITION & USER PROFILE API SERVICES
// ==========================================

export interface UserProfileData {
  age: number;
  gender: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  primaryGoal: 'lose' | 'maintain' | 'gain';
}

export const api = {
  // 1. USER PROFILE & NUTRITION GOALS
  getUserProfile: async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/nutrition/profile`, { headers });
      
      if (res.status === 404 || res.status === 401) return null;
      
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.warn('Backend returned error:', res.status, errBody);
        return null;
      }
      
      return await res.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  updateUserProfile: async (profileData: UserProfileData) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/nutrition/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(profileData),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('Backend PUT Error:', res.status, errBody);
        throw new Error(`Failed to update profile (${res.status})`);
      }

      return await res.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  // 2. DAILY LOGS & MEALS
  getDailyLog: async (date: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/nutrition/log?date=${date}`, { headers });
      
      if (!res.ok) {
        console.warn('Could not fetch daily log, returning empty default');
        return { dailyLog: { id: null, log_date: date }, meals: [] };
      }
      
      return await res.json();
    } catch (error) {
      console.error('API Error in getDailyLog:', error);
      return { dailyLog: { id: null, log_date: date }, meals: [] };
    }
  },

  // AI Meal Recommendation Suggestion
  suggestMeal: async (payload: { 
    mealType: string; 
    remainingCalories: number; 
    remainingProtein: number; 
    remainingCarbs: number; 
    remainingFat: number 
  }) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/nutrition/suggest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to fetch AI meal suggestion');
      return await res.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  logMealItem: async (mealData: {
    date: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    foodName: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    servings: number;
  }) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/nutrition/log/item`, {
        method: 'POST',
        headers,
        body: JSON.stringify(mealData),
      });
      if (!res.ok) throw new Error('Failed to log meal item');
      return await res.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  addMealItem: async (mealData: {
    date: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    foodId?: string;
    foodName: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    servings: number;
  }) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/nutrition/meal`, {
        method: 'POST',
        headers,
        body: JSON.stringify(mealData),
      });
      if (!res.ok) throw new Error('Failed to log meal');
      return await res.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  updateMealItem: async (mealItemId: string, mealData: {
      foodName: string;
      servings: number;
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
    }) => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/nutrition/meal/${mealItemId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(mealData),
        });
        if (!res.ok) throw new Error('Failed to update meal');
        return await res.json();
      } catch (error) {
        console.error('API Error:', error);
        return null;
      }
  },

  deleteMealItem: async (mealItemId: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/nutrition/meal/${mealItemId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete meal');
      return await res.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  // 3. FOOD SEARCH
  searchFood: async (query: string) => {
    if (!query.trim()) return [];
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/nutrition/search?q=${encodeURIComponent(query)}`, {
        headers,
      });
      if (!res.ok) throw new Error('Food search failed');
      return await res.json();
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  searchBarcode: async (barcode: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/nutrition/barcode/${barcode}`, { headers });
      if (!res.ok) throw new Error('Barcode lookup failed');
      return await res.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },
};