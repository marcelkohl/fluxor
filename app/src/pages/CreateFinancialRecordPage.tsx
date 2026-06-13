import { useParams } from "react-router-dom";

import { FinancialRecordFormPage } from "@/features/financial-records/pages/CreateFinancialRecordPage";

export function CreateFinancialRecordRoutePage() {
  return <FinancialRecordFormPage mode="create" />;
}

export function EditFinancialRecordRoutePage() {
  const { id } = useParams<{ id: string }>();
  return <FinancialRecordFormPage mode="edit" recordId={id} />;
}
