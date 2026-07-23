import "server-only";

import {
  hasPermission,
  PERMISSIONS,
} from "@/core/auth/permissions";

export const ALERT_PRIORITY = {
  critical: {
    label: "Crítica",
    rank: 0,
  },
  high: {
    label: "Alta",
    rank: 1,
  },
  medium: {
    label: "Media",
    rank: 2,
  },
  low: {
    label: "Baja",
    rank: 3,
  },
};

export const ALERT_TYPES = {
  inventory: "Inventario",
  quote: "Cotizaciones",
  production: "Producción",
  delivery: "Entregas",
  visit: "Visitas",
};

function getLimaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getDaysLate(dateValue, todayKey) {
  if (!dateValue) {
    return 0;
  }

  const dueDate = new Date(
    dateValue + "T12:00:00-05:00"
  );

  const todayDate = new Date(
    todayKey + "T12:00:00-05:00"
  );

  return Math.max(
    0,
    Math.floor(
      (todayDate.getTime() -
        dueDate.getTime()) /
        86400000
    )
  );
}

function getOrderNumber(order) {
  return "PED-" +
    String(
      order?.order_number || 0
    ).padStart(6, "0");
}

function getCustomerName(order) {
  return (
    order?.customers?.company_name ||
    order?.customers?.full_name ||
    "Cliente"
  );
}

function createQueryEntries(
  supabase,
  role
) {
  const entries = [];

  if (
    hasPermission(
      role,
      PERMISSIONS.INVENTORY_VIEW
    )
  ) {
    entries.push({
      source: "inventory",
      query: supabase
        .from("inventory_materials")
        .select(
          "id, sku, name, unit, current_stock, minimum_stock, updated_at"
        )
        .eq("is_active", true)
        .order("current_stock", {
          ascending: true,
        })
        .limit(200),
    });
  }

  if (
    hasPermission(
      role,
      PERMISSIONS.QUOTES_VIEW
    )
  ) {
    entries.push({
      source: "quote",
      query: supabase
        .from("quote_requests")
        .select(
          "id, customer_name, company_name, city, quantity, status, created_at, products(name)"
        )
        .eq("status", "new")
        .order("created_at", {
          ascending: true,
        })
        .limit(100),
    });
  }

  if (
    hasPermission(
      role,
      PERMISSIONS.PRODUCTION_VIEW
    )
  ) {
    entries.push({
      source: "production",
      query: supabase
        .from("production_jobs")
        .select(
          "id, status, priority, progress, due_date, orders(order_number, customers(full_name, company_name), products(name))"
        )
        .in("status", [
          "pending",
          "in_progress",
          "quality_control",
          "paused",
        ])
        .not("due_date", "is", null)
        .order("due_date", {
          ascending: true,
        })
        .limit(100),
    });
  }

  if (
    hasPermission(
      role,
      PERMISSIONS.DELIVERIES_VIEW
    )
  ) {
    entries.push({
      source: "delivery",
      query: supabase
        .from("deliveries")
        .select(
          "id, status, scheduled_date, delivery_city, recipient_name, created_at, orders(order_number, customers(full_name, company_name), products(name))"
        )
        .in("status", [
          "pending",
          "scheduled",
          "ready_for_dispatch",
          "dispatched",
          "failed",
        ])
        .order("scheduled_date", {
          ascending: true,
          nullsFirst: false,
        })
        .limit(100),
    });
  }

  if (
    hasPermission(
      role,
      PERMISSIONS.MAP_VIEW
    )
  ) {
    entries.push({
      source: "visit",
      query: supabase
        .from("map_locations")
        .select(
          "id, name, organization_name, contact_name, city, status, next_visit_at, assigned_to"
        )
        .eq("is_active", true)
        .not("next_visit_at", "is", null)
        .order("next_visit_at", {
          ascending: true,
        })
        .limit(100),
    });
  }

  return entries;
}

