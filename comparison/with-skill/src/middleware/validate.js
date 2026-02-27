/**
 * Input validation middleware factory.
 * Returns Express middleware that validates req.body, req.params, and req.query
 * against the provided schema.
 *
 * Schema format:
 * {
 *   body: {
 *     fieldName: {
 *       type: 'string' | 'number' | 'integer',
 *       required: true | false,
 *       minLength: number,
 *       maxLength: number,
 *       min: number,
 *       max: number,
 *       pattern: RegExp,
 *       enum: ['value1', 'value2'],
 *       sanitize: function(value) => sanitizedValue,
 *       custom: function(value) => true | 'error message',
 *     }
 *   },
 *   params: { ... },
 *   query: { ... }
 * }
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const source of ['body', 'params', 'query']) {
      if (!schema[source]) continue;

      const data = req[source] || {};

      for (const [field, rules] of Object.entries(schema[source])) {
        const value = data[field];

        // Required check
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push({
            field: `${source}.${field}`,
            message: `${field} is required`,
          });
          continue;
        }

        // Skip further checks if value is not provided and not required
        if (value === undefined || value === null || value === '') {
          continue;
        }

        // Type check
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push({
            field: `${source}.${field}`,
            message: `${field} must be a string`,
          });
          continue;
        }

        if (rules.type === 'number' || rules.type === 'integer') {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push({
              field: `${source}.${field}`,
              message: `${field} must be a number`,
            });
            continue;
          }
          if (rules.type === 'integer' && !Number.isInteger(num)) {
            errors.push({
              field: `${source}.${field}`,
              message: `${field} must be an integer`,
            });
            continue;
          }
        }

        // String validations
        if (typeof value === 'string') {
          if (rules.minLength !== undefined && value.length < rules.minLength) {
            errors.push({
              field: `${source}.${field}`,
              message: `${field} must be at least ${rules.minLength} characters`,
            });
          }

          if (rules.maxLength !== undefined && value.length > rules.maxLength) {
            errors.push({
              field: `${source}.${field}`,
              message: `${field} must be at most ${rules.maxLength} characters`,
            });
          }

          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push({
              field: `${source}.${field}`,
              message: rules.patternMessage || `${field} has an invalid format`,
            });
          }
        }

        // Number validations
        if (rules.type === 'number' || rules.type === 'integer') {
          const num = Number(value);
          if (rules.min !== undefined && num < rules.min) {
            errors.push({
              field: `${source}.${field}`,
              message: `${field} must be at least ${rules.min}`,
            });
          }
          if (rules.max !== undefined && num > rules.max) {
            errors.push({
              field: `${source}.${field}`,
              message: `${field} must be at most ${rules.max}`,
            });
          }
        }

        // Enum check
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push({
            field: `${source}.${field}`,
            message: `${field} must be one of: ${rules.enum.join(', ')}`,
          });
        }

        // Custom validation
        if (rules.custom) {
          const result = rules.custom(value);
          if (result !== true) {
            errors.push({
              field: `${source}.${field}`,
              message: result || `${field} is invalid`,
            });
          }
        }

        // Sanitization (mutates req data)
        if (rules.sanitize && typeof rules.sanitize === 'function') {
          data[field] = rules.sanitize(value);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: errors,
        },
      });
    }

    next();
  };
}

module.exports = { validate };
