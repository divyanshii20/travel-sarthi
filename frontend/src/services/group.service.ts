import { api } from './api';
import type { GroupVote, GroupExpense, GroupSettlementSummary } from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };

export const groupService = {
  async getVotes(tripId: string) {
    const res = await api.get<ApiResponse<GroupVote[]>>(`/group/${tripId}/votes`);
    return res.data;
  },

  async createVote(tripId: string, body: { question: string; options: string[]; expiresAt?: string }) {
    const res = await api.post<ApiResponse<GroupVote>>(`/group/${tripId}/votes`, body);
    return res.data;
  },

  async castVote(tripId: string, voteId: string, optionId: string) {
    const res = await api.post<ApiResponse<GroupVote>>(`/group/${tripId}/votes/${voteId}/cast`, { optionId });
    return res.data;
  },

  async getExpenses(tripId: string) {
    const res = await api.get<ApiResponse<GroupExpense[]>>(`/group/${tripId}/expenses`);
    return res.data;
  },

  async addExpense(
    tripId: string,
    body: {
      description: string;
      amount: number;
      currency: string;
      paidById: string;
      splitMethod: string;
      splits: Array<{ userId: string; amount: number }>;
    }
  ) {
    const res = await api.post<ApiResponse<GroupExpense>>(`/group/${tripId}/expenses`, body);
    return res.data;
  },

  async getSettlements(tripId: string) {
    const res = await api.get<ApiResponse<GroupSettlementSummary>>(`/group/${tripId}/settlements`);
    return res.data;
  },
};
