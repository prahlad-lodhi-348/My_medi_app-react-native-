export type Medicine = {
  id: number;
  name: string;
  image_url?: string;
};

export type DoseTime = {
  id?: number;
  time: string; // HH:mm
  quantity: number;
  label?: string;
};

export type Regimen = {
  id: number;
  name: string;
  medicine: Medicine;
  doses: DoseTime[];
  stock: {
    quantity: number;
    low_stock_threshold: number;
  };
};

export type CalendarDay = {
  date: string; // YYYY-MM-DD
  dosesTaken: boolean[];
};

