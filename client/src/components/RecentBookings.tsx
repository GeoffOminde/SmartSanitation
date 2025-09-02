import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { BookingWithCustomer } from "@/types";

interface RecentBookingsProps {
  bookings: BookingWithCustomer[];
}

export function RecentBookings({ bookings }: RecentBookingsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-accent text-accent-foreground';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
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

  return (
    <Card data-testid="card-recent-bookings">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Recent Bookings</CardTitle>
          <Link href="/bookings">
            <a className="text-sm text-primary hover:text-primary/80 font-medium" data-testid="link-view-all-bookings">
              View all
            </a>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent bookings</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((booking) => (
                  <tr key={booking.id} data-testid={`row-booking-${booking.id}`}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-foreground">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(booking.customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="font-medium">{booking.customer.name}</p>
                          <p className="text-muted-foreground text-xs">{booking.customer.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {booking.location}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      KSh {booking.price.toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <Badge className={getStatusColor(booking.bookingStatus)}>
                          {booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}
                        </Badge>
                        {booking.paymentStatus !== 'paid' && (
                          <Badge className={getPaymentStatusColor(booking.paymentStatus)} variant="outline">
                            {booking.paymentStatus === 'pending' ? 'Payment Pending' : booking.paymentStatus}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
