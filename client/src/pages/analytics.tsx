import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Truck, Calendar, Download } from "lucide-react";
import type { FleetStats, RevenueStats } from "@/types";

export default function AnalyticsPage() {
  const { data: fleetStats, isLoading: fleetLoading } = useQuery<FleetStats>({
    queryKey: ["/api/v1/analytics/fleet-stats"],
  });

  const { data: revenueStats, isLoading: revenueLoading } = useQuery<RevenueStats>({
    queryKey: ["/api/v1/analytics/revenue"],
  });

  // Mock data for analytics charts
  const weeklyRevenue = [
    { day: 'Mon', revenue: 18500 },
    { day: 'Tue', revenue: 22100 },
    { day: 'Wed', revenue: 19800 },
    { day: 'Thu', revenue: 24350 },
    { day: 'Fri', revenue: 21700 },
    { day: 'Sat', revenue: 28900 },
    { day: 'Sun', revenue: 26200 },
  ];

  const utilizationData = [
    { area: 'Westlands', utilization: 85, units: 25 },
    { area: 'Kilimani', utilization: 78, units: 18 },
    { area: 'Karen', utilization: 92, units: 22 },
    { area: 'CBD', utilization: 67, units: 15 },
    { area: 'Eastlands', utilization: 73, units: 20 },
  ];

  if (fleetLoading || revenueLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
              Analytics Dashboard
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Comprehensive insights into fleet performance and business metrics
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Select defaultValue="7days">
              <SelectTrigger className="w-40" data-testid="select-time-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" data-testid="button-export-analytics">
              <Download className="-ml-1 mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-revenue">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">
                    KSh {revenueStats?.totalRevenue.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">+12.5%</span>
                    <span className="text-muted-foreground ml-1">vs last week</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-active-units">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Units</p>
                  <p className="text-2xl font-bold text-foreground">
                    {fleetStats?.activeUnits || 0}
                  </p>
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground">
                      {((fleetStats?.activeUnits || 0) / (fleetStats?.totalUnits || 1) * 100).toFixed(1)}% operational
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-utilization">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Avg Utilization</p>
                  <p className="text-2xl font-bold text-foreground">
                    {fleetStats?.averageUtilization.toFixed(1) || 0}%
                  </p>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">+3.2%</span>
                    <span className="text-muted-foreground ml-1">vs last month</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-bookings">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold text-foreground">
                    {revenueStats?.transactionCount || 0}
                  </p>
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground">
                      KSh {revenueStats?.averageBookingValue.toFixed(0) || 0} avg value
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="utilization" data-testid="tab-utilization">Utilization</TabsTrigger>
            <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
            <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card data-testid="card-revenue-chart">
                <CardHeader>
                  <CardTitle>Weekly Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {weeklyRevenue.map((day) => (
                      <div key={day.day} className="flex flex-col items-center">
                        <div
                          className="w-8 bg-primary rounded-t"
                          style={{
                            height: `${(day.revenue / Math.max(...weeklyRevenue.map(d => d.revenue))) * 200}px`,
                          }}
                        ></div>
                        <span className="text-xs text-muted-foreground mt-2">{day.day}</span>
                        <span className="text-xs font-medium">
                          {(day.revenue / 1000).toFixed(0)}k
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fleet Health */}
              <Card data-testid="card-fleet-health">
                <CardHeader>
                  <CardTitle>Fleet Health Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Units Operational</span>
                      <span className="font-medium">
                        {fleetStats?.activeUnits}/{fleetStats?.totalUnits}
                      </span>
                    </div>
                    <Progress 
                      value={((fleetStats?.activeUnits || 0) / (fleetStats?.totalUnits || 1)) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Service Required</span>
                      <span className="font-medium text-destructive">
                        {fleetStats?.unitsNeedingService}
                      </span>
                    </div>
                    <Progress 
                      value={((fleetStats?.unitsNeedingService || 0) / (fleetStats?.totalUnits || 1)) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average Fill Level</span>
                      <span className="font-medium">
                        {fleetStats?.averageUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={fleetStats?.averageUtilization || 0} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="utilization" className="space-y-6">
            <Card data-testid="card-area-utilization">
              <CardHeader>
                <CardTitle>Utilization by Area</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {utilizationData.map((area) => (
                    <div
                      key={area.area}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                      data-testid={`area-utilization-${area.area.toLowerCase()}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-foreground">{area.area}</p>
                          <p className="text-sm text-muted-foreground">{area.units} units</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32">
                          <Progress value={area.utilization} className="h-2" />
                        </div>
                        <span className="font-medium text-foreground w-12 text-right">
                          {area.utilization}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="card-revenue-breakdown">
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Service Fees</span>
                    <span className="font-medium">KSh {((revenueStats?.totalRevenue || 0) * 0.95).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Platform Fees</span>
                    <span className="font-medium">KSh {((revenueStats?.totalRevenue || 0) * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-bold text-primary">
                        KSh {revenueStats?.totalRevenue.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-payment-methods">
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">M-Pesa</span>
                    <Badge className="bg-green-100 text-green-800">92%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Card Payment</span>
                    <Badge variant="outline">6%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cash</span>
                    <Badge variant="outline">2%</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-growth-metrics">
                <CardHeader>
                  <CardTitle>Growth Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Monthly Growth</span>
                      <div className="flex items-center">
                        <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                        <span className="text-green-600 font-medium">+15.2%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Customer Retention</span>
                      <span className="font-medium">87%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Avg Booking Value</span>
                      <span className="font-medium">
                        KSh {revenueStats?.averageBookingValue.toFixed(0) || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-efficiency-metrics">
                <CardHeader>
                  <CardTitle>Operational Efficiency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Route Efficiency</span>
                      <span className="font-bold text-foreground">89%</span>
                    </div>
                    <Progress value={89} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Average optimization vs manual planning
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Service Response Time</span>
                      <span className="font-bold text-foreground">18 min</span>
                    </div>
                    <Progress value={75} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: 15 minutes
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Maintenance Compliance</span>
                      <span className="font-bold text-foreground">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Units serviced on schedule
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-cost-analysis">
                <CardHeader>
                  <CardTitle>Cost Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">KSh 12.50</div>
                      <div className="text-xs text-muted-foreground">Cost per service</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">KSh 450</div>
                      <div className="text-xs text-muted-foreground">Daily operational cost</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fuel & Transport</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Labor</span>
                      <span className="font-medium">35%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Maintenance</span>
                      <span className="font-medium">15%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Other</span>
                      <span className="font-medium">5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