function buildInventoryAlerts(rows = []) {
  return rows
    .filter(
      (material) =>
        Number(material.current_stock || 0) <=
        Number(material.minimum_stock || 0)
    )
    .map((material) => {
      const currentStock = Number(
        material.current_stock || 0
      );

      const isEmpty = currentStock === 0;

      return {
        key: [
          "inventory",
          "low",
          material.id,
          currentStock.toFixed(3),
        ].join(":"),
        type: "inventory",
        priority: isEmpty
          ? "critical"
          : "high",
        title: isEmpty
          ? material.name + " está agotado"
          : "Stock bajo: " + material.name,
        description:
          "Existencia: " +
          currentStock.toLocaleString("es-PE", {
            maximumFractionDigits: 3,
          }) +
          " " +
          material.unit +
          ". Mínimo: " +
          Number(
            material.minimum_stock || 0
          ).toLocaleString("es-PE", {
            maximumFractionDigits: 3,
          }) +
          ".",
        reference: material.sku,
        href:
          "/admin/inventario/" +
          material.id,
        occurredAt: material.updated_at,
      };
    });
}

function buildQuoteAlerts(
  rows = [],
  now = new Date()
) {
  return rows.map((quote) => {
    const createdAt = new Date(
      quote.created_at
    );

    const hoursWaiting = Math.max(
      0,
      Math.floor(
        (now.getTime() -
          createdAt.getTime()) /
          3600000
      )
    );

    const customerName =
      quote.company_name ||
      quote.customer_name ||
      "Cliente";

    return {
      key: [
        "quote",
        "new",
        quote.id,
      ].join(":"),
      type: "quote",
      priority:
        hoursWaiting >= 24
          ? "high"
          : "medium",
      title:
        "Cotización nueva de " +
        customerName,
      description:
        (quote.products?.name ||
          "Producto por cotizar") +
        (quote.city
          ? " · " + quote.city
          : "") +
        ". Espera: " +
        hoursWaiting +
        " h.",
      reference:
        quote.quantity
          ? String(quote.quantity) +
            " unidades"
          : "Solicitud nueva",
      href:
        "/admin/cotizaciones?estado=new",
      occurredAt: quote.created_at,
    };
  });
}

function buildProductionAlerts(
  rows = [],
  todayKey
) {
  return rows
    .filter(
      (job) =>
        job.due_date &&
        job.due_date <= todayKey
    )
    .map((job) => {
      const daysLate = getDaysLate(
        job.due_date,
        todayKey
      );

      const order = job.orders;
      const isLate = daysLate > 0;

      return {
        key: [
          "production",
          "overdue",
          job.id,
          job.due_date,
        ].join(":"),
        type: "production",
        priority:
          daysLate >= 3 ||
          job.priority === "urgent"
            ? "critical"
            : isLate
              ? "high"
              : "medium",
        title:
          (isLate
            ? "Producción vencida: "
            : "Producción vence hoy: ") +
          getOrderNumber(order),
        description:
          (order?.products?.name ||
            "Producto") +
          " para " +
          getCustomerName(order) +
          ". Avance: " +
          Number(job.progress || 0) +
          "%.",
        reference:
          isLate
            ? daysLate +
              (daysLate === 1
                ? " día de retraso"
                : " días de retraso")
            : "Vence hoy",
        href: "/admin/produccion",
        occurredAt: job.due_date,
      };
    });
}

