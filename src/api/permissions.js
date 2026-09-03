/**
 * Role Permission Matrix matching Backend/config/permissions.php
 */
export const ROLE_PERMISSIONS = {
  admin: [
    'manage_users',
    'manage_organizers',
    'manage_venues',
    'manage_categories',
    'manage_events',
    'manage_ticket_types',
    'manage_bookings',
    'manage_payments',
    'manage_reviews',
    'manage_checkins',
    'view_dashboard',
  ],
  organizer: [
    'manage_own_events',
    'manage_own_ticket_types',
    'manage_own_event_images',
    'view_own_event_bookings',
    'manage_own_checkins',
    'manage_organizer_profile',
    'view_venues',
    'view_categories',
    'view_organizers',
  ],
  customer: [
    'view_events',
    'view_venues',
    'view_categories',
    'view_organizers',
    'create_bookings',
    'view_own_bookings',
    'cancel_own_bookings',
    'make_payments',
    'create_reviews',
    'manage_own_profile',
  ],
};

export const ADMIN_PERMISSIONS = ROLE_PERMISSIONS.admin;

/**
 * Check if a role has a specific permission.
 * Admin is super role and has all permissions.
 */
export function hasPermission(role, permission) {
  if (role === 'admin') return true;
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}

/**
 * Check if a role has any of the specified permissions.
 */
export function hasAnyPermission(role, permissions = []) {
  if (role === 'admin') return true;
  const granted = ROLE_PERMISSIONS[role] || [];
  return permissions.some((p) => granted.includes(p));
}
