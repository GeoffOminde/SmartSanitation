import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Route, Plus, Play, Pause, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { RouteWithStops } from "@/types";

export default function RoutesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: routes = [], isLoading } = useQuery<RouteWithStops[]>({
    queryKey: ["/api/v1/routes"],
  });

  const generateRouteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/v1/routes/daily", {
        operatorId: "default-operator",
        maxDistance: 50,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Route Generated",
        description: "New optimized route has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/routes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Generate Route",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRouteStatusMutation = useMutation({
    mutationFn: async ({ routeId, status }: { routeId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/v1/routes/${routeId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/routes"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (route: RouteWithStops) => {
    if (route.stops.length === 0) return 0;
    const completedStops = route.stops.filter(stop => stop.serviceCompleted).length;
    return (completedStops / route.stops.length) * 100;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const todaysRoutes = routes.filter(route => {
    const today = new Date();
    const routeDate = new Date(route.scheduledDate);
    return routeDate.toDateString() === today.toDateString();
  });

  const upcomingRoutes = routes.filter(route => {
    const today = new Date();
    const routeDate = new Date(route.scheduledDate);
    return routeDate > today;
  });

  const completedRoutes = routes.filter(route => route.status === 'completed');

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
              Route Management
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Plan, optimize, and track service routes for maximum efficiency
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button
              onClick={() => generateRouteMutation.mutate()}
              disabled={generateRouteMutation.isPending}
              className="inline-flex items-center"
              data-testid="button-generate-route"
            >
              <Plus className="-ml-1 mr-2 h-4 w-4" />
              {generateRouteMutation.isPending ? "Generating..." : "Generate Route"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="today" data-testid="tab-today">Today</TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <div className="grid gap-6">
              {todaysRoutes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Routes Today</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate optimized routes based on current unit status
                    </p>
                    <Button
                      onClick={() => generateRouteMutation.mutate()}
                      disabled={generateRouteMutation.isPending}
                      data-testid="button-generate-first-route"
                    >
                      Generate Today's Routes
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                todaysRoutes.map((route) => {
                  const progress = calculateProgress(route);
                  const completedStops = route.stops.filter(stop => stop.serviceCompleted).length;
                  
                  return (
                    <Card key={route.id} data-testid={`card-route-${route.id}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-medium">{route.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {route.stops.length} stops • 
                              {route.estimatedDuration ? ` ${formatDuration(route.estimatedDuration)}` : ' Duration TBD'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(route.status)}>
                              {route.status.replace('_', ' ').toLowerCase()}
                            </Badge>
                            {route.status === 'scheduled' && (
                              <Button
                                size="sm"
                                onClick={() => updateRouteStatusMutation.mutate({ 
                                  routeId: route.id, 
                                  status: 'in_progress' 
                                })}
                                data-testid={`button-start-route-${route.id}`}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Start
                              </Button>
                            )}
                            {route.status === 'in_progress' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRouteStatusMutation.mutate({ 
                                  routeId: route.id, 
                                  status: 'completed' 
                                })}
                                data-testid={`button-complete-route-${route.id}`}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {route.status === 'in_progress' && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span>Progress</span>
                              <span>{completedStops} of {route.stops.length} completed</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        )}

                        <div className="space-y-3">
                          <h4 className="font-medium text-foreground">Route Stops</h4>
                          {route.stops.map((stop, index) => (
                            <div
                              key={stop.id}
                              className="flex items-center justify-between p-3 border border-border rounded-lg"
                              data-testid={`stop-${stop.id}`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                                  {stop.stopOrder}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Unit {stop.unitId.slice(0, 8)}</p>
                                  {stop.estimatedArrival && (
                                    <p className="text-xs text-muted-foreground">
                                      ETA: {new Date(stop.estimatedArrival).toLocaleTimeString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {stop.serviceCompleted ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            {upcomingRoutes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No upcoming routes scheduled</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {upcomingRoutes.map((route) => (
                  <Card key={route.id} data-testid={`card-upcoming-route-${route.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-medium">{route.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Scheduled for {new Date(route.scheduledDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(route.status)}>
                          {route.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {route.stops.length} stops planned
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {completedRoutes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No completed routes yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {completedRoutes.map((route) => (
                  <Card key={route.id} data-testid={`card-completed-route-${route.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-medium">{route.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Completed {formatDistanceToNow(new Date(route.scheduledDate), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Units Serviced:</span>
                          <span className="ml-1 font-medium">{route.stops.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="ml-1 font-medium">
                            {route.actualDuration ? formatDuration(route.actualDuration) : 'N/A'}
                          </span>
                        </div>
                      </div>
                      {route.efficiency && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Efficiency:</span>
                          <span className="ml-1 font-medium text-accent">{route.efficiency}%</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
