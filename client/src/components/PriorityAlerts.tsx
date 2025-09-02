import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/types";
import { AlertTriangle, Wrench, WifiOff, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PriorityAlertsProps {
  alerts: Alert[];
}

export function PriorityAlerts({ alerts }: PriorityAlertsProps) {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'urgent':
        return AlertTriangle;
      case 'maintenance':
        return Wrench;
      case 'offline':
        return WifiOff;
      default:
        return Info;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'urgent':
        return {
          container: "bg-red-50 border-l-4 border-destructive",
          icon: "text-destructive",
          title: "text-destructive",
        };
      case 'maintenance':
        return {
          container: "bg-amber-50 border-l-4 border-amber-400",
          icon: "text-amber-600",
          title: "text-amber-800",
        };
      case 'offline':
        return {
          container: "bg-blue-50 border-l-4 border-primary",
          icon: "text-primary",
          title: "text-primary",
        };
      default:
        return {
          container: "bg-gray-50 border-l-4 border-gray-400",
          icon: "text-gray-600",
          title: "text-gray-800",
        };
    }
  };

  if (alerts.length === 0) {
    return (
      <Card data-testid="card-priority-alerts">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Priority Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No active alerts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-priority-alerts">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Priority Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const styles = getAlertStyles(alert.type);
            
            return (
              <div
                key={alert.id}
                className={`flex items-start space-x-3 p-3 rounded-md ${styles.container}`}
                data-testid={`alert-${alert.type}-${alert.id}`}
              >
                <Icon className={`h-5 w-5 mt-0.5 ${styles.icon}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${styles.title}`}>
                    {alert.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.location && `${alert.location} • `}
                    {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                  </p>
                  {alert.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
