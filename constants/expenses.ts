export type Category = 'Groceries' | 'Bills' | 'Dining' | 'Other';
export type Payment = 'Cash' | 'Card';

export type Expense = {
  id: string;
  name: string;
  amount: number;
  category: Category;
  payment: Payment;
  date: string; // YYYY-MM-DD, local time
};

export const CATEGORIES: Category[] = ['Groceries', 'Bills', 'Dining', 'Other'];
export const PAYMENTS: Payment[] = ['Cash', 'Card'];

export type ExpenseValues = Pick<Expense, 'name' | 'amount' | 'category' | 'payment'>;
