// ─── Group Trip Types ─────────────────────────────────────────────────────────

import type { UUID, ISODateTimeString, MoneyAmount } from './common';

// ─── Voting ───────────────────────────────────────────────────────────────────

export type VoteItemType = 'destination' | 'date_range' | 'hotel' | 'activity' | 'flight' | 'custom';

export type VoteStatus = 'open' | 'closed' | 'decided';

export interface VoteOption {
  id: UUID;
  label: string;
  description: string | null;
  imageUrl: string | null;
  metadata: Record<string, unknown>;
  votes: UUID[]; // user IDs who voted
  voteCount: number;
}

export interface GroupVote {
  id: UUID;
  tripId: UUID;
  createdBy: UUID;
  title: string;
  description: string | null;
  type: VoteItemType;
  options: VoteOption[];
  status: VoteStatus;
  decidedOptionId: UUID | null;
  deadline: ISODateTimeString | null;
  allowMultiple: boolean;
  anonymousVoting: boolean;
  createdAt: ISODateTimeString;
  closedAt: ISODateTimeString | null;
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'accommodation'
  | 'food'
  | 'transport'
  | 'activities'
  | 'shopping'
  | 'flights'
  | 'miscellaneous';

export type SplitMethod = 'equal' | 'custom' | 'by_consumption' | 'percentage';

export interface ExpenseSplit {
  userId: UUID;
  displayName: string;
  amount: MoneyAmount;
  percentage: number;
}

export interface GroupExpense {
  id: UUID;
  tripId: UUID;
  paidBy: UUID;
  paidByName: string;
  title: string;
  description: string | null;
  category: ExpenseCategory;
  amount: MoneyAmount;
  splits: ExpenseSplit[];
  splitMethod: SplitMethod;
  receiptUrl: string | null;
  date: string; // YYYY-MM-DD
  isSettled: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

// ─── Settlement ───────────────────────────────────────────────────────────────

export interface SettlementBalance {
  fromUserId: UUID;
  fromUserName: string;
  toUserId: UUID;
  toUserName: string;
  amount: MoneyAmount;
  isSettled: boolean;
}

export interface GroupSettlementSummary {
  tripId: UUID;
  totalExpenses: MoneyAmount;
  perPersonShare: MoneyAmount;
  balances: SettlementBalance[];
  settledAt: ISODateTimeString | null;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateVoteDTO {
  title: string;
  description?: string;
  type: VoteItemType;
  options: { label: string; description?: string; imageUrl?: string; metadata?: Record<string, unknown> }[];
  deadline?: ISODateTimeString;
  allowMultiple?: boolean;
  anonymousVoting?: boolean;
}

export interface CastVoteDTO {
  optionIds: UUID[];
}

export interface CreateExpenseDTO {
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  paidBy: UUID;
  splitMethod: SplitMethod;
  splits?: { userId: UUID; amount?: number; percentage?: number }[];
  receiptUrl?: string;
  date: string;
}

export interface SettleBalanceDTO {
  fromUserId: UUID;
  toUserId: UUID;
  amount: number;
  currency: string;
}
