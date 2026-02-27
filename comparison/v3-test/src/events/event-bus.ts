// =============================================================================
// Typed Event Bus — in-process pub/sub for audit trail & cross-cutting concerns
// =============================================================================

import type { Logger } from 'pino';

// ---------------------------------------------------------------------------
// Event payload types
// ---------------------------------------------------------------------------
export interface AuditEventPayload {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: string;
  resourceId: string;
  userId: string;
  correlationId: string;
  timestamp: string;
  changes?: Record<string, unknown>;
}

export interface DomainEvent {
  type: string;
  payload: AuditEventPayload;
}

type EventHandler = (event: DomainEvent) => void | Promise<void>;

// ---------------------------------------------------------------------------
// EventBus
// ---------------------------------------------------------------------------
export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child({ component: 'EventBus' });
  }

  on(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  async emit(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (err) {
        this.logger.error({ err, event }, 'Event handler failed');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Audit log handler — wired in container
// ---------------------------------------------------------------------------
export function createAuditLogHandler(logger: Logger): EventHandler {
  const auditLogger = logger.child({ component: 'AuditTrail' });

  return (event: DomainEvent) => {
    const { action, resource, resourceId, userId, correlationId, changes } = event.payload;
    auditLogger.info(
      {
        audit: true,
        action,
        resource,
        resourceId,
        userId,
        correlationId,
        changes,
        timestamp: event.payload.timestamp,
      },
      `AUDIT: ${action} ${resource} ${resourceId} by ${userId}`,
    );
  };
}
