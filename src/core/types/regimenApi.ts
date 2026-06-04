import { Medicine, Regimen, CalendarDay } from './regimen';


export type MedicineCreateInput = {
  name: string;
  image?: { uri: string; name?: string; type?: string } | null;
};

export type RegimenCreateInput = {
  name: string;
  medicine: { id?: number } & Partial<Medicine>;
  doses: Array<{
    time: string;
    quantity: number;
    label?: string;
  }>;
  stock: {
    quantity: number;
    low_stock_threshold: number;
  };
};

export type RegimenUpdateInput = Partial<RegimenCreateInput> & {
  id?: number;
};

export type StockRestockInput = {
  quantity: number;
};

export type StockAlert = {
  id: number;
  regimen_id: number;
  threshold: number;
  current_quantity: number;
  created_at?: string;
  notified?: boolean;
};

export type RegimensResponse = {
  results: Regimen[];
} | Regimen[];

export type CalendarQueryResponse = {
  days: CalendarDay[];
} | CalendarDay[];

export type DoseTakeInput = {
  taken_at?: string;
};

export type AiChatRequest = {
  message: string;
  medicine_context?: string;
};

export type AiChatResponse = {
  answer?: string;
  text?: string;
};

