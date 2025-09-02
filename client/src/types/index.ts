export interface FleetStats {
  totalUnits: number;
  activeUnits: number;
  unitsNeedingService: number;
  averageUtilization: number;
}

export interface RevenueStats {
  totalRevenue: number;
  transactionCount: number;
  averageBookingValue: number;
}

export interface UnitWithTelemetry {
  id: string;
  serialNo: string;
  model: string;
  status: string;
  location: string;
  latitude: number;
  longitude: number;
  latestTelemetry?: {
    fillLevelPct: number;
    batteryVoltage: number;
    temperature: number;
    timestamp: Date;
  };
}

export interface Alert {
  id: string;
  type: 'urgent' | 'maintenance' | 'offline' | 'info';
  title: string;
  description: string;
  unitId?: string;
  location?: string;
  timestamp: Date;
}

export interface RouteWithStops {
  id: string;
  name: string;
  status: string;
  assignedStaffId?: string;
  scheduledDate: Date;
  estimatedDuration: number;
  efficiency?: number;
  stops: {
    id: string;
    unitId: string;
    stopOrder: number;
    estimatedArrival?: Date;
    serviceCompleted: boolean;
  }[];
}

export interface BookingWithCustomer {
  id: string;
  serviceType: string;
  startDate: Date;
  location: string;
  price: number;
  paymentStatus: string;
  bookingStatus: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
}

export interface WebSocketMessage {
  type: 'telemetry_update' | 'payment_success' | 'unit_added' | 'maintenance_scheduled';
  data?: any;
  unitId?: string;
  bookingId?: string;
}
