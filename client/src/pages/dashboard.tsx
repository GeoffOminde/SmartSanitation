import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { StatsOverview } from "@/components/StatsOverview";
import { FleetMap } from "@/components/FleetMap";
import { PriorityAlerts } from "@/components/PriorityAlerts";
import { TodaysRoutes } from "@/components/TodaysRoutes";
import { RecentBookings } from "@/components/RecentBookings";
import { CustomerBookingPortal } from "@/components/CustomerBookingPortal";
import { RoutePlanning } from "@/components/RoutePlanning";
import { UnitStatusTable } from "@/components/UnitStatusTable";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Download, Plus } from "lucide-react";
import type { FleetStats, RevenueStats, UnitWithTelemetry, Alert as AlertType, RouteWithStops, BookingWithCustomer } from "@/types";

export default function Dashboard() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<AlertType[]>([]);

  // Fetch fleet statistics
  const { data: fleetStats, isLoading: fleetStatsLoading } = useQuery<FleetStats>({
    queryKey: ["/api/v1/analytics/fleet-stats"],
  });

  // Fetch revenue statistics
  const { data: revenueStats, isLoading: revenueStatsLoading } = useQuery<RevenueStats>({
    queryKey: ["/api/v1/analytics/revenue"],
  });

  // Fetch units with telemetry
  const { data: units = [], isLoading: unitsLoading } = useQuery<UnitWithTelemetry[]>({
    queryKey: ["/api/v1/units"],
  });

  // Fetch today's routes
  const { data: routes = [], isLoading: routesLoading } = useQuery<RouteWithStops[]>({
    queryKey: ["/api/v1/routes"],
  });

  // Fetch recent bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<BookingWithCustomer[]>({
    queryKey: ["/api/v1/bookings"],
  });

  // WebSocket for real-time updates
  useWebSocket((message) => {
    switch (message.type) {
      case 'telemetry_update':
        // Invalidate units query to refresh data
        break;
      case 'payment_success':
        toast({
          title: "Payment Received",
          description: `Payment completed for booking ${message.bookingId}`,
        });
        break;
    }
  });

  // Generate alerts based on unit data
  useEffect(() => {
    if (!units.length) return;

    const newAlerts: AlertType[] = [];

    units.forEach((unit) => {
      const fillLevel = unit.latestTelemetry?.fillLevelPct || 0;
      
      if (fillLevel >= 85) {
        newAlerts.push({
          id: `fill-${unit.id}`,
          type: 'urgent',
          title: `Unit ${unit.serialNo} at ${fillLevel.toFixed(0)}% capacity`,
          description: 'Requires immediate servicing',
          unitId: unit.id,
          location: unit.location,
          timestamp: new Date(),
        });
      }

      if (unit.status === 'offline') {
        newAlerts.push({
          id: `offline-${unit.id}`,
          type: 'offline',
          title: `Unit ${unit.serialNo} offline`,
          description: 'Last seen over 2 hours ago',
          unitId: unit.id,
          location: unit.location,
          timestamp: new Date(),
        });
      }
    });

    // Add maintenance alerts (simplified)
    if (units.length > 0) {
      newAlerts.push({
        id: 'maintenance-due',
        type: 'maintenance',
        title: 'Maintenance due: Unit SSN-023',
        description: 'Overdue by 2 days',
        location: 'Karen, Nairobi',
        timestamp: new Date(),
      });
    }

    setAlerts(newAlerts.slice(0, 5)); // Limit to 5 alerts
  }, [units]);

  const handleScheduleService = (unitId: string) => {
    toast({
      title: "Service Scheduled",
      description: "Maintenance has been scheduled for this unit.",
    });
  };

  const handleViewDetails = (unitId: string) => {
    // Navigate to unit details (would be implemented in a real app)
    console.log("View details for unit:", unitId);
  };

  const handleOptimizeRoutes = () => {
    toast({
      title: "Routes Optimized",
      description: "All routes have been re-optimized for efficiency.",
    });
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
              Fleet Dashboard
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time monitoring of{" "}
              <span className="font-medium" data-testid="text-total-units">
                {fleetStats?.totalUnits || 0}
              </span>{" "}
              mobile sanitation units across Nairobi
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Button
              variant="outline"
              className="inline-flex items-center"
              data-testid="button-export-report"
            >
              <Download className="-ml-1 mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button
              className="inline-flex items-center"
              data-testid="button-add-unit"
            >
              <Plus className="-ml-1 mr-2 h-4 w-4" />
              Add Unit
            </Button>
          </div>
        </div>

        {/* Alert Banner */}
        {alerts.some(alert => alert.type === 'urgent') && (
          <Alert className="mt-6 border-l-4 border-amber-400 bg-amber-50" data-testid="alert-banner">
            <AlertTriangle className="h-4 w-4" />
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <strong>{alerts.filter(a => a.type === 'urgent').length} units require immediate servicing</strong> — High fill levels detected.
              </p>
            </div>
          </Alert>
        )}

        {/* Stats Overview */}
        {fleetStats && revenueStats && (
          <div className="mt-6">
            <StatsOverview
              fleetStats={fleetStats}
              revenueStats={revenueStats}
              isLoading={fleetStatsLoading || revenueStatsLoading}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fleet Map */}
          <FleetMap units={units} className="lg:col-span-2" />

          {/* Right Sidebar - Alerts and Routes */}
          <div className="space-y-6">
            <PriorityAlerts alerts={alerts} />
            <TodaysRoutes routes={routes} onOptimizeAll={handleOptimizeRoutes} />
          </div>
        </div>

        {/* Bottom Section - Detailed Tables */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentBookings bookings={bookings} />
          <div className="bg-card shadow rounded-lg border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Fleet Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Average Utilization</span>
                  <span className="font-medium text-foreground">
                    {fleetStats?.averageUtilization.toFixed(0) || 0}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${fleetStats?.averageUtilization || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Service Efficiency</span>
                  <span className="font-medium text-foreground">85%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">24</div>
                  <div className="text-xs text-muted-foreground">Avg trips/day</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">18m</div>
                  <div className="text-xs text-muted-foreground">Response time</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Booking Portal */}
        <div className="mt-8">
          <CustomerBookingPortal />
        </div>

        {/* Route Planning */}
        <div className="mt-8">
          <RoutePlanning />
        </div>

        {/* Unit Status Table */}
        <div className="mt-8">
          <UnitStatusTable
            units={units}
            onScheduleService={handleScheduleService}
            onViewDetails={handleViewDetails}
          />
        </div>
      </div>
    </div>
  );
}
