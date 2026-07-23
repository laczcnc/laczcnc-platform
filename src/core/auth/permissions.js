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
  REPORTS_VIEW: "reports.view",

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

export const ADMIN_SECTIONS = [
  { key: "dashboard", label: "Dashboard", permission: PERMISSIONS.DASHBOARD_VIEW },
  { key: "alerts", label: "Alertas", permission: PERMISSIONS.ALERTS_VIEW },
  { key: "reports", label: "Reportes", permission: PERMISSIONS.REPORTS_VIEW },
  { key: "quotes", label: "Cotizaciones", permission: PERMISSIONS.QUOTES_VIEW },
  { key: "orders", label: "Pedidos", permission: PERMISSIONS.ORDERS_VIEW },
  { key: "customers", label: "Clientes", permission: PERMISSIONS.CUSTOMERS_VIEW },
  { key: "products", label: "Productos", permission: PERMISSIONS.PRODUCTS_VIEW },
  { key: "production", label: "Producción", permission: PERMISSIONS.PRODUCTION_VIEW },
  { key: "workshops", label: "Talleres", permission: PERMISSIONS.WORKSHOPS_VIEW },
  { key: "inventory", label: "Inventario", permission: PERMISSIONS.INVENTORY_VIEW },
  { key: "deliveries", label: "Entregas", permission: PERMISSIONS.DELIVERIES_VIEW },
  { key: "map", label: "Mapa comercial", permission: PERMISSIONS.MAP_VIEW },
  { key: "gallery", label: "Galería", permission: PERMISSIONS.GALLERY_VIEW },
  { key: "users", label: "Usuarios", permission: PERMISSIONS.USERS_VIEW },
  { key: "settings", label: "Configuración", permission: PERMISSIONS.SETTINGS_VIEW },
];

const SECTION_BY_PERMISSION = Object.fromEntries(
  ADMIN_SECTIONS.flatMap((section) => {
    const prefix = `${section.key}.`;
    return ALL_PERMISSIONS.filter(
      (permission) =>
        permission === section.permission ||
        permission.startsWith(prefix)
    ).map((permission) => [permission, section.key]);
  })
);

SECTION_BY_PERMISSION["orders.workflow.manage"] = "orders";
SECTION_BY_PERMISSION["payments.manage"] = "orders";

export const ROLE_PERMISSIONS = {
  admin: ALL_PERMISSIONS,

  manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW,
    PERMISSIONS.REPORTS_VIEW,

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

export function hasPermission(
  role,
  permission,
  sectionAccess = null
) {
  if (!permission) {
    return false;
  }

  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin") {
    return true;
  }

  const sectionKey = SECTION_BY_PERMISSION[permission];

  if (
    sectionKey &&
    sectionAccess &&
    typeof sectionAccess === "object" &&
    Object.prototype.hasOwnProperty.call(
      sectionAccess,
      sectionKey
    )
  ) {
    return sectionAccess[sectionKey] === true;
  }

  return getRolePermissions(role).includes(permission);
}

export function hasAnyPermission(
  role,
  permissions = [],
  sectionAccess = null
) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }

  return permissions.some((permission) =>
    hasPermission(role, permission, sectionAccess)
  );
}

export function hasAllPermissions(
  role,
  permissions = [],
  sectionAccess = null
) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }

  return permissions.every((permission) =>
    hasPermission(role, permission, sectionAccess)
  );
}
