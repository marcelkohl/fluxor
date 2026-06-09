export interface Payee {
  id: string;
  name: string;
  notes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreatePayeeData {
  name: string;
  notes?: string | null;
}

export interface UpdatePayeeData {
  name?: string;
  notes?: string | null;
}

export interface PayeeDocument {
  id: string;
  payeeId: string;
  type: string;
  value: string;
  createdAt: string;
}

export interface CreatePayeeDocumentData {
  payeeId: string;
  type: string;
  value: string;
}

export interface PayeePaymentMethod {
  id: string;
  payeeId: string;
  type: string;
  value: string;
  createdAt: string;
}

export interface CreatePayeePaymentMethodData {
  payeeId: string;
  type: string;
  value: string;
}
