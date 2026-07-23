export const APP_ROLES = [
  "admin",
  "manager",
  "sales",
  "production",
  "delivery",
];

export const ROLE_LABELS = {
  admin: "Administrador",
  manager: "Gerente",
  sales: "Ventas",
  production: "Producción",
  delivery: "Reparto",
};

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  ALERTS_VIEW: "alerts.view",

  QUOTES_VIEW: "quotes.view",
  QUOTES_MANAGE: "quotes.manage",

  ORDERS_VIEW: "orders.view",
  ORDERS_MANAGE: "orders.manage",
  ORDER_WORKFLOW_MANAGE: "orders.workflow.manage",
  PAYMENTS_MANAGE: "payments.manage",

  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_MANAGE: "customers.manage",

  PRODUCTS_VIEW: "products.view",
  PRODUCTS_MANAGE: "products.manage",

  PRODUCTION_VIEW: "production.view",
  PRODUCTION_MANAGE: "production.manage",

  WORKSHOPS_VIEW: "workshops.view",
  WORKSHOPS_MANAGE: "workshops.manage",

  INVENTORY_VIEW: "inventory.view",
  INVENTORY_MANAGE: "inventory.manage",

  DELIVERIES_VIEW: "deliveries.view",
  DELIVERIES_MANAGE: "deliveries.manage",

  MAP_VIEW: "map.view",
  MAP_MANAGE: "map.manage",

  GALLERY_VIEW: "gallery.view",
  GALLERY_MANAGE: "gallery.manage",

  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",

  SETTINGS_VIEW: "settings.view",
  SETTINGS_MANAGE: "settings.manage",
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = {
  admin: ALL_PERMISSIONS,

  manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW,

    PERMISSIONS.QUOTES_VIEW,
    PERMISSIONS.QUOTES_MANAGE,

    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.ORDER_WORKFLOW_MANAGE,
    PERMISSIONS.PAYMENTS_MANAGE,

    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,

    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_MANAGE,

    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.PRODUCTION_MANAGE,

    PERMISSIONS.WORKSHOPS_VIEW,
    PERMISSIONS.WORKSHOPS_MANAGE,

    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,

    PERMISSIONS.DELIVERIES_VIEW,
    PERMISSIONS.DELIVERIES_MANAGE,

    PERMISSIONS.MAP_VIEW,
    PERMISSIONS.MAP_MANAGE,

    PERMISSIONS.GALLERY_VIEW,
    PERMISSIONS.GALLERY_MANAGE,

  ],

  sales: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW,

    PERMISSIONS.QUOTES_VIEW,
    PERMISSIONS.QUOTES_MANAGE,

    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.ORDER_WORKFLOW_MANAGE,
    PERMISSIONS.PAYMENTS_MANAGE,

    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,

    PERMISSIONS.PRODUCTS_VIEW,

    PERMISSIONS.DELIVERIES_VIEW,

    PERMISSIONS.MAP_VIEW,
    PERMISSIONS.MAP_MANAGE,

    PERMISSIONS.GALLERY_VIEW,
    PERMISSIONS.GALLERY_MANAGE,
  ],

  production: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW,

    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDER_WORKFLOW_MANAGE,

    PERMISSIONS.PRODUCTS_VIEW,

    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.PRODUCTION_MANAGE,

    PERMISSIONS.WORKSHOPS_VIEW,
    PERMISSIONS.WORKSHOPS_MANAGE,

    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
  ],

  delivery: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW,

    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDER_WORKFLOW_MANAGE,

    PERMISSIONS.CUSTOMERS_VIEW,

    PERMISSIONS.DELIVERIES_VIEW,
    PERMISSIONS.DELIVERIES_MANAGE,

    PERMISSIONS.MAP_VIEW,
    PERMISSIONS.MAP_MANAGE,
  ],
};

export function normalizeRole(role) {
  const normalizedRole = String(role ?? "")
    .trim()
    .toLowerCase();

  return APP_ROLES.includes(normalizedRole)
    ? normalizedRole
    : null;
}

export function getRolePermissions(role) {
  const normalizedRole = normalizeRole(role);

  if (!normalizedRole) {
    return [];
  }

  return ROLE_PERMISSIONS[normalizedRole] ?? [];
}

export function hasPermission(role, permission) {
  if (!permission) {
    return false;
  }

  return getRolePermissions(role).includes(permission);
}

export function hasAnyPermission(role, permissions = []) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }

  return permissions.some((permission) =>
    hasPermission(role, permission)
  );
}

export function hasAllPermissions(role, permissions = []) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }

  return permissions.every((permission) =>
    hasPermission(role, permission)
  );
}
