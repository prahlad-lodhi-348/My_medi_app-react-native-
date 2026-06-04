import { apiClient } from '../core/api/client';
import type {
  CalendarDay,
  Regimen,
} from '../core/types/regimen';

import type {
  DoseTakeInput,
  RegimenCreateInput,
  RegimenUpdateInput,
  StockAlert,
  StockRestockInput,
} from '../core/types/regimenApi';


// NOTE:
// - We intentionally use apiClient so every request includes:
//   Authorization: Token <token>
// - We also intentionally do not hardcode BASE_URL; apiClient uses it.

// Backend route conventions (DRF-style) are inferred from your existing auth routes:
// auth/login/, auth/register/, auth/me/
// If your backend uses different route paths, adjust them here.

// Utility: normalize list responses that may come as { results: T[] } or T[]
function normalizeResults<T>(data: { results: T[] } | T[]): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as any).results)) {
    return (data as any).results;
  }
  return [];
}

export type RegimensResponse = { results: Regimen[] } | Regimen[];
export type StockStatusResponse =
  | { results: Array<{ regimen_id: number; current_quantity: number }> }
  | Array<{ regimen_id: number; current_quantity: number }>;

export type CalendarRangeResponse =
  | { days: CalendarDay[] }
  | CalendarDay[];

export type LowStockAlertsResponse = { results: StockAlert[] } | StockAlert[];

export type MarkDoseTakenResponse = {
  // Adjust based on backend response shape
  success?: boolean;
  id?: number;
};

export type MarkDoseMissedResponse = {
  // Adjust based on backend response shape
  success?: boolean;
  id?: number;
};

/** Regimens CRUD */
export const getRegimens = async (): Promise<Regimen[]> => {
  const data = await apiClient.request<RegimensResponse>({
    method: 'GET',
    url: 'regimens/',
  });
  return normalizeResults<Regimen>(data);
};

export const createRegimen = async (
  input: RegimenCreateInput
): Promise<Regimen> => {
  // Common DRF patterns: POST /regimens/
  return apiClient.request<Regimen>({
    method: 'POST',
    url: 'regimens/',
    data: input,
  });
};

export const updateRegimen = async (
  regimenId: number,
  input: RegimenUpdateInput
): Promise<Regimen> => {
  return apiClient.request<Regimen>({
    method: 'PATCH',
    url: `regimens/${regimenId}/`,
    data: input,
  });
};

export const deleteRegimen = async (regimenId: number): Promise<void> => {
  await apiClient.request<void>({
    method: 'DELETE',
    url: `regimens/${regimenId}/`,
  });
};

/** Restock */
export const restockRegimen = async (
  regimenId: number,
  input: StockRestockInput
): Promise<{
  regimen_id: number;
  current_quantity: number;
  low_stock_threshold?: number;
}> => {
  // Common pattern: POST /regimens/:id/restock/
  return apiClient.request({
    method: 'POST',
    url: `regimens/${regimenId}/restock/`,
    data: input,
  });
};

/** Stock status */
export const getStockStatus = async (
  regimenIds?: number[]
): Promise<Array<{ regimen_id: number; current_quantity: number }>> => {
  const url = 'stock/status/';
  const data = await apiClient.request<StockStatusResponse>({
    method: 'GET',
    url,
    params: regimenIds && regimenIds.length ? { regimen_ids: regimenIds } : undefined,
  });

  if (Array.isArray(data)) return data;
  return (data as any).results ?? [];
};

/** Low stock alerts */
export const getLowStockAlerts = async (): Promise<StockAlert[]> => {
  const data = await apiClient.request<LowStockAlertsResponse>({
    method: 'GET',
    url: 'stock/alerts/low/',
  });

  return normalizeResults<StockAlert>(data);
};

/** Calendar range */
export const getCalendarRange = async (params: {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}): Promise<CalendarDay[]> => {
  const data = await apiClient.request<CalendarRangeResponse>({
    method: 'GET',
    url: 'calendar/range/',
    params: {
      start_date: params.startDate,
      end_date: params.endDate,
    },
  });

  if (Array.isArray(data)) return data;
  return (data as any).days ?? [];
};

/** Mark dose taken / missed */
export const markDoseTaken = async (
  doseTimeId: number,
  payload?: DoseTakeInput
): Promise<MarkDoseTakenResponse> => {
  return apiClient.request<MarkDoseTakenResponse>({
    method: 'POST',
    url: `doses/${doseTimeId}/taken/`,
    data: payload ?? {},
  });
};

export const markDoseMissed = async (
  doseTimeId: number
): Promise<MarkDoseMissedResponse> => {
  return apiClient.request<MarkDoseMissedResponse>({
    method: 'POST',
    url: `doses/${doseTimeId}/missed/`,
    data: {},
  });
};

export type { CalendarDay, Regimen };


