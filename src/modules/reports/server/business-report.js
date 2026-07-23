import "server-only";

const REPORT_TIME_ZONE =
  "America/Lima";

const ORDER_STATUS_LABELS = {
  draft: "Borrador",
  confirmed: "Confirmado",
  production: "Producción",
  ready: "Listo",
  delivered: "Entregado",
  completed: "Completado",
  cancelled: "Cancelado",
};

const PAYMENT_METHOD_LABELS = {
  cash: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  bank_transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

function getLimaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function isDateKey(value) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      String(value || "")
    )
  ) {
    return false;
  }

  const parsed = new Date(
    value + "T12:00:00-05:00"
  );

  return !Number.isNaN(
    parsed.getTime()
  );
}

function shiftDateKey(dateKey, days) {
  const date = new Date(
    dateKey + "T12:00:00-05:00"
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return getLimaDateKey(date);
}

function getMonthStart(dateKey) {
  return dateKey.slice(0, 8) + "01";
}

function getYearStart(dateKey) {
  return dateKey.slice(0, 4) + "-01-01";
}

function getDaysBetween(fromDate, toDate) {
  const start = new Date(
    fromDate + "T12:00:00-05:00"
  );

  const end = new Date(
    toDate + "T12:00:00-05:00"
  );

  return Math.floor(
    (end.getTime() - start.getTime()) /
      86400000
  );
}

export function resolveReportRange(
  queryParams = {}
) {
  const today = getLimaDateKey();

  const requestedPreset =
    typeof queryParams?.periodo === "string"
      ? queryParams.periodo
      : "30";

  let preset = [
    "today",
    "7",
    "30",
    "90",
    "month",
    "year",
    "custom",
  ].includes(requestedPreset)
    ? requestedPreset
    : "30";

  let fromDate;
  let toDate = today;

  if (preset === "today") {
    fromDate = today;
  } else if (preset === "7") {
    fromDate = shiftDateKey(today, -6);
  } else if (preset === "90") {
    fromDate = shiftDateKey(today, -89);
  } else if (preset === "month") {
    fromDate = getMonthStart(today);
  } else if (preset === "year") {
    fromDate = getYearStart(today);
  } else if (preset === "custom") {
    fromDate = isDateKey(
      queryParams?.desde
    )
      ? queryParams.desde
      : shiftDateKey(today, -29);

    toDate = isDateKey(
      queryParams?.hasta
    )
      ? queryParams.hasta
      : today;
  } else {
    preset = "30";
    fromDate = shiftDateKey(today, -29);
  }

  if (fromDate > toDate) {
    const previousFrom = fromDate;
    fromDate = toDate;
    toDate = previousFrom;
  }

  if (
    getDaysBetween(
      fromDate,
      toDate
    ) > 365
  ) {
    fromDate = shiftDateKey(
      toDate,
      -365
    );
  }

  return {
    preset,
    fromDate,
    toDate,
    fromIso:
      fromDate + "T00:00:00-05:00",
    toIso:
      toDate +
      "T23:59:59.999-05:00",
    days:
      getDaysBetween(
        fromDate,
        toDate
      ) + 1,
  };
}

function sum(rows, selector) {
  return rows.reduce(
    (total, row) =>
      total +
      Number(selector(row) || 0),
    0
  );
}

function countBy(rows, selector) {
  return rows.reduce(
    (result, row) => {
      const key =
        selector(row) || "unknown";

      result[key] =
        (result[key] || 0) + 1;

      return result;
    },
    {}
  );
}

function buildTopProducts(orders) {
  const products = new Map();

  orders.forEach((order) => {
    const productId =
      order.products?.id ||
      order.product_id ||
      "without-product";

    const current =
      products.get(productId) || {
        id: productId,
        name:
          order.products?.name ||
          "Producto no asignado",
        orders: 0,
        units: 0,
        revenue: 0,
      };

    current.orders += 1;
    current.units += Number(
      order.quantity || 0
    );
    current.revenue += Number(
      order.total_amount || 0
    );

    products.set(productId, current);
  });

  return Array.from(products.values())
    .sort(
      (first, second) =>
        second.revenue -
        first.revenue
    )
    .slice(0, 8);
}

function buildTopCustomers(orders) {
  const customers = new Map();

  orders.forEach((order) => {
    const customerId =
      order.customers?.id ||
      order.customer_id ||
      "without-customer";

    const current =
      customers.get(customerId) || {
        id: customerId,
        name:
          order.customers
            ?.company_name ||
          order.customers?.full_name ||
          "Cliente no asignado",
        city:
          order.customers?.city || "",
        orders: 0,
        revenue: 0,
        outstanding: 0,
      };

    current.orders += 1;
    current.revenue += Number(
      order.total_amount || 0
    );
    current.outstanding += Number(
      order.balance_due || 0
    );

    customers.set(customerId, current);
  });

  return Array.from(customers.values())
    .sort(
      (first, second) =>
        second.revenue -
        first.revenue
    )
    .slice(0, 8);
}

function buildSalesTrend(
  orders,
  range
) {
  const values = new Map();

  orders.forEach((order) => {
    const dateKey = getLimaDateKey(
      new Date(order.created_at)
    );

    const current =
      values.get(dateKey) || {
        date: dateKey,
        orders: 0,
        revenue: 0,
      };

    current.orders += 1;
    current.revenue += Number(
      order.total_amount || 0
    );

    values.set(dateKey, current);
  });

  const sorted = Array.from(
    values.values()
  ).sort((first, second) =>
    first.date.localeCompare(
      second.date
    )
  );

  if (range.days <= 31) {
    const complete = [];

    for (
      let dateKey = range.fromDate;
      dateKey <= range.toDate;
      dateKey = shiftDateKey(
        dateKey,
        1
      )
    ) {
      complete.push(
        values.get(dateKey) || {
          date: dateKey,
          orders: 0,
          revenue: 0,
        }
      );
    }

    return complete;
  }

  return sorted.slice(-20);
}

function buildPaymentMethods(payments) {
  const grouped = new Map();

  payments.forEach((payment) => {
    const method =
      payment.payment_method || "other";

    const current =
      grouped.get(method) || {
        method,
        label:
          PAYMENT_METHOD_LABELS[
            method
          ] || method,
        payments: 0,
        amount: 0,
      };

    current.payments += 1;
    current.amount += Number(
      payment.amount || 0
    );

    grouped.set(method, current);
  });

  return Array.from(grouped.values()).sort(
    (first, second) =>
      second.amount - first.amount
  );
}

function buildReportData({
  range,
  orders,
  payments,
  quotes,
  productionJobs,
  deliveries,
  inventory,
}) {
  const saleOrders = orders.filter(
    (order) =>
      !["draft", "cancelled"].includes(
        order.status
      )
  );

  const grossSales = sum(
    saleOrders,
    (order) => order.total_amount
  );

  const collected = sum(
    payments,
    (payment) => payment.amount
  );

  const outstanding = sum(
    saleOrders,
    (order) => order.balance_due
  );

  const discounts = sum(
    saleOrders,
    (order) => order.discount_amount
  );

  const wonQuotes = quotes.filter(
    (quote) => quote.status === "won"
  ).length;

  const validQuotes = quotes.filter(
    (quote) =>
      quote.status !== "archived"
  ).length;

  const completedProduction =
    productionJobs.filter(
      (job) =>
        job.completed_at ||
        job.status === "ready"
    );

  const productionOnTime =
    completedProduction.filter(
      (job) =>
        job.completed_at &&
        job.due_date &&
        getLimaDateKey(
          new Date(job.completed_at)
        ) <= job.due_date
    ).length;

  const activeProduction =
    productionJobs.filter((job) =>
      [
        "pending",
        "in_progress",
        "quality_control",
        "paused",
      ].includes(job.status)
    );

  const today = getLimaDateKey();

  const overdueProduction =
    activeProduction.filter(
      (job) =>
        job.due_date &&
        job.due_date < today
    ).length;

  const delivered = deliveries.filter(
    (delivery) =>
      delivery.status === "delivered"
  ).length;

  const failedDeliveries =
    deliveries.filter(
      (delivery) =>
        delivery.status === "failed"
    ).length;

  const activeInventory =
    inventory.filter(
      (material) => material.is_active
    );

  const inventoryValue = sum(
    activeInventory,
    (material) =>
      Number(
        material.current_stock || 0
      ) *
      Number(material.unit_cost || 0)
  );

  const lowStock = activeInventory.filter(
    (material) =>
      Number(
        material.current_stock || 0
      ) <=
      Number(
        material.minimum_stock || 0
      )
  ).length;

  return {
    range,
    metrics: {
      grossSales,
      collected,
      outstanding,
      discounts,
      orderCount: saleOrders.length,
      averageTicket:
        saleOrders.length > 0
          ? grossSales /
            saleOrders.length
          : 0,
      quoteCount: quotes.length,
      wonQuotes,
      quoteConversion:
        validQuotes > 0
          ? (wonQuotes / validQuotes) *
            100
          : 0,
      productionCount:
        productionJobs.length,
      completedProduction:
        completedProduction.length,
      productionOnTimeRate:
        completedProduction.length > 0
          ? (productionOnTime /
              completedProduction.length) *
            100
          : 0,
      activeProduction:
        activeProduction.length,
      overdueProduction,
      deliveryCount:
        deliveries.length,
      delivered,
      failedDeliveries,
      deliverySuccessRate:
        deliveries.length > 0
          ? (delivered /
              deliveries.length) *
            100
          : 0,
      inventoryValue,
      inventoryMaterials:
        activeInventory.length,
      lowStock,
    },
    topProducts:
      buildTopProducts(saleOrders),
    topCustomers:
      buildTopCustomers(saleOrders),
    salesTrend: buildSalesTrend(
      saleOrders,
      range
    ),
    orderStatuses: countBy(
      orders,
      (order) => order.status
    ),
    quoteStatuses: countBy(
      quotes,
      (quote) => quote.status
    ),
    productionStatuses: countBy(
      productionJobs,
      (job) => job.status
    ),
    deliveryStatuses: countBy(
      deliveries,
      (delivery) => delivery.status
    ),
    paymentMethods:
      buildPaymentMethods(payments),
    rows: {
      orders,
      payments,
      quotes,
      productionJobs,
      deliveries,
      inventory,
    },
  };
}

export async function loadBusinessReport({
  supabase,
  range,
}) {
  const [
    ordersResponse,
    paymentsResponse,
    quotesResponse,
    productionResponse,
    deliveriesResponse,
    inventoryResponse,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_number, customer_id, product_id, status, quantity, unit_price, total_amount, discount_amount, advance_payment, balance_due, completed_at, cancelled_at, created_at, customers(id, full_name, company_name, city), products(id, name)"
      )
      .gte("created_at", range.fromIso)
      .lte("created_at", range.toIso)
      .order("created_at", {
        ascending: false,
      })
      .limit(5000),

    supabase
      .from("order_payments")
      .select(
        "id, order_id, amount, payment_method, paid_at, reference, created_at, orders(order_number, customers(full_name, company_name))"
      )
      .gte("paid_at", range.fromIso)
      .lte("paid_at", range.toIso)
      .order("paid_at", {
        ascending: false,
      })
      .limit(5000),

    supabase
      .from("quote_requests")
      .select(
        "id, customer_name, company_name, city, status, source, created_at, products(name)"
      )
      .gte("created_at", range.fromIso)
      .lte("created_at", range.toIso)
      .order("created_at", {
        ascending: false,
      })
      .limit(5000),

    supabase
      .from("production_jobs")
      .select(
        "id, order_id, status, priority, progress, due_date, completed_at, created_at, orders(order_number, customers(full_name, company_name), products(name))"
      )
      .gte("created_at", range.fromIso)
      .lte("created_at", range.toIso)
      .order("created_at", {
        ascending: false,
      })
      .limit(5000),

    supabase
      .from("deliveries")
      .select(
        "id, order_id, status, delivery_type, delivery_city, scheduled_date, delivered_at, delivery_cost, created_at, orders(order_number, customers(full_name, company_name))"
      )
      .gte("created_at", range.fromIso)
      .lte("created_at", range.toIso)
      .order("created_at", {
        ascending: false,
      })
      .limit(5000),

    supabase
      .from("inventory_materials")
      .select(
        "id, sku, name, category, unit, current_stock, minimum_stock, unit_cost, is_active"
      )
      .order("name", {
        ascending: true,
      })
      .limit(5000),
  ]);

  const responses = [
    {
      name: "orders",
      response: ordersResponse,
    },
    {
      name: "payments",
      response: paymentsResponse,
    },
    {
      name: "quotes",
      response: quotesResponse,
    },
    {
      name: "production",
      response: productionResponse,
    },
    {
      name: "deliveries",
      response: deliveriesResponse,
    },
    {
      name: "inventory",
      response: inventoryResponse,
    },
  ];

  const errors = responses
    .filter(
      ({ response }) => response.error
    )
    .map(({ name, response }) => ({
      source: name,
      code: response.error.code,
      message: response.error.message,
      details: response.error.details,
      hint: response.error.hint,
    }));

  errors.forEach((error) => {
    console.error(
      "Error cargando reporte:",
      error
    );
  });

  const report = buildReportData({
    range,
    orders: ordersResponse.data || [],
    payments:
      paymentsResponse.data || [],
    quotes: quotesResponse.data || [],
    productionJobs:
      productionResponse.data || [],
    deliveries:
      deliveriesResponse.data || [],
    inventory:
      inventoryResponse.data || [],
  });

  return {
    ...report,
    errors,
  };
}

