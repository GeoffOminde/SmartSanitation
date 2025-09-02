import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { UnitWithTelemetry } from "@/types";

interface FleetMapProps {
  units: UnitWithTelemetry[];
  className?: string;
}

export function FleetMap({ units, className }: FleetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // Simulate map initialization
  useEffect(() => {
    if (mapRef.current) {
      // In a real implementation, this would initialize Leaflet map
      console.log('Initializing map with units:', units.length);
    }
  }, [units]);

  const getStatusColor = (fillLevel: number) => {
    if (fillLevel >= 85) return "bg-destructive";
    if (fillLevel >= 60) return "bg-amber-500";
    return "bg-accent";
  };

  const getStatusLabel = (fillLevel: number) => {
    if (fillLevel >= 85) return "Full";
    if (fillLevel >= 60) return "Filling";
    return "Available";
  };

  return (
    <Card className={className} data-testid="card-fleet-map">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Fleet Overview</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-accent text-accent-foreground"
              data-testid="button-all-units"
            >
              All Units
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid="button-service-routes"
            >
              Service Routes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Map Container */}
        <div 
          ref={mapRef}
          className="h-96 bg-muted rounded-lg relative overflow-hidden border"
          data-testid="map-container"
        >
          {/* Placeholder for interactive map */}
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Interactive Fleet Map</p>
              <p className="text-sm">Showing {units.length} active units</p>
              <p className="text-xs mt-2 text-muted-foreground">
                Map integration with Leaflet will be initialized here
              </p>
            </div>
          </div>
          
          {/* Map Legend */}
          <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg">
            <div className="text-xs font-medium text-foreground mb-2">Status Legend</div>
            <div className="space-y-1">
              <div className="flex items-center" data-testid="legend-available">
                <div className="w-3 h-3 bg-accent rounded-full mr-2"></div>
                <span className="text-xs text-muted-foreground">Available (0-60%)</span>
              </div>
              <div className="flex items-center" data-testid="legend-filling">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                <span className="text-xs text-muted-foreground">Filling (60-85%)</span>
              </div>
              <div className="flex items-center" data-testid="legend-full">
                <div className="w-3 h-3 bg-destructive rounded-full mr-2"></div>
                <span className="text-xs text-muted-foreground">Full (85%+)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unit Status Summary */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          {[
            { label: "Available", color: "bg-accent", count: units.filter(u => (u.latestTelemetry?.fillLevelPct || 0) < 60).length },
            { label: "Filling", color: "bg-amber-500", count: units.filter(u => (u.latestTelemetry?.fillLevelPct || 0) >= 60 && (u.latestTelemetry?.fillLevelPct || 0) < 85).length },
            { label: "Full", color: "bg-destructive", count: units.filter(u => (u.latestTelemetry?.fillLevelPct || 0) >= 85).length },
          ].map((status) => (
            <div key={status.label} className="text-center">
              <div className={`w-4 h-4 ${status.color} rounded-full mx-auto mb-1`}></div>
              <div className="text-sm font-medium">{status.count}</div>
              <div className="text-xs text-muted-foreground">{status.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
