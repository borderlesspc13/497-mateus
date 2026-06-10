/**
 * Regista no console o link de criação de índice composto quando o Firestore o exige.
 * Re-lança o erro para que a UI possa tratá-lo.
 */
export function handleFirestoreIndexError(error: unknown): never {
  if (error instanceof Error) {
    const linkMatch = error.message.match(/https:\/\/[^\s"]+/);
    if (
      error.message.includes("index") ||
      error.message.includes("Index") ||
      linkMatch
    ) {
      if (linkMatch) {
        console.error(
          "[Firestore] Índice composto em falta. Crie-o aqui:",
          linkMatch[0],
        );
      } else {
        console.error("[Firestore] Índice composto em falta:", error.message);
      }
    }
  }
  throw error;
}
