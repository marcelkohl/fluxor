import type {
  Attachment,
  CreateAttachmentData,
} from "@/features/financial-records/domain";

export interface AttachmentRepositoryPort {
  create(data: CreateAttachmentData): Promise<Attachment>;
  remove(id: string): Promise<Attachment>;
  getById(id: string): Promise<Attachment | null>;
  listByRecord(recordId: string): Promise<Attachment[]>;
}