function buildDeliveryAlerts(
  rows = [],
  todayKey
) {
  return rows
    .filter(
      (delivery) =>
        delivery.status === "failed" ||
        (delivery.scheduled_date &&
          delivery.scheduled_date <=
            todayKey)
    )
    .map((delivery) => {
      const daysLate = delivery.scheduled_date
        ? getDaysLate(
            delivery.scheduled_date,
            todayKey
          )
        : 0;

      const isFailed =
        delivery.status === "failed";

      const isLate = daysLate > 0;

      return {
        key: [
          "delivery",
          isFailed ? "failed" : "due",
          delivery.id,
          delivery.scheduled_date ||
            delivery.created_at,
        ].join(":"),
        type: "delivery",
        priority:
          isFailed || daysLate >= 2
            ? "critical"
            : isLate
              ? "high"
              : "medium",
        title: isFailed
          ? "Entrega fallida: " +
            getOrderNumber(delivery.orders)
          : isLate
            ? "Entrega atrasada: " +
              getOrderNumber(
                delivery.orders
              )
            : "Entrega programada para hoy",
        description:
          getCustomerName(
            delivery.orders
          ) +
          (delivery.delivery_city
            ? " · " +
              delivery.delivery_city
            : "") +
          (delivery.recipient_name
            ? " · Recibe " +
              delivery.recipient_name
            : ""),
        reference: isFailed
          ? "Reprogramar entrega"
          : isLate
            ? daysLate +
              (daysLate === 1
                ? " día de retraso"
                : " días de retraso")
            : "Programada hoy",
        href: "/admin/entregas",
        occurredAt:
          delivery.scheduled_date ||
          delivery.created_at,
      };
    });
}

function buildVisitAlerts(
  rows = [],
  now,
  todayKey
) {
  return rows
    .filter((location) => {
      const visitDate = new Date(
        location.next_visit_at
      );

      return (
        visitDate <= now ||
        getLimaDateKey(visitDate) ===
          todayKey
      );
    })
    .map((location) => {
      const visitDate = new Date(
        location.next_visit_at
      );

      const visitDayKey =
        getLimaDateKey(visitDate);

      const isLate =
        visitDate < now &&
        visitDayKey < todayKey;

      return {
        key: [
          "visit",
          isLate ? "overdue" : "today",
          location.id,
          location.next_visit_at,
        ].join(":"),
        type: "visit",
        priority: isLate
          ? "high"
          : "medium",
        title: isLate
          ? "Visita comercial vencida"
          : "Visita comercial de hoy",
        description:
          (location.organization_name ||
            location.name ||
            "Prospecto") +
          (location.contact_name
            ? " · " +
              location.contact_name
            : "") +
          (location.city
            ? " · " + location.city
            : ""),
        reference: isLate
          ? "Reprogramar visita"
          : "Confirmar atención",
        href:
          "/admin/mapa/agenda?vista=" +
          (isLate ? "overdue" : "today"),
        occurredAt:
          location.next_visit_at,
      };
    });
}

export async function buildOperationalAlerts({
  supabase,
  role,
  now = new Date(),
}) {
  const entries = createQueryEntries(
    supabase,
    role
  );

  const responses = await Promise.all(
    entries.map((entry) => entry.query)
  );

  const rowsBySource = {};

  entries.forEach((entry, index) => {
    const response = responses[index];

    if (response.error) {
      console.error(
        "Error cargando fuente de alertas:",
        {
          source: entry.source,
          code: response.error.code,
          message: response.error.message,
          details: response.error.details,
          hint: response.error.hint,
        }
      );
    }

    rowsBySource[entry.source] =
      response.data || [];
  });

  const todayKey = getLimaDateKey(now);

  const alerts = [
    ...buildInventoryAlerts(
      rowsBySource.inventory
    ),
    ...buildQuoteAlerts(
      rowsBySource.quote,
      now
    ),
    ...buildProductionAlerts(
      rowsBySource.production,
      todayKey
    ),
    ...buildDeliveryAlerts(
      rowsBySource.delivery,
      todayKey
    ),
    ...buildVisitAlerts(
      rowsBySource.visit,
      now,
      todayKey
    ),
  ];

  return alerts.sort((first, second) => {
    const priorityDifference =
      ALERT_PRIORITY[first.priority].rank -
      ALERT_PRIORITY[second.priority].rank;

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return (
      new Date(
        first.occurredAt || 0
      ).getTime() -
      new Date(
        second.occurredAt || 0
      ).getTime()
    );
  });
}
