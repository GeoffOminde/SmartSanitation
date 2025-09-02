import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { getInstaSendClient } from "./instasend";
import { 
  insertTelemetrySchema, 
  insertBookingSchema, 
  insertCustomerSchema,
  insertUnitSchema,
  insertRouteSchema,
  insertMaintenanceLogSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Helper function to broadcast to all connected clients
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // ========== TELEMETRY ENDPOINTS ==========

  // Ingest telemetry data from IoT devices
  app.post("/api/v1/devices/:deviceId/telemetry", async (req, res) => {
    try {
      const { deviceId } = req.params;
      
      // Find unit by serial number
      const units = await storage.getUnits();
      const unit = units.find(u => u.serialNo === deviceId);
      
      if (!unit) {
        return res.status(404).json({ message: "Device not found" });
      }

      const telemetryData = insertTelemetrySchema.parse({
        ...req.body,
        unitId: unit.id,
      });

      const telemetry = await storage.insertTelemetry(telemetryData);
      
      // Update unit location and status if provided
      if (telemetryData.latitude && telemetryData.longitude) {
        await storage.updateUnitLocation(
          unit.id, 
          Number(telemetryData.latitude), 
          Number(telemetryData.longitude)
        );
      }

      // Check if unit needs service and update status
      if (telemetryData.fillLevelPct && telemetryData.fillLevelPct > 85) {
        await storage.updateUnitStatus(unit.id, "needs_service");
      }

      // Broadcast real-time update
      broadcast({
        type: 'telemetry_update',
        unitId: unit.id,
        data: telemetry,
      });

      res.json({ success: true, id: telemetry.id });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== UNITS ENDPOINTS ==========

  // Get all units with optional filtering
  app.get("/api/v1/units", async (req, res) => {
    try {
      const { operatorId, status } = req.query;
      
      let units = await storage.getUnits(operatorId as string);
      
      if (status) {
        units = units.filter(unit => unit.status === status);
      }

      // Get latest telemetry for each unit
      const unitsWithTelemetry = await Promise.all(
        units.map(async (unit) => {
          const latestTelemetry = await storage.getLatestTelemetry(unit.id);
          return {
            ...unit,
            latestTelemetry,
          };
        })
      );

      res.json(unitsWithTelemetry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get unit by ID with telemetry history
  app.get("/api/v1/units/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { from, to } = req.query;
      
      const unit = await storage.getUnit(id);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      let telemetryHistory = [];
      if (from && to) {
        telemetryHistory = await storage.getTelemetryHistory(
          id, 
          new Date(from as string), 
          new Date(to as string)
        );
      }

      res.json({
        ...unit,
        telemetryHistory,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create new unit
  app.post("/api/v1/units", async (req, res) => {
    try {
      const unitData = insertUnitSchema.parse(req.body);
      const unit = await storage.createUnit(unitData);
      
      broadcast({
        type: 'unit_added',
        data: unit,
      });

      res.status(201).json(unit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== BOOKINGS ENDPOINTS ==========

  // Get bookings
  app.get("/api/v1/bookings", async (req, res) => {
    try {
      const { operatorId, limit } = req.query;
      const bookings = await storage.getBookings(
        operatorId as string, 
        limit ? parseInt(limit as string) : undefined
      );
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create booking
  app.post("/api/v1/bookings", async (req, res) => {
    try {
      const bookingData = req.body;
      
      // Check if customer exists, create if not
      let customer = await storage.getCustomerByPhone(bookingData.customerPhone);
      if (!customer) {
        const customerData = insertCustomerSchema.parse({
          name: bookingData.customerName,
          phone: bookingData.customerPhone,
          email: bookingData.customerEmail,
          address: bookingData.location,
        });
        customer = await storage.createCustomer(customerData);
      }

      const booking = await storage.createBooking({
        customerId: customer.id,
        operatorId: bookingData.operatorId,
        serviceType: bookingData.serviceType,
        startDate: new Date(bookingData.startDate),
        location: bookingData.location,
        price: bookingData.price.toString(),
        specialInstructions: bookingData.specialInstructions,
      });

      // Initiate InstaSend M-Pesa STK Push
      try {
        const instaSend = getInstaSendClient();
        const paymentRequest = await instaSend.initiateSTKPush({
          phone_number: bookingData.mpesaNumber,
          amount: bookingData.price,
          narrative: `SmartSan ${bookingData.serviceType} service`,
          host: req.get('host') || 'localhost',
        });

        // Update booking with payment reference
        await storage.updateBookingPayment(booking.id, "pending", paymentRequest.checkout_id);

        res.status(201).json({
          booking,
          paymentRequest: {
            checkoutId: paymentRequest.checkout_id,
            status: paymentRequest.status,
            message: paymentRequest.message,
          },
        });
      } catch (paymentError: any) {
        // If payment initiation fails, still return booking but mark payment as failed
        await storage.updateBookingPayment(booking.id, "failed");
        
        res.status(201).json({
          booking,
          paymentError: paymentError.message,
        });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // InstaSend payment webhook
  app.post("/api/v1/payments/instasend/webhook", async (req, res) => {
    try {
      const {
        checkout_id,
        invoice_id,
        state,
        provider,
        charges,
        net_amount,
        value,
        account,
        api_ref,
        mpesa_reference,
        failed_reason
      } = req.body;
      
      // Find booking by payment reference
      const bookings = await storage.getBookings();
      const booking = bookings.find(b => b.paymentRef === checkout_id);

      if (booking) {
        if (state === "COMPLETE") {
          // Payment successful
          await storage.updateBookingPayment(booking.id, "paid", mpesa_reference || api_ref);
          
          broadcast({
            type: 'payment_success',
            bookingId: booking.id,
            amount: net_amount,
            mpesaRef: mpesa_reference,
          });
        } else if (state === "FAILED") {
          // Payment failed
          await storage.updateBookingPayment(booking.id, "failed");
          
          broadcast({
            type: 'payment_failed',
            bookingId: booking.id,
            reason: failed_reason,
          });
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('InstaSend webhook error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Check payment status endpoint
  app.get("/api/v1/payments/:checkoutId/status", async (req, res) => {
    try {
      const { checkoutId } = req.params;
      const instaSend = getInstaSendClient();
      
      const paymentStatus = await instaSend.checkPaymentStatus(checkoutId);
      
      res.json({
        status: paymentStatus.status,
        amount: paymentStatus.amount,
        mpesaReference: paymentStatus.mpesa_reference,
        failedReason: paymentStatus.failed_reason,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ========== ROUTES ENDPOINTS ==========

  // Get routes
  app.get("/api/v1/routes", async (req, res) => {
    try {
      const { operatorId, date } = req.query;
      const routes = await storage.getRoutes(
        operatorId as string,
        date ? new Date(date as string) : undefined
      );

      // Get route stops for each route
      const routesWithStops = await Promise.all(
        routes.map(async (route) => {
          const stops = await storage.getRouteStops(route.id);
          return { ...route, stops };
        })
      );

      res.json(routesWithStops);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate daily route (basic TSP optimization)
  app.post("/api/v1/routes/daily", async (req, res) => {
    try {
      const { operatorId, maxDistance = 50 } = req.body;
      
      // Get units needing service
      const fillLevels = await storage.getUnitFillLevels(operatorId);
      const unitsNeedingService = fillLevels.filter(level => level.fillLevel > 60);
      
      if (unitsNeedingService.length === 0) {
        return res.json({ message: "No units require service" });
      }

      // Basic route optimization (simplified)
      const route = await storage.createRoute({
        operatorId,
        name: `Daily Route ${new Date().toISOString().split('T')[0]}`,
        scheduledDate: new Date(),
        estimatedDuration: unitsNeedingService.length * 30, // 30 min per unit
        totalDistance: unitsNeedingService.length * 5, // Estimate 5km per unit
      });

      res.json({
        route,
        unitsToService: unitsNeedingService.length,
        estimatedDuration: route.estimatedDuration,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== ANALYTICS ENDPOINTS ==========

  // Get fleet statistics
  app.get("/api/v1/analytics/fleet-stats", async (req, res) => {
    try {
      const { operatorId } = req.query;
      const stats = await storage.getFleetStats(operatorId as string);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get revenue statistics
  app.get("/api/v1/analytics/revenue", async (req, res) => {
    try {
      const { operatorId, from, to } = req.query;
      const stats = await storage.getRevenueStats(
        operatorId as string,
        from ? new Date(from as string) : undefined,
        to ? new Date(to as string) : undefined
      );
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get utilization report
  app.get("/api/v1/reports/utilization", async (req, res) => {
    try {
      const { operatorId, from, to, format = 'json' } = req.query;
      
      const fillLevels = await storage.getUnitFillLevels(operatorId as string);
      const fleetStats = await storage.getFleetStats(operatorId as string);
      
      const report = {
        generatedAt: new Date(),
        period: { from, to },
        averageUtilization: fleetStats.averageUtilization,
        totalUnits: fleetStats.totalUnits,
        activeUnits: fleetStats.activeUnits,
        unitsNeedingService: fleetStats.unitsNeedingService,
        unitDetails: fillLevels,
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csv = [
          'Unit ID,Fill Level,Last Update',
          ...fillLevels.map(level => 
            `${level.unitId},${level.fillLevel},${level.lastUpdate}`
          )
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=utilization-report.csv');
        res.send(csv);
      } else {
        res.json(report);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ========== MAINTENANCE ENDPOINTS ==========

  // Get maintenance logs
  app.get("/api/v1/maintenance", async (req, res) => {
    try {
      const { unitId } = req.query;
      const logs = await storage.getMaintenanceLogs(unitId as string);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create maintenance log
  app.post("/api/v1/maintenance", async (req, res) => {
    try {
      const logData = insertMaintenanceLogSchema.parse(req.body);
      const log = await storage.createMaintenanceLog(logData);
      
      broadcast({
        type: 'maintenance_scheduled',
        data: log,
      });

      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get overdue maintenance units
  app.get("/api/v1/maintenance/overdue", async (req, res) => {
    try {
      const { operatorId } = req.query;
      const units = await storage.getOverdueMaintenanceUnits(operatorId as string);
      res.json(units);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
