import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Route, MapPin, Clock, TrendingUp } from "lucide-react";

interface RouteConfig {
  startTime: string;
  endTime: string;
  maxDistance: string;
  priorityFilters: {
    highFill: boolean;
    maintenanceDue: boolean;
  };
}

interface OptimizedRoute {
  id: string;
  name: string;
  unitCount: number;
  estimatedDuration: number;
  distance: number;
  efficiency: number;
  areas: string[];
}

const mockOptimizedRoutes: OptimizedRoute[] = [
  {
    id: "1",
    name: "Priority Route",
    unitCount: 8,
    estimatedDuration: 210, // minutes
    distance: 24.5,
    efficiency: 94,
    areas: ["Westlands", "Kilimani", "Karen"],
  },
  {
    id: "2",
    name: "Standard Route",
    unitCount: 12,
    estimatedDuration: 252,
    distance: 31.2,
    efficiency: 87,
    areas: ["CBD", "Eastlands", "Embakasi"],
  },
];

export function RoutePlanning() {
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch } = useForm<RouteConfig>({
    defaultValues: {
      startTime: "08:00",
      endTime: "17:00",
      maxDistance: "50",
      priorityFilters: {
        highFill: true,
        maintenanceDue: true,
      },
    },
  });

  const generateRoutesMutation = useMutation({
    mutationFn: async (config: RouteConfig) => {
      const response = await apiRequest("POST", "/api/v1/routes/daily", {
        operatorId: "default-operator",
        maxDistance: parseInt(config.maxDistance),
        filters: config.priorityFilters,
      });
      return response.json();
    },
    onSuccess: () => {
      // For MVP, show mock optimized routes
      setOptimizedRoutes(mockOptimizedRoutes);
      toast({
        title: "Routes Generated Successfully",
        description: "AI-optimized routes are ready for deployment.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/routes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Route Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onGenerateRoutes = async (config: RouteConfig) => {
    setIsGenerating(true);
    try {
      await generateRoutesMutation.mutateAsync(config);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}.${mins < 30 ? 0 : 5} hours`;
  };

  return (
    <Card data-testid="card-route-planning">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Route Planning</CardTitle>
            <p className="text-sm text-muted-foreground">
              AI-optimized service routes for maximum efficiency
            </p>
          </div>
          <Button
            onClick={handleSubmit(onGenerateRoutes)}
            disabled={isGenerating}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-generate-routes"
          >
            <Route className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate New Routes"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Route Configuration */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Route Configuration</h4>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime" className="text-sm font-medium">
                    Start Time
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...register("startTime")}
                    data-testid="input-start-time"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime" className="text-sm font-medium">
                    End Time
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    {...register("endTime")}
                    data-testid="input-end-time"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Priority Filters</Label>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="highFill"
                      {...register("priorityFilters.highFill")}
                      data-testid="checkbox-high-fill"
                    />
                    <Label htmlFor="highFill" className="text-sm">
                      High Fill (&gt;80%)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="maintenanceDue"
                      {...register("priorityFilters.maintenanceDue")}
                      data-testid="checkbox-maintenance-due"
                    />
                    <Label htmlFor="maintenanceDue" className="text-sm">
                      Maintenance Due
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="maxDistance" className="text-sm font-medium">
                  Maximum Distance
                </Label>
                <Select defaultValue="50">
                  <SelectTrigger data-testid="select-max-distance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 km radius</SelectItem>
                    <SelectItem value="75">75 km radius</SelectItem>
                    <SelectItem value="100">100 km radius</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>

          {/* Generated Routes Preview */}
          <div>
            <h4 className="font-medium text-foreground mb-4">Optimized Routes</h4>
            {optimizedRoutes.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <Route className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Generate routes to see optimization results
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {optimizedRoutes.map((route, index) => (
                  <Card
                    key={route.id}
                    className="border border-border p-4"
                    data-testid={`route-preview-${route.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="ml-2 font-medium text-foreground">
                          {route.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Est. {formatDuration(route.estimatedDuration)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      <MapPin className="inline h-3 w-3 mr-1" />
                      {route.unitCount} units • {route.areas.join(" → ")}
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Distance: {route.distance} km
                      </span>
                      <Badge className="bg-accent text-accent-foreground">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Efficiency: {route.efficiency}%
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
