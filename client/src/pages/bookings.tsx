import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Calendar, MapPin, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { BookingWithCustomer } from "@/types";

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: bookings = [], isLoading } = useQuery<BookingWithCustomer[]>({
    queryKey: ["/api/v1/bookings"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = searchQuery === "" || 
      booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || booking.bookingStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingBookings = filteredBookings.filter(b => b.bookingStatus === 'confirmed');
  const activeBookings = filteredBookings.filter(b => b.bookingStatus === 'in_progress');
  const completedBookings = filteredBookings.filter(b => b.bookingStatus === 'completed');

  const BookingCard = ({ booking }: { booking: BookingWithCustomer }) => (
    <Card key={booking.id} data-testid={`card-booking-${booking.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(booking.customer.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-foreground">{booking.customer.name}</h3>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Phone className="h-3 w-3 mr-1" />
                {booking.customer.phone}
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {booking.location}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">KSh {booking.price.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(booking.startDate), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Badge className={getStatusColor(booking.bookingStatus)}>
              {booking.bookingStatus.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className={getPaymentStatusColor(booking.paymentStatus)}>
              {booking.paymentStatus}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {booking.serviceType}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
              Bookings Management
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track and manage customer service bookings
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Button variant="outline" data-testid="button-export-bookings">
              <Download className="-ml-1 mr-2 h-4 w-4" />
              Export
            </Button>
            <Button data-testid="button-new-booking">
              <Calendar className="-ml-1 mr-2 h-4 w-4" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookings, customers, locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-bookings"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-booking-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{pendingBookings.length}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{activeBookings.length}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{completedBookings.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                KSh {filteredBookings.reduce((sum, b) => sum + b.price, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-bookings">All Bookings</TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending-bookings">Pending</TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active-bookings">Active</TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed-bookings">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Bookings Found</h3>
                    <p className="text-muted-foreground">
                      No bookings match your current filters
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="space-y-4">
              {pendingBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="space-y-4">
              {activeBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-4">
              {completedBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
