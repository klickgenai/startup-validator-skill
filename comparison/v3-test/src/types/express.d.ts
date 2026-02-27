// =============================================================================
// Express Request augmentation — add correlationId and user to Request
// =============================================================================

import type { AuthPayload } from './common';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      user?: AuthPayload;
    }
  }
}
