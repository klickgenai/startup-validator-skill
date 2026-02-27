// =============================================================================
// Event Bus Tests — verify pub/sub and audit handler
// =============================================================================

import pino from 'pino';
import { EventBus, createAuditLogHandler } from '../../src/events';
import type { DomainEvent } from '../../src/events';

describe('EventBus', () => {
  const logger = pino({ level: 'silent' });

  it('should emit events to registered handlers', async () => {
    const bus = new EventBus(logger);
    const received: DomainEvent[] = [];

    bus.on('test.event', (event) => {
      received.push(event);
    });

    const event: DomainEvent = {
      type: 'test.event',
      payload: {
        action: 'CREATE',
        resource: 'test',
        resourceId: '123',
        userId: 'user-1',
        correlationId: 'corr-1',
        timestamp: new Date().toISOString(),
      },
    };

    await bus.emit(event);
    expect(received).toHaveLength(1);
    expect(received[0]).toBe(event);
  });

  it('should handle events with no registered handlers', async () => {
    const bus = new EventBus(logger);
    const event: DomainEvent = {
      type: 'unhandled.event',
      payload: {
        action: 'DELETE',
        resource: 'test',
        resourceId: '456',
        userId: 'user-2',
        correlationId: 'corr-2',
        timestamp: new Date().toISOString(),
      },
    };

    // Should not throw
    await bus.emit(event);
  });

  it('should catch handler errors without crashing', async () => {
    const bus = new EventBus(logger);
    bus.on('error.event', () => {
      throw new Error('Handler failed');
    });

    const event: DomainEvent = {
      type: 'error.event',
      payload: {
        action: 'UPDATE',
        resource: 'test',
        resourceId: '789',
        userId: 'user-3',
        correlationId: 'corr-3',
        timestamp: new Date().toISOString(),
      },
    };

    // Should not throw despite handler error
    await bus.emit(event);
  });

  it('should support multiple handlers for the same event', async () => {
    const bus = new EventBus(logger);
    let count = 0;

    bus.on('multi.event', () => { count++; });
    bus.on('multi.event', () => { count++; });

    await bus.emit({
      type: 'multi.event',
      payload: {
        action: 'CREATE',
        resource: 'test',
        resourceId: '000',
        userId: 'user-4',
        correlationId: 'corr-4',
        timestamp: new Date().toISOString(),
      },
    });

    expect(count).toBe(2);
  });
});

describe('createAuditLogHandler', () => {
  it('should not throw when handling audit events', () => {
    const logger = pino({ level: 'silent' });
    const handler = createAuditLogHandler(logger);

    const event: DomainEvent = {
      type: 'task.created',
      payload: {
        action: 'CREATE',
        resource: 'task',
        resourceId: 'task-1',
        userId: 'user-1',
        correlationId: 'corr-1',
        timestamp: new Date().toISOString(),
        changes: { title: 'New Task' },
      },
    };

    expect(() => handler(event)).not.toThrow();
  });
});
