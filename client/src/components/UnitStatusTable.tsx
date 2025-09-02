import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarPlus, Info, MapPin } from "lucide-react";
import { UnitWithTelemetry } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface UnitStatusTableProps {
  units: UnitWithTelemetry[];
  onScheduleService?: (unitId: string) => void;
  onViewDetails?: (unitId: string) => void;
}

export function UnitStatusTable({ units, onScheduleService, onViewDetails }: UnitStatusTableProps) {
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getStatusColor = (fillLevel: number, unitStatus: string) => {
    if (unitStatus === 'offline') {
      return {
        color: "bg-gray-100 text-gray-800",
        icon: "wifi-slash",
        label: "Offline",
      };
    }

    if (fillLevel >= 85) {
      return {
        color: "bg-red-100 text-red-800",
        icon: "exclamation-circle",
        label: "Urgent",
      };
    }

    if (fillLevel >= 60) {
      return {
        color: "bg-amber-100 text-amber-800",
        icon: "exclamation-triangle",
        label: "Needs Service",
      };
    }

    return {
      color: "bg-green-100 text-green-800",
      icon: "check-circle",
      label: "Good",
    };
  };

  const getFillLevelColor = (fillLevel: number) => {
    if (fillLevel >= 85) return "bg-destructive";
    if (fillLevel >= 60) return "bg-amber-500";
    return "bg-accent";
  };

  // Get unique locations for filter
  const locations = Array.from(new Set(units.map(unit => unit.location).filter(Boolean)));

  // Filter units
  const filteredUnits = units.filter(unit => {
    const locationMatch = locationFilter === "all" || unit.location === locationFilter;
    const statusMatch = statusFilter === "all" || 
      (statusFilter === "needs_service" && (unit.latestTelemetry?.fillLevelPct || 0) >= 60) ||
      (statusFilter === "good" && (unit.latestTelemetry?.fillLevelPct || 0) < 60) ||
      (statusFilter === "offline" && unit.status === 'offline');
    
    return locationMatch && statusMatch;
  });

  return (
    <Card data-testid="card-unit-status-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Unit Status Overview</CardTitle>
          <div className="flex space-x-2">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-40" data-testid="select-location-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="needs_service">Needs Service</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredUnits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No units match the selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Unit ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fill Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last Update
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUnits.map((unit) => {
                  const fillLevel = unit.latestTelemetry?.fillLevelPct || 0;
                  const lastUpdate = unit.latestTelemetry?.timestamp || unit.updatedAt || unit.createdAt;
                  const status = getStatusColor(fillLevel, unit.status);
                  
                  return (
                    <tr
                      key={unit.id}
                      className="hover:bg-muted"
                      data-testid={`row-unit-${unit.serialNo}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {unit.serialNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {unit.location || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        <div className="flex items-center">
                          <div className="w-full bg-muted rounded-full h-2 mr-3 max-w-20">
                            <div
                              className={`h-2 rounded-full ${getFillLevelColor(fillLevel)}`}
                              style={{ width: `${fillLevel}%` }}
                            />
                          </div>
                          <span className={`font-medium ${fillLevel >= 85 ? 'text-destructive' : fillLevel >= 60 ? 'text-amber-600' : 'text-accent'}`}>
                            {fillLevel.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {lastUpdate 
                          ? formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })
                          : "Never"
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onScheduleService?.(unit.id)}
                            className="text-primary hover:text-primary/80"
                            data-testid={`button-schedule-service-${unit.serialNo}`}
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails?.(unit.id)}
                            className="text-muted-foreground hover:text-foreground"
                            data-testid={`button-view-details-${unit.serialNo}`}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
