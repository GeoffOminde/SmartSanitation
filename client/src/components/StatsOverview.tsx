import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, AlertCircle, TrendingUp, Users } from "lucide-react";
import { FleetStats, RevenueStats } from "@/types";

interface StatsOverviewProps {
  fleetStats: FleetStats;
  revenueStats: RevenueStats;
  isLoading?: boolean;
}

export function StatsOverview({ fleetStats, revenueStats, isLoading }: StatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-6 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded mb-3"></div>
              <div className="h-4 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      name: "Active Units",
      value: fleetStats.activeUnits,
      icon: Building2,
      color: "text-primary",
      change: "+2.1%",
      changeLabel: "from yesterday",
      positive: true,
    },
    {
      name: "Needs Service",
      value: fleetStats.unitsNeedingService,
      icon: AlertCircle,
      color: "text-amber-500",
      change: `${Math.max(0, fleetStats.unitsNeedingService - 5)} urgent`,
      changeLabel: "require attention",
      positive: false,
    },
    {
      name: "Today's Revenue",
      value: `KSh ${revenueStats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-accent",
      change: "+12.3%",
      changeLabel: "vs last week",
      positive: true,
    },
    {
      name: "Active Bookings",
      value: revenueStats.transactionCount,
      icon: Users,
      color: "text-blue-500",
      change: "14 pending",
      changeLabel: "payment",
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name} className="overflow-hidden shadow border border-border" data-testid={`card-stat-${stat.name.toLowerCase().replace(/\s+/g, '-')}`}>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-medium text-foreground" data-testid={`text-${stat.name.toLowerCase().replace(/\s+/g, '-')}-value`}>
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <div className="bg-muted px-5 py-3">
            <div className="text-sm">
              <Badge 
                variant={stat.positive ? "default" : "destructive"}
                className={stat.positive ? "bg-accent text-accent-foreground" : ""}
              >
                {stat.change}
              </Badge>
              <span className="text-muted-foreground ml-2">{stat.changeLabel}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
