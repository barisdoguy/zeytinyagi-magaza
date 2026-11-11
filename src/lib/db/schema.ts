import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** Site içeriği ve ayarlar: tanımlar kodda (content/definitions.ts), değerler burada. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/** Düzenlenebilir sayfalar (yasal metinler, SSS). */
export const pages = sqliteTable("pages", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  updatedAt: integer("updated_at").notNull(),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary").notNull().default(""),
  description: text("description").notNull().default(""),
  /** Her satır bir özellik. */
  features: text("features").notNull().default(""),
  imageFile: text("image_file"),
  imageAlt: text("image_alt").notNull().default(""),
  status: text("status", { enum: ["draft", "active", "archived"] }).notNull().default("draft"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const variants = sqliteTable(
  "variants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    volumeMl: integer("volume_ml"),
    packaging: text("packaging").notNull().default(""),
    sku: text("sku").notNull().default(""),
    /** KDV dahil satış fiyatı, kuruş. Boşsa varyant satın alınamaz. */
    priceKurus: integer("price_kurus"),
    stock: integer("stock").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const coupons = sqliteTable("coupons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["percent", "fixed"] }).notNull(),
  /** percent: 1–100, fixed: kuruş. */
  value: integer("value").notNull(),
  minSubtotalKurus: integer("min_subtotal_kurus").notNull().default(0),
  startsAt: integer("starts_at"),
  endsAt: integer("ends_at"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    number: text("number").notNull().unique(),
    /** Müşterinin sipariş sayfasını görmesi için gizli belirteç. */
    accessToken: text("access_token").notNull(),
    status: text("status").notNull().default("pending_payment"),
    customerName: text("customer_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    addressLine: text("address_line").notNull(),
    postalCode: text("postal_code").notNull().default(""),
    note: text("note").notNull().default(""),
    subtotalKurus: integer("subtotal_kurus").notNull(),
    discountKurus: integer("discount_kurus").notNull().default(0),
    shippingKurus: integer("shipping_kurus").notNull(),
    totalKurus: integer("total_kurus").notNull(),
    couponCode: text("coupon_code"),
    paymentProvider: text("payment_provider").notNull(),
    paymentRef: text("payment_ref"),
    /** Stok bu sipariş için düşüldü mü (iptal/iadede geri eklenir). */
    stockCommitted: integer("stock_committed", { mode: "boolean" }).notNull().default(false),
    carrier: text("carrier").notNull().default(""),
    trackingNumber: text("tracking_number").notNull().default(""),
    customerIp: text("customer_ip").notNull().default(""),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    paidAt: integer("paid_at"),
  },
  (t) => [index("orders_status_idx").on(t.status), index("orders_created_idx").on(t.createdAt)],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: integer("variant_id"),
    productName: text("product_name").notNull(),
    variantLabel: text("variant_label").notNull(),
    unitPriceKurus: integer("unit_price_kurus").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalKurus: integer("line_total_kurus").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/** Ödeme bildirimleri: (sağlayıcı, olay kimliği) tekil olduğu için yinelenen bildirim ikinci kez işlenmez. */
export const paymentEvents = sqliteTable(
  "payment_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    orderNumber: text("order_number").notNull(),
    outcome: text("outcome").notNull(),
    result: text("result").notNull().default(""),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("payment_events_unique").on(t.provider, t.eventId)],
);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "staff"] }).notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Belirtecin SHA-256 özeti; belirtecin kendisi saklanmaz. */
    tokenHash: text("token_hash").notNull().unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const loginAttempts = sqliteTable(
  "login_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("login_attempts_key_idx").on(t.key, t.createdAt)],
);

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id"),
    userEmail: text("user_email").notNull().default(""),
    action: text("action").notNull(),
    entity: text("entity").notNull().default(""),
    entityId: text("entity_id").notNull().default(""),
    detail: text("detail").notNull().default(""),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export const contactMessages = sqliteTable("contact_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  handled: integer("handled", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
});

export type Product = typeof products.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type User = typeof users.$inferSelect;
export type Page = typeof pages.$inferSelect;
