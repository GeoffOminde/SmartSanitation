import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RouteWithStops } from "@/types";

interface TodaysRoutesProps {
  routes: RouteWithStops[];
  onOptimizeAll?: () => void;
}

export function TodaysRoutes({ routes, onOptimizeAll }: TodaysRoutesProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-accent text-accent-foreground';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'scheduled':
        return 'Scheduled';
      default:
        return status;
    }
  };

  const calculateProgress = (route: RouteWithStops) => {
    if (route.stops.length === 0) return 0;
    const completedStops = route.stops.filter(stop => stop.serviceCompleted).length;
    return (completedStops / route.stops.length) * 100;
  };

  return (
    <Card data-testid="card-todays-routes">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Today's Routes</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80"
            onClick={onOptimizeAll}
            data-testid="button-optimize-all"
          >
            Optimize All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {routes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No routes scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {routes.map((route, index) => {
              const progress = calculateProgress(route);
              const completedStops = route.stops.filter(stop => stop.serviceCompleted).length;
              
              return (
                <div
                  key={route.id}
                  className="border border-border rounded-lg p-4"
                  data-testid={`route-${route.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                        R{index + 1}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-foreground">
                          {route.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Driver: {route.assignedStaffId ? `Staff ${route.assignedStaffId.slice(0, 8)}` : 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(route.status)}>
                      {getStatusLabel(route.status)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Units:</span>
                      <span className="ml-1 font-medium">{route.stops.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-1 font-medium">
                        {route.estimatedDuration ? `${Math.round(route.estimatedDuration / 60)}h ${route.estimatedDuration % 60}m` : 'TBD'}
                      </span>
                    </div>
                  </div>

                  {route.status === 'in_progress' && (
                    <div>
                      <Progress value={progress} className="w-full h-2 mb-1" />
                      <p className="text-xs text-muted-foreground">
                        {completedStops} of {route.stops.length} units completed
                      </p>
                    </div>
                  )}
                  
                  {route.efficiency && (
                    <div className="mt-2 text-xs">
                      <span className="text-muted-foreground">Efficiency:</span>
                      <span className="ml-1 font-medium text-accent">{route.efficiency}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
