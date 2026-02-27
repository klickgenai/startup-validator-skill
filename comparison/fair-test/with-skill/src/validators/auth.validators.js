/**
 * Input validation for auth endpoints.
 * Guardrail #4: Validate all external input at the boundary.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;

/**
 * Validate registration input.
 * Returns { valid: true } or { valid: false, errors: [...] }
 */
function validateRegister(body) {
  const errors = [];

  // Email validation
  if (!body.email || typeof body.email !== 'string') {
    errors.push('Email is required and must be a string.');
  } else {
    const email = body.email.trim();
    if (email.length === 0) {
      errors.push('Email cannot be empty.');
    } else if (email.length > MAX_EMAIL_LENGTH) {
      errors.push(`Email must not exceed ${MAX_EMAIL_LENGTH} characters.`);
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push('Email format is invalid.');
    }
  }

  // Password validation
  if (!body.password || typeof body.password !== 'string') {
    errors.push('Password is required and must be a string.');
  } else {
    if (body.password.length < MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (body.password.length > MAX_PASSWORD_LENGTH) {
      errors.push(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters.`);
    }
  }

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true };
}

/**
 * Validate login input.
 */
function validateLogin(body) {
  const errors = [];

  if (!body.email || typeof body.email !== 'string' || body.email.trim().length === 0) {
    errors.push('Email is required.');
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length === 0) {
    errors.push('Password is required.');
  }

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true };
}

module.exports = { validateRegister, validateLogin };
