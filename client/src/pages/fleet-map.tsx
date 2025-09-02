import { useQuery } from "@tanstack/react-query";
import { FleetMap } from "@/components/FleetMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Filter, RefreshCw } from "lucide-react";
import type { UnitWithTelemetry } from "@/types";

export default function FleetMapPage() {
  const { data: units = [], isLoading, refetch } = useQuery<UnitWithTelemetry[]>({
    queryKey: ["/api/v1/units"],
  });

  const getLocationStats = () => {
    const locationCounts = units.reduce((acc, unit) => {
      const location = unit.location || "Unknown";
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locationCounts).map(([location, count]) => ({
      location,
      count,
      needsService: units.filter(u => 
        u.location === location && (u.latestTelemetry?.fillLevelPct || 0) >= 80
      ).length,
    }));
  };

  const locationStats = getLocationStats();

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
              Fleet Map
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time location and status monitoring for all units
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              data-testid="button-refresh-map"
            >
              <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              data-testid="button-map-filters"
            >
              <Filter className="-ml-1 mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Map */}
          <div className="lg:col-span-3">
            <FleetMap units={units} />
          </div>

          {/* Location Summary */}
          <div className="space-y-6">
            <Card data-testid="card-location-summary">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Location Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {locationStats.map((stat) => (
                      <div 
                        key={stat.location}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                        data-testid={`location-stat-${stat.location.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {stat.location}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {stat.count} units
                            </p>
                          </div>
                        </div>
                        {stat.needsService > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {stat.needsService} urgent
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-map-controls">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Map Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    View Mode
                  </label>
                  <Select defaultValue="status">
                    <SelectTrigger data-testid="select-view-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status">Status View</SelectItem>
                      <SelectItem value="routes">Active Routes</SelectItem>
                      <SelectItem value="bookings">Booking Locations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status Filter
                  </label>
                  <Select defaultValue="all">
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Units</SelectItem>
                      <SelectItem value="urgent">Urgent Only</SelectItem>
                      <SelectItem value="available">Available Only</SelectItem>
                      <SelectItem value="offline">Offline Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" data-testid="button-center-map">
                  <MapPin className="mr-2 h-4 w-4" />
                  Center on Fleet
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
