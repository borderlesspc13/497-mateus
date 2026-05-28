import { getAdminFirestore } from "@/lib/firebase/admin";
import { COLLECTIONS, newId, nowIso, type LogAuditoriaDoc } from "@/lib/firestore/types";

export type AuditLogInput = {
  userId: string;
  acao: string;
  documentoId: string;
};

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  const doc: LogAuditoriaDoc = {
    userId: input.userId,
    acao: input.acao,
    documentoId: input.documentoId,
    dataTimestamp: nowIso(),
  };

  await getAdminFirestore().collection(COLLECTIONS.logs_auditoria).doc(newId()).set(doc);
}
