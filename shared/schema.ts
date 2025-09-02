import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  uuid,
  real,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Operators table
export const operators = pgTable("operators", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  companyName: varchar("company_name", { length: 255 }),
  subscriptionTier: varchar("subscription_tier", { length: 50 }).default("starter"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Field staff table
export const fieldStaff = pgTable("field_staff", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: uuid("operator_id").notNull().references(() => operators.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }).notNull(),
  role: varchar("role", { length: 50 }).default("driver"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Units table
export const units = pgTable("units", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: uuid("operator_id").notNull().references(() => operators.id),
  serialNo: varchar("serial_no", { length: 100 }).notNull().unique(),
  model: varchar("model", { length: 100 }),
  installDate: timestamp("install_date"),
  status: varchar("status", { length: 50 }).default("active"), // active, idle, maintenance, offline
  lastSeenAt: timestamp("last_seen_at"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Telemetry table (TimescaleDB hypertable)
export const telemetry = pgTable("telemetry", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: uuid("unit_id").notNull().references(() => units.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  fillLevelPct: real("fill_level_pct"),
  doorOpenCount: integer("door_open_count"),
  batteryVoltage: real("battery_voltage"),
  temperature: real("temperature"),
  airQuality: real("air_quality"),
  gpsSpeed: real("gps_speed"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
}, (table) => [
  index("idx_telemetry_unit_timestamp").on(table.unitId, table.timestamp),
  index("idx_telemetry_timestamp").on(table.timestamp),
]);

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }).notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  operatorId: uuid("operator_id").notNull().references(() => operators.id),
  unitId: uuid("unit_id").references(() => units.id),
  serviceType: varchar("service_type", { length: 100 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: varchar("location", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // pending, paid, failed, refunded
  paymentRef: varchar("payment_ref", { length: 255 }),
  bookingStatus: varchar("booking_status", { length: 50 }).default("confirmed"), // confirmed, in_progress, completed, cancelled
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Routes table
export const routes = pgTable("routes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: uuid("operator_id").notNull().references(() => operators.id),
  name: varchar("name", { length: 255 }).notNull(),
  assignedStaffId: uuid("assigned_staff_id").references(() => fieldStaff.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: varchar("status", { length: 50 }).default("scheduled"), // scheduled, in_progress, completed, cancelled
  estimatedDuration: integer("estimated_duration"), // minutes
  actualDuration: integer("actual_duration"), // minutes
  totalDistance: real("total_distance"), // kilometers
  efficiency: real("efficiency"), // percentage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Route stops table
export const routeStops = pgTable("route_stops", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: uuid("route_id").notNull().references(() => routes.id),
  unitId: uuid("unit_id").notNull().references(() => units.id),
  stopOrder: integer("stop_order").notNull(),
  estimatedArrival: timestamp("estimated_arrival"),
  actualArrival: timestamp("actual_arrival"),
  serviceCompleted: boolean("service_completed").default(false),
  notes: text("notes"),
});

// Maintenance logs table
export const maintenanceLogs = pgTable("maintenance_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: uuid("unit_id").notNull().references(() => units.id),
  staffId: uuid("staff_id").references(() => fieldStaff.id),
  maintenanceType: varchar("maintenance_type", { length: 100 }).notNull(),
  description: text("description"),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  status: varchar("status", { length: 50 }).default("scheduled"), // scheduled, in_progress, completed, cancelled
  cost: decimal("cost", { precision: 10, scale: 2 }),
  partsUsed: jsonb("parts_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id").references(() => bookings.id),
  operatorId: uuid("operator_id").notNull().references(() => operators.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("KES"),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // mpesa, card, cash
  paymentRef: varchar("payment_ref", { length: 255 }),
  status: varchar("status", { length: 50 }).default("pending"),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const operatorsRelations = relations(operators, ({ many }) => ({
  units: many(units),
  fieldStaff: many(fieldStaff),
  bookings: many(bookings),
  routes: many(routes),
  transactions: many(transactions),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  operator: one(operators, {
    fields: [units.operatorId],
    references: [operators.id],
  }),
  telemetry: many(telemetry),
  bookings: many(bookings),
  routeStops: many(routeStops),
  maintenanceLogs: many(maintenanceLogs),
}));

export const telemetryRelations = relations(telemetry, ({ one }) => ({
  unit: one(units, {
    fields: [telemetry.unitId],
    references: [units.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  customer: one(customers, {
    fields: [bookings.customerId],
    references: [customers.id],
  }),
  operator: one(operators, {
    fields: [bookings.operatorId],
    references: [operators.id],
  }),
  unit: one(units, {
    fields: [bookings.unitId],
    references: [units.id],
  }),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  operator: one(operators, {
    fields: [routes.operatorId],
    references: [operators.id],
  }),
  assignedStaff: one(fieldStaff, {
    fields: [routes.assignedStaffId],
    references: [fieldStaff.id],
  }),
  stops: many(routeStops),
}));

export const routeStopsRelations = relations(routeStops, ({ one }) => ({
  route: one(routes, {
    fields: [routeStops.routeId],
    references: [routes.id],
  }),
  unit: one(units, {
    fields: [routeStops.unitId],
    references: [units.id],
  }),
}));

// Insert schemas
export const insertOperatorSchema = createInsertSchema(operators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTelemetrySchema = createInsertSchema(telemetry).omit({
  id: true,
  timestamp: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceLogSchema = createInsertSchema(maintenanceLogs).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type Operator = typeof operators.$inferSelect;
export type InsertOperator = z.infer<typeof insertOperatorSchema>;
export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Telemetry = typeof telemetry.$inferSelect;
export type InsertTelemetry = z.infer<typeof insertTelemetrySchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type RouteStop = typeof routeStops.$inferSelect;
export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type InsertMaintenanceLog = z.infer<typeof insertMaintenanceLogSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type FieldStaff = typeof fieldStaff.$inferSelect;
