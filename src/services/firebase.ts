/**
 * Servicio de Integración Firebase / Firestore & Control de Acceso
 * SUPER J Y G - Costa Rica POS
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Función estándar de manejo de errores de Firestore para auditoría y diagnóstico estricto
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  authContext?: { uid?: string; email?: string }
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: authContext?.uid || 'anonymous',
      email: authContext?.email || null,
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerInfo: authContext?.email ? [{ providerId: 'password', email: authContext.email }] : [],
    },
    operationType,
    path,
  };
  console.error('Firestore Security / Operation Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validación y sanitización estricta de entrada de datos en cliente
 */
export const SecurityValidator = {
  isValidBarcode(barcode: string): boolean {
    return typeof barcode === 'string' && barcode.trim().length >= 3 && barcode.trim().length <= 64;
  },

  isValidColonAmount(amount: number): boolean {
    return typeof amount === 'number' && !isNaN(amount) && amount >= 0 && amount <= 100000000;
  },

  isValidTaxRate(rate: number): boolean {
    return [0, 0.01, 0.02, 0.13].includes(rate);
  },

  sanitizeString(text: string): string {
    return text.replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        case '&': return '&amp;';
        default: return char;
      }
    });
  }
};
