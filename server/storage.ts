import {
  operators,
  units,
  telemetry,
  customers,
  bookings,
  routes,
  routeStops,
  maintenanceLogs,
  transactions,
  fieldStaff,
  type Operator,
  type InsertOperator,
  type Unit,
  type InsertUnit,
  type Telemetry,
  type InsertTelemetry,
  type Customer,
  type InsertCustomer,
  type Booking,
  type InsertBooking,
  type Route,
  type InsertRoute,
  type RouteStop,
  type MaintenanceLog,
  type InsertMaintenanceLog,
  type Transaction,
  type InsertTransaction,
  type FieldStaff,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, avg, count } from "drizzle-orm";

export interface IStorage {
  // Operators
  getOperator(id: string): Promise<Operator | undefined>;
  createOperator(operator: InsertOperator): Promise<Operator>;
  
  // Units
  getUnits(operatorId?: string): Promise<Unit[]>;
  getUnit(id: string): Promise<Unit | undefined>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  updateUnitLocation(id: string, latitude: number, longitude: number, location?: string): Promise<void>;
  updateUnitStatus(id: string, status: string): Promise<void>;
  
  // Telemetry
  insertTelemetry(telemetryData: InsertTelemetry): Promise<Telemetry>;
  getLatestTelemetry(unitId: string): Promise<Telemetry | undefined>;
  getTelemetryHistory(unitId: string, from: Date, to: Date): Promise<Telemetry[]>;
  getUnitFillLevels(operatorId?: string): Promise<Array<{ unitId: string; fillLevel: number; lastUpdate: Date }>>;
  
  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Bookings
  getBookings(operatorId?: string, limit?: number): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<void>;
  updateBookingPayment(id: string, paymentStatus: string, paymentRef?: string): Promise<void>;
  
  // Routes
  getRoutes(operatorId?: string, date?: Date): Promise<Route[]>;
  getRoute(id: string): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRouteStatus(id: string, status: string): Promise<void>;
  getRouteStops(routeId: string): Promise<RouteStop[]>;
  
  // Maintenance
  getMaintenanceLogs(unitId?: string): Promise<MaintenanceLog[]>;
  createMaintenanceLog(log: InsertMaintenanceLog): Promise<MaintenanceLog>;
  getOverdueMaintenanceUnits(operatorId?: string): Promise<Unit[]>;
  
  // Analytics
  getFleetStats(operatorId?: string): Promise<{
    totalUnits: number;
    activeUnits: number;
    unitsNeedingService: number;
    averageUtilization: number;
  }>;
  
  getRevenueStats(operatorId?: string, from?: Date, to?: Date): Promise<{
    totalRevenue: number;
    transactionCount: number;
    averageBookingValue: number;
  }>;
  
  // Field Staff
  getFieldStaff(operatorId?: string): Promise<FieldStaff[]>;
}

export class DatabaseStorage implements IStorage {
  // Operators
  async getOperator(id: string): Promise<Operator | undefined> {
    const [operator] = await db.select().from(operators).where(eq(operators.id, id));
    return operator;
  }

  async createOperator(insertOperator: InsertOperator): Promise<Operator> {
    const [operator] = await db
      .insert(operators)
      .values(insertOperator)
      .returning();
    return operator;
  }

  // Units
  async getUnits(operatorId?: string): Promise<Unit[]> {
    if (operatorId) {
      return await db.select().from(units).where(eq(units.operatorId, operatorId));
    }
    return await db.select().from(units);
  }

  async getUnit(id: string): Promise<Unit | undefined> {
    const [unit] = await db.select().from(units).where(eq(units.id, id));
    return unit;
  }

  async createUnit(insertUnit: InsertUnit): Promise<Unit> {
    const [unit] = await db
      .insert(units)
      .values(insertUnit)
      .returning();
    return unit;
  }

  async updateUnitLocation(id: string, latitude: number, longitude: number, location?: string): Promise<void> {
    await db
      .update(units)
      .set({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        location,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(units.id, id));
  }

  async updateUnitStatus(id: string, status: string): Promise<void> {
    await db
      .update(units)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(units.id, id));
  }

  // Telemetry
  async insertTelemetry(telemetryData: InsertTelemetry): Promise<Telemetry> {
    const [inserted] = await db
      .insert(telemetry)
      .values(telemetryData)
      .returning();
    return inserted;
  }

  async getLatestTelemetry(unitId: string): Promise<Telemetry | undefined> {
    const [latest] = await db
      .select()
      .from(telemetry)
      .where(eq(telemetry.unitId, unitId))
      .orderBy(desc(telemetry.timestamp))
      .limit(1);
    return latest;
  }

  async getTelemetryHistory(unitId: string, from: Date, to: Date): Promise<Telemetry[]> {
    return await db
      .select()
      .from(telemetry)
      .where(
        and(
          eq(telemetry.unitId, unitId),
          gte(telemetry.timestamp, from),
          lte(telemetry.timestamp, to)
        )
      )
      .orderBy(desc(telemetry.timestamp));
  }

  async getUnitFillLevels(operatorId?: string): Promise<Array<{ unitId: string; fillLevel: number; lastUpdate: Date }>> {
    const query = db
      .select({
        unitId: telemetry.unitId,
        fillLevel: telemetry.fillLevelPct,
        lastUpdate: telemetry.timestamp,
      })
      .from(telemetry)
      .innerJoin(units, eq(telemetry.unitId, units.id))
      .orderBy(desc(telemetry.timestamp));

    if (operatorId) {
      query.where(eq(units.operatorId, operatorId));
    }

    const results = await query;
    
    // Get latest reading for each unit
    const latestReadings = new Map();
    results.forEach(reading => {
      if (!latestReadings.has(reading.unitId) || 
          reading.lastUpdate > latestReadings.get(reading.unitId).lastUpdate) {
        latestReadings.set(reading.unitId, {
          unitId: reading.unitId,
          fillLevel: reading.fillLevel || 0,
          lastUpdate: reading.lastUpdate,
        });
      }
    });

    return Array.from(latestReadings.values());
  }

