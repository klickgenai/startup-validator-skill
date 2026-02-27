/**
 * Input validation for task endpoints.
 * Guardrail #4: Validate all external input at the boundary.
 */

const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 5000;

// ISO 8601 date format: YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a date string (YYYY-MM-DD format) and ensure it's a real date.
 */
function isValidDate(dateStr) {
  if (!DATE_REGEX.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00Z');
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
}

/**
 * Validate task creation input.
 */
function validateCreateTask(body) {
  const errors = [];

  // Title - required
  if (!body.title || typeof body.title !== 'string') {
    errors.push('Title is required and must be a string.');
  } else {
    const title = body.title.trim();
    if (title.length === 0) {
      errors.push('Title cannot be empty.');
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push(`Title must not exceed ${MAX_TITLE_LENGTH} characters.`);
    }
  }

  // Description - optional
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.push('Description must be a string.');
    } else if (body.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push(`Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters.`);
    }
  }

  // Status - optional, defaults to 'todo'
  if (body.status !== undefined && body.status !== null) {
    if (!VALID_STATUSES.includes(body.status)) {
      errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
    }
  }

  // Priority - optional, defaults to 'medium'
  if (body.priority !== undefined && body.priority !== null) {
    if (!VALID_PRIORITIES.includes(body.priority)) {
      errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
    }
  }

  // Due date - optional
  if (body.due_date !== undefined && body.due_date !== null) {
    if (typeof body.due_date !== 'string') {
      errors.push('Due date must be a string in YYYY-MM-DD format.');
    } else if (!isValidDate(body.due_date)) {
      errors.push('Due date must be a valid date in YYYY-MM-DD format.');
    }
  }

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true };
}

/**
 * Validate task update input.
 * At least one field must be provided.
 */
function validateUpdateTask(body) {
  const errors = [];
  const allowedFields = ['title', 'description', 'status', 'priority', 'due_date'];
  const providedFields = allowedFields.filter(f => body[f] !== undefined);

  if (providedFields.length === 0) {
    errors.push(`At least one field must be provided: ${allowedFields.join(', ')}.`);
    return { valid: false, errors };
  }

  // Title - if provided
  if (body.title !== undefined) {
    if (typeof body.title !== 'string') {
      errors.push('Title must be a string.');
    } else {
      const title = body.title.trim();
      if (title.length === 0) {
        errors.push('Title cannot be empty.');
      } else if (title.length > MAX_TITLE_LENGTH) {
        errors.push(`Title must not exceed ${MAX_TITLE_LENGTH} characters.`);
      }
    }
  }

  // Description - if provided
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.push('Description must be a string.');
    } else if (body.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push(`Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters.`);
    }
  }

  // Status - if provided
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
    }
  }

  // Priority - if provided
  if (body.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(body.priority)) {
      errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
    }
  }

  // Due date - if provided (can be null to clear)
  if (body.due_date !== undefined && body.due_date !== null) {
    if (typeof body.due_date !== 'string') {
      errors.push('Due date must be a string in YYYY-MM-DD format or null.');
    } else if (!isValidDate(body.due_date)) {
      errors.push('Due date must be a valid date in YYYY-MM-DD format.');
    }
  }

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true };
}

/**
 * Validate and sanitize query parameters for task listing.
 */
function validateTaskQuery(query) {
  const result = {
    page: 1,
    limit: 20,
    status: null,
    priority: null,
    sort: 'created_at',
    order: 'desc',
  };

  // Page
  if (query.page !== undefined) {
    const page = parseInt(query.page, 10);
    if (isNaN(page) || page < 1) {
      return { valid: false, errors: ['Page must be a positive integer.'] };
    }
    result.page = page;
  }

  // Limit (cap at 100 to prevent abuse)
  if (query.limit !== undefined) {
    const limit = parseInt(query.limit, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return { valid: false, errors: ['Limit must be between 1 and 100.'] };
    }
    result.limit = limit;
  }

  // Status filter
  if (query.status !== undefined && query.status !== '') {
    if (!VALID_STATUSES.includes(query.status)) {
      return { valid: false, errors: [`Status filter must be one of: ${VALID_STATUSES.join(', ')}.`] };
    }
    result.status = query.status;
  }

  // Priority filter
  if (query.priority !== undefined && query.priority !== '') {
    if (!VALID_PRIORITIES.includes(query.priority)) {
      return { valid: false, errors: [`Priority filter must be one of: ${VALID_PRIORITIES.join(', ')}.`] };
    }
    result.priority = query.priority;
  }

  // Sort field (whitelist to prevent SQL injection via column names)
  const allowedSortFields = ['created_at', 'updated_at', 'due_date', 'priority', 'status', 'title'];
  if (query.sort !== undefined) {
    if (!allowedSortFields.includes(query.sort)) {
      return { valid: false, errors: [`Sort must be one of: ${allowedSortFields.join(', ')}.`] };
    }
    result.sort = query.sort;
  }

  // Sort order
  if (query.order !== undefined) {
    const order = query.order.toLowerCase();
    if (!['asc', 'desc'].includes(order)) {
      return { valid: false, errors: ['Order must be asc or desc.'] };
    }
    result.order = order;
  }

  return { valid: true, ...result };
}

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateTaskQuery,
  VALID_STATUSES,
  VALID_PRIORITIES,
};
