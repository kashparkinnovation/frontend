/**
 * Shared application constants.
 * Use these instead of raw strings for role checks throughout the app.
 */

export const ROLES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  SCHOOL: 'school',
  STUDENT: 'student',
};

/**
 * Portal entry-point for each role.
 */
export const ROLE_PORTALS = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.VENDOR]: '/vendor',
  [ROLES.SCHOOL]: '/school',
  [ROLES.STUDENT]: '/store',
};
