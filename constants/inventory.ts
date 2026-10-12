export type InventoryCategory = 'Food' | 'Toiletries' | 'Cleaning supplies' | 'Electronics' | 'Others';

export type InventoryItem = {
  id: string;
  name: string;
  category: InventoryCategory | null;
  quantity: number;
  status?: string;
  dateOpened?: string | null;
  storageYears?: number | null;
  storageMonths?: number | null;
  storageDays?: number | null;
  expirationDate?: string | null;
};

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  'Food',
  'Toiletries',
  'Cleaning supplies',
  'Electronics',
  'Others',
];

// Items at or below this quantity count as "running low"
export const LOW_STOCK = 2;