function escapeCsv(value) {
  const normalized = String(
    value ?? ""
  ).replace(/"/g, '""');

  return '"' + normalized + '"';
}

function csvRow(values) {
  return values
    .map(escapeCsv)
    .join(";");
}

export function createBusinessReportCsv(
  report
) {
  const lines = [];
  const { metrics, range, rows } =
    report;

  lines.push(
    csvRow([
      "REPORTE LACZCNC",
      range.fromDate,
      range.toDate,
    ])
  );

  lines.push("");
  lines.push(
    csvRow(["RESUMEN", "VALOR"])
  );

  [
    ["Ventas generadas", metrics.grossSales],
    ["Dinero cobrado", metrics.collected],
    ["Saldo pendiente", metrics.outstanding],
    ["Pedidos", metrics.orderCount],
    ["Ticket promedio", metrics.averageTicket],
    [
      "Conversión de cotizaciones %",
      metrics.quoteConversion,
    ],
    [
      "Cumplimiento de producción %",
      metrics.productionOnTimeRate,
    ],
    [
      "Éxito de entregas %",
      metrics.deliverySuccessRate,
    ],
    [
      "Valor actual de inventario",
      metrics.inventoryValue,
    ],
    [
      "Materiales con stock bajo",
      metrics.lowStock,
    ],
  ].forEach((row) =>
    lines.push(csvRow(row))
  );

  lines.push("");
  lines.push(
    csvRow([
      "PEDIDOS",
      "NÚMERO",
      "FECHA",
      "CLIENTE",
      "PRODUCTO",
      "ESTADO",
      "CANTIDAD",
      "TOTAL",
      "SALDO",
    ])
  );

  rows.orders.forEach((order) => {
    lines.push(
      csvRow([
        order.id,
        String(
          order.order_number || 0
        ).padStart(6, "0"),
        order.created_at,
        order.customers
          ?.company_name ||
          order.customers?.full_name ||
          "",
        order.products?.name || "",
        ORDER_STATUS_LABELS[
          order.status
        ] || order.status,
        order.quantity,
        order.total_amount,
        order.balance_due,
      ])
    );
  });

  lines.push("");
  lines.push(
    csvRow([
      "PAGOS",
      "PEDIDO",
      "FECHA",
      "CLIENTE",
      "MÉTODO",
      "MONTO",
      "REFERENCIA",
    ])
  );

  rows.payments.forEach((payment) => {
    lines.push(
      csvRow([
        payment.id,
        String(
          payment.orders?.order_number ||
            0
        ).padStart(6, "0"),
        payment.paid_at,
        payment.orders?.customers
          ?.company_name ||
          payment.orders?.customers
            ?.full_name ||
          "",
        PAYMENT_METHOD_LABELS[
          payment.payment_method
        ] || payment.payment_method,
        payment.amount,
        payment.reference || "",
      ])
    );
  });

  lines.push("");
  lines.push(
    csvRow([
      "INVENTARIO ACTUAL",
      "SKU",
      "MATERIAL",
      "CATEGORÍA",
      "EXISTENCIA",
      "UNIDAD",
      "MÍNIMO",
      "COSTO UNITARIO",
      "VALOR",
    ])
  );

  rows.inventory.forEach((material) => {
    lines.push(
      csvRow([
        material.id,
        material.sku,
        material.name,
        material.category || "",
        material.current_stock,
        material.unit,
        material.minimum_stock,
        material.unit_cost,
        Number(
          material.current_stock || 0
        ) *
          Number(
            material.unit_cost || 0
          ),
      ])
    );
  });

  return "\uFEFF" + lines.join("\r\n");
}
