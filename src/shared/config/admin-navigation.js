import { PERMISSIONS } from "@/core/auth/permissions";

export const adminNavigation = [
  {
    name: "Dashboard",
    href: "/admin",
    shortName: "IN",
    permission: PERMISSIONS.DASHBOARD_VIEW,
    exact: true,
    enabled: true,
  },
  {
    name: "Alertas",
    href: "/admin/alertas",
    shortName: "AL",
    permission: PERMISSIONS.ALERTS_VIEW,
    enabled: true,
  },
  {
    name: "Reportes",
    href: "/admin/reportes",
    shortName: "RE",
    permission: PERMISSIONS.REPORTS_VIEW,
    enabled: true,
  },
  {
    name: "Cotizaciones",
    href: "/admin/cotizaciones",
    shortName: "CO",
    permission: PERMISSIONS.QUOTES_VIEW,
    enabled: true,
  },
  {
    name: "Pedidos",
    href: "/admin/pedidos",
    shortName: "PE",
    permission: PERMISSIONS.ORDERS_VIEW,
    enabled: true,
  },
  {
    name: "Clientes",
    href: "/admin/clientes",
    shortName: "CL",
    permission: PERMISSIONS.CUSTOMERS_VIEW,
    enabled: true,
  },
  {
    name: "Productos",
    href: "/admin/productos",
    shortName: "PR",
    permission: PERMISSIONS.PRODUCTS_VIEW,
    enabled: true,
  },
  {
    name: "Producción",
    href: "/admin/produccion",
    shortName: "PD",
    permission: PERMISSIONS.PRODUCTION_VIEW,
    exact: true,
    enabled: true,
  },
  {
    name: "Talleres",
    href: "/admin/produccion/talleres",
    shortName: "TA",
    permission: PERMISSIONS.WORKSHOPS_VIEW,
    enabled: true,
  },
  {
    name: "Historial producción",
    href: "/admin/produccion/historial",
    shortName: "HP",
    permission: PERMISSIONS.PRODUCTION_VIEW,
    enabled: true,
  },
  {
    name: "Inventario",
    href: "/admin/inventario",
    shortName: "IV",
    permission: PERMISSIONS.INVENTORY_VIEW,
    enabled: true,
  },
  {
    name: "Entregas",
    href: "/admin/entregas",
    shortName: "EN",
    permission: PERMISSIONS.DELIVERIES_VIEW,
    enabled: true,
  },
  {
    name: "Mapa comercial",
    href: "/admin/mapa",
    shortName: "MA",
    permission: PERMISSIONS.MAP_VIEW,
    exact: true,
    enabled: true,
  },
  {
    name: "Agenda del mapa",
    href: "/admin/mapa/agenda",
    shortName: "AG",
    permission: PERMISSIONS.MAP_VIEW,
    enabled: true,
  },
  {
    name: "Galería",
    href: "/admin/galeria",
    shortName: "GA",
    permission: PERMISSIONS.GALLERY_VIEW,
    enabled: true,
  },
  {
    name: "Usuarios",
    href: "/admin/usuarios",
    shortName: "US",
    permission: PERMISSIONS.USERS_VIEW,
    exact: true,
    enabled: true,
  },
  {
    name: "Configuración",
    href: "/admin/configuracion",
    shortName: "CF",
    permission: PERMISSIONS.SETTINGS_VIEW,
    enabled: true,
  },
];

export function getAdminNavigation(
  role,
  sectionAccess = null
) {
  const { hasPermission } = require("@/core/auth/permissions");

  return adminNavigation.filter((item) => {
    if (item.enabled !== true) {
      return false;
    }

    return hasPermission(role, item.permission, sectionAccess);
  });
}
