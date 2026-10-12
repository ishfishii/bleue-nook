import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Expense, ExpenseValues } from '../constants/expenses';
import type { InventoryCategory, InventoryItem } from '../constants/inventory';
import { daysAgo, toISO } from '../lib/date';

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---------- sample data: replace with real storage later ----------
const lastMonth = new Date();
const SEED_EXPENSES: Expense[] = [
  { id: '1', name: 'Coffee beans', amount: 520, category: 'Groceries', payment: 'Cash', date: daysAgo(0) },
  { id: '2', name: 'Electricity', amount: 3260, category: 'Bills', payment: 'Card', date: daysAgo(2) },
  { id: '3', name: 'Coffee', amount: 185, category: 'Dining', payment: 'Card', date: daysAgo(3) },
  { id: '4', name: 'Lunch', amount: 320, category: 'Dining', payment: 'Cash', date: daysAgo(3) },
  { id: '5', name: 'Pharmacy', amount: 460, category: 'Other', payment: 'Cash', date: daysAgo(4) },
  {
    id: '6',
    name: 'Internet',
    amount: 1499,
    category: 'Bills',
    payment: 'Card',
    date: toISO(new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 18)),
  },
];

const SEED_INVENTORY: InventoryItem[] = [
  { id: 'i1', name: 'Coffee beans', category: null, quantity: 1, addedOn: daysAgo(0), expenseId: '1' },
  { id: 'i2', name: 'Dish soap', category: 'Cleaning supplies', quantity: 1, addedOn: daysAgo(6) },
  { id: 'i3', name: 'Rice 5kg', category: 'Food', quantity: 3, addedOn: daysAgo(8) },
  { id: 'i4', name: 'Canned tuna', category: 'Food', quantity: 6, addedOn: daysAgo(8) },
  { id: 'i5', name: 'Shampoo', category: 'Toiletries', quantity: 2, addedOn: daysAgo(10) },
  { id: 'i6', name: 'Toothpaste', category: 'Toiletries', quantity: 4, addedOn: daysAgo(10) },
  { id: 'i7', name: 'AA batteries', category: 'Electronics', quantity: 2, addedOn: daysAgo(14) },
  { id: 'i8', name: 'Printer paper', category: 'Others', quantity: 2, addedOn: daysAgo(20) },
];

// ---------- store ----------
type ItemPatch = Partial<{ name: string; category: InventoryCategory | null; quantity: number }>;

type Store = {
  expenses: Expense[];
  inventory: InventoryItem[];
  // Both return the inventory item that was created from the expense, or null if none was
  addExpense: (values: ExpenseValues) => InventoryItem | null;
  updateExpense: (id: string, values: ExpenseValues) => InventoryItem | null;
  updateItem: (id: string, patch: ItemPatch) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(SEED_EXPENSES);
  const [inventory, setInventory] = useState<InventoryItem[]>(SEED_INVENTORY);

  // A Groceries expense becomes an uncategorized inventory item
  const addToInventory = useCallback((expense: Expense) => {
    const item: InventoryItem = {
      id: uid(),
      name: expense.name,
      category: null,
      quantity: 1,
      addedOn: expense.date,
      expenseId: expense.id,
    };
    setInventory((list) => [item, ...list]);
    return item;
  }, []);

  const updateItem = useCallback((id: string, patch: ItemPatch) => {
    setInventory((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const addExpense = useCallback(
    (values: ExpenseValues) => {
      const expense: Expense = { id: uid(), ...values, date: daysAgo(0) };
      setExpenses((list) => [expense, ...list]);
      return values.category === 'Groceries' ? addToInventory(expense) : null;
    },
    [addToInventory],
  );

  const updateExpense = useCallback(
    (id: string, values: ExpenseValues) => {
      const old = expenses.find((e) => e.id === id);
      if (!old) return null;
      const updated: Expense = { ...old, ...values };
      setExpenses((list) => list.map((e) => (e.id === id ? updated : e)));

      const linked = inventory.find((i) => i.expenseId === id);
      if (linked) {
        // Keep the item's name in step, unless it was renamed in the inventory
        if (linked.name === old.name && values.name !== old.name) updateItem(linked.id, { name: values.name });
        return null;
      }
      // Edited into Groceries and not in the inventory yet
      return values.category === 'Groceries' ? addToInventory(updated) : null;
    },
    [expenses, inventory, addToInventory, updateItem],
  );

  const value = useMemo(
    () => ({ expenses, inventory, addExpense, updateExpense, updateItem }),
    [expenses, inventory, addExpense, updateExpense, updateItem],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