  // Customers
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
    return customer;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  // Bookings
  async getBookings(operatorId?: string, limit = 50): Promise<Booking[]> {
    const query = db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.createdAt))
      .limit(limit);

    if (operatorId) {
      query.where(eq(bookings.operatorId, operatorId));
    }

    return await query;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async updateBookingStatus(id: string, status: string): Promise<void> {
    await db
      .update(bookings)
      .set({
        bookingStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, id));
  }

  async updateBookingPayment(id: string, paymentStatus: string, paymentRef?: string): Promise<void> {
    await db
      .update(bookings)
      .set({
        paymentStatus,
        paymentRef,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, id));
  }

  // Routes
  async getRoutes(operatorId?: string, date?: Date): Promise<Route[]> {
    const conditions = [];
    if (operatorId) {
      conditions.push(eq(routes.operatorId, operatorId));
    }
    if (date) {
      conditions.push(sql`DATE(${routes.scheduledDate}) = DATE(${date})`);
    }
    
    const query = db
      .select()
      .from(routes)
      .orderBy(desc(routes.scheduledDate));
      
    if (conditions.length > 0) {
      return await query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }
    
    return await query;
  }

  async getRoute(id: string): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route;
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const [route] = await db
      .insert(routes)
      .values(insertRoute)
      .returning();
    return route;
  }

  async updateRouteStatus(id: string, status: string): Promise<void> {
    await db
      .update(routes)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(routes.id, id));
  }

  async getRouteStops(routeId: string): Promise<RouteStop[]> {
    return await db
      .select()
      .from(routeStops)
      .where(eq(routeStops.routeId, routeId))
      .orderBy(routeStops.stopOrder);
  }

  // Maintenance
  async getMaintenanceLogs(unitId?: string): Promise<MaintenanceLog[]> {
    const query = db
      .select()
      .from(maintenanceLogs)
      .orderBy(desc(maintenanceLogs.createdAt));

    if (unitId) {
      query.where(eq(maintenanceLogs.unitId, unitId));
    }

    return await query;
  }

  async createMaintenanceLog(insertLog: InsertMaintenanceLog): Promise<MaintenanceLog> {
    const [log] = await db
      .insert(maintenanceLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getOverdueMaintenanceUnits(operatorId?: string): Promise<Unit[]> {
    // Units that haven't had maintenance in 30+ days or have scheduled maintenance overdue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = db
      .select()
      .from(units)
      .leftJoin(maintenanceLogs, eq(units.id, maintenanceLogs.unitId))
      .where(
        and(
          operatorId ? eq(units.operatorId, operatorId) : sql`1=1`,
          sql`${maintenanceLogs.completedDate} IS NULL OR ${maintenanceLogs.completedDate} < ${thirtyDaysAgo}`
        )
      );

    const results = await query;
    return results.map(result => result.units);
  }

  // Analytics
  async getFleetStats(operatorId?: string): Promise<{
    totalUnits: number;
    activeUnits: number;
    unitsNeedingService: number;
    averageUtilization: number;
  }> {
    const baseQuery = operatorId ? 
      db.select().from(units).where(eq(units.operatorId, operatorId)) :
      db.select().from(units);

    const allUnits = await baseQuery;
    const totalUnits = allUnits.length;
    const activeUnits = allUnits.filter(unit => unit.status === 'active').length;

    // Get fill levels to determine units needing service
    const fillLevels = await this.getUnitFillLevels(operatorId);
    const unitsNeedingService = fillLevels.filter(level => level.fillLevel > 80).length;

    // Calculate average utilization (simplified - based on fill levels)
    const averageUtilization = fillLevels.length > 0 
      ? fillLevels.reduce((sum, level) => sum + level.fillLevel, 0) / fillLevels.length 
      : 0;

    return {
      totalUnits,
      activeUnits,
      unitsNeedingService,
      averageUtilization,
    };
  }

  async getRevenueStats(operatorId?: string, from?: Date, to?: Date): Promise<{
    totalRevenue: number;
    transactionCount: number;
    averageBookingValue: number;
  }> {
    const conditions = [eq(bookings.paymentStatus, 'paid')];
    if (operatorId) {
      conditions.push(eq(bookings.operatorId, operatorId));
    }
    if (from && to) {
      conditions.push(gte(bookings.createdAt, from));
      conditions.push(lte(bookings.createdAt, to));
    }

    const query = db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${bookings.price}), 0)`,
        transactionCount: count(),
        averageBookingValue: avg(bookings.price),
      })
      .from(bookings)
      .where(and(...conditions));

    const [result] = await query;
    
    return {
      totalRevenue: Number(result.totalRevenue) || 0,
      transactionCount: result.transactionCount || 0,
      averageBookingValue: Number(result.averageBookingValue) || 0,
    };
  }

  // Field Staff
  async getFieldStaff(operatorId?: string): Promise<FieldStaff[]> {
    const query = db.select().from(fieldStaff);
    
    if (operatorId) {
      query.where(eq(fieldStaff.operatorId, operatorId));
    }

    return await query;
  }
}

export const storage = new DatabaseStorage();
