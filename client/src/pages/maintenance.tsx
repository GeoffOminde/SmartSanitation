import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { 
  Wrench, 
  Plus, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Filter,
  Search
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { MaintenanceLog, Unit } from "@shared/schema";

const maintenanceSchema = z.object({
  unitId: z.string().min(1, "Unit is required"),
  maintenanceType: z.string().min(1, "Maintenance type is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  cost: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

const maintenanceTypes = [
  "Routine Service",
  "Deep Cleaning",
  "Pump Maintenance",
  "Door Repair",
  "Sensor Calibration",
  "Emergency Repair",
  "Preventive Maintenance",
];

export default function MaintenancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: maintenanceLogs = [], isLoading } = useQuery<MaintenanceLog[]>({
    queryKey: ["/api/v1/maintenance"],
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/v1/units"],
  });

  const { data: overdueUnits = [] } = useQuery<Unit[]>({
    queryKey: ["/api/v1/maintenance/overdue"],
  });

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      unitId: "",
      maintenanceType: "",
      description: "",
      scheduledDate: "",
      cost: "",
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      const maintenanceData = {
        ...data,
        scheduledDate: new Date(data.scheduledDate),
        cost: data.cost ? parseFloat(data.cost) : undefined,
      };
      const response = await apiRequest("POST", "/api/v1/maintenance", maintenanceData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Maintenance Scheduled",
        description: "Maintenance has been scheduled successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/v1/maintenance"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Schedule Maintenance",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'in_progress':
        return <Clock className="h-3 w-3 mr-1" />;
      case 'scheduled':
        return <Calendar className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const filteredLogs = maintenanceLogs.filter(log => {
    const matchesSearch = searchQuery === "" || 
      log.maintenanceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const onSubmit = (data: MaintenanceFormData) => {
    createMaintenanceMutation.mutate(data);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
              Maintenance Management
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Schedule and track maintenance activities for optimal fleet performance
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="inline-flex items-center" data-testid="button-schedule-maintenance">
                  <Plus className="-ml-1 mr-2 h-4 w-4" />
                  Schedule Maintenance
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule Maintenance</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="unitId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-maintenance-unit">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.serialNo} - {unit.location || 'Unknown location'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maintenanceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maintenance Type</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-maintenance-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {maintenanceTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scheduled Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} data-testid="input-scheduled-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the maintenance work required..."
                              {...field}
                              data-testid="textarea-maintenance-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Cost (KSh)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              {...field}
                              data-testid="input-maintenance-cost"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        data-testid="button-cancel-maintenance"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMaintenanceMutation.isPending}
                        data-testid="button-submit-maintenance"
                      >
                        {createMaintenanceMutation.isPending ? "Scheduling..." : "Schedule"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Overdue Units Alert */}
        {overdueUnits.length > 0 && (
          <Card className="mb-6 border-l-4 border-destructive bg-red-50" data-testid="card-overdue-alerts">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-destructive mr-3" />
                <div>
                  <p className="font-medium text-destructive">
                    {overdueUnits.length} units have overdue maintenance
                  </p>
                  <p className="text-sm text-muted-foreground">
                    These units require immediate attention to prevent service disruption
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search maintenance logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-maintenance"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-maintenance-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Logs */}
        <Card data-testid="card-maintenance-logs">
          <CardHeader>
            <CardTitle>Maintenance History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Maintenance Records</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all" 
                    ? "No maintenance logs match your search criteria"
                    : "Start by scheduling maintenance for your units"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => {
                  const unit = units.find(u => u.id === log.unitId);
                  
                  return (
                    <div
                      key={log.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      data-testid={`maintenance-log-${log.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-foreground">{log.maintenanceType}</h3>
                            <Badge className={getStatusColor(log.status || 'scheduled')}>
                              {getStatusIcon(log.status || 'scheduled')}
                              {(log.status || 'scheduled').replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Unit: {unit?.serialNo || 'Unknown'} • {unit?.location || 'Unknown location'}
                          </p>
                          {log.description && (
                            <p className="text-sm text-foreground">{log.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {log.cost && (
                            <p className="text-lg font-bold text-foreground">
                              KSh {Number(log.cost).toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {log.scheduledDate 
                              ? formatDistanceToNow(new Date(log.scheduledDate), { addSuffix: true })
                              : 'No date set'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          {log.scheduledDate && (
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              Scheduled: {new Date(log.scheduledDate).toLocaleDateString()}
                            </div>
                          )}
                          {log.completedDate && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed: {new Date(log.completedDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {log.status === 'scheduled' && (
                          <Button size="sm" variant="outline" data-testid={`button-start-maintenance-${log.id}`}>
                            Start Work
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
