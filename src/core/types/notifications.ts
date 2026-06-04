export type NotificationPayload = {
  type:
    | 'dose_reminder'
    | 'missed_dose'
    | 'low_stock';
  regimenId?: number;
  title: string;
  body: string;
};

