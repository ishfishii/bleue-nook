export type InventoryCategory = 'Food' | 'Toiletries' | 'Cleaning supplies' | 'Electronics' | 'Others';

export type InventoryItem = {
  id: string;
  name: string;
  category: InventoryCategory | null; // null = not sorted yet
  quantity: number;
  addedOn: string; // YYYY-MM-DD
  expenseId?: string; // set when the item came from a Groceries expense
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
