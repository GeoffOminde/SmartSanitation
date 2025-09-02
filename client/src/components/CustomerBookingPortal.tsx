import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Smartphone } from "lucide-react";

const bookingSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().min(10, "Valid phone number required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  serviceType: z.string().min(1, "Service type is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(5, "Location must be at least 5 characters"),
  mpesaNumber: z.string().min(10, "Valid M-Pesa number required"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const serviceTypes = [
  { value: "standard", label: "Standard Cleaning", price: 500 },
  { value: "deep", label: "Deep Sanitization", price: 750 },
  { value: "event", label: "Event Package", price: 1200 },
  { value: "construction", label: "Construction Site Package", price: 800 },
];

const timeSlots = [
  "8:00 AM",
  "10:00 AM",
  "12:00 PM",
  "2:00 PM",
  "4:00 PM",
];

export function CustomerBookingPortal() {
  const [selectedService, setSelectedService] = useState<typeof serviceTypes[0] | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      serviceType: "",
      date: "",
      time: "",
      location: "",
      mpesaNumber: "",
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const service = serviceTypes.find(s => s.value === data.serviceType);
      if (!service) throw new Error("Invalid service type");

      const bookingData = {
        ...data,
        operatorId: "default-operator", // In real app, this would be determined by location or selection
        price: service.price + 25, // Include platform fee
        startDate: new Date(`${data.date}T${convertTo24Hour(data.time)}`),
      };

      const response = await apiRequest("POST", "/api/v1/bookings", bookingData);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Booking failed');
      }
      
      return result;
    },
    onSuccess: (data) => {
      if (data.paymentError) {
        toast({
          title: "Booking Created",
          description: `Booking created but payment failed: ${data.paymentError}`,
          variant: "destructive",
        });
      } else if (data.paymentRequest) {
        toast({
          title: "Booking Created Successfully!",
          description: `M-Pesa payment request sent to ${form.getValues('mpesaNumber')}. Check your phone to complete payment.`,
        });
        
        // Start monitoring payment status
        const checkoutId = data.paymentRequest.checkoutId;
        setTimeout(() => checkPaymentStatus(checkoutId), 5000);
      }

      form.reset();
      setSelectedService(null);
      queryClient.invalidateQueries({ queryKey: ["/api/v1/bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkPaymentStatus = async (checkoutId: string) => {
    try {
      const response = await apiRequest("GET", `/api/v1/payments/${checkoutId}/status`);
      const status = await response.json();
      
      if (status.status === 'COMPLETE') {
        toast({
          title: "Payment Successful!",
          description: `Payment of KSh ${status.amount} received. Your booking is confirmed.`,
        });
      } else if (status.status === 'FAILED') {
        toast({
          title: "Payment Failed",
          description: status.failedReason || "Payment was not successful. Please try again.",
          variant: "destructive",
        });
      } else if (status.status === 'PENDING') {
        // Check again in 10 seconds
        setTimeout(() => checkPaymentStatus(checkoutId), 10000);
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
    }
  };

  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    return `${hours}:${minutes}:00`;
  };

  const onSubmit = (data: BookingFormData) => {
    bookingMutation.mutate(data);
  };

  const platformFee = 25;
  const totalPrice = selectedService ? selectedService.price + platformFee : 0;

  return (
    <div className="bg-gradient-to-r from-primary to-blue-600 rounded-lg shadow-lg" data-testid="customer-booking-portal">
      <div className="px-6 py-8 text-center">
        <h2 className="text-2xl font-bold text-primary-foreground mb-4">
          Customer Booking Portal
        </h2>
        <p className="text-primary-foreground/90 mb-6">
          Book mobile sanitation services instantly with M-Pesa payment
        </p>
        
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Booking Form */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Service Booking</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Type</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              const service = serviceTypes.find(s => s.value === value);
                              setSelectedService(service || null);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-service-type">
                                <SelectValue placeholder="Select service type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {serviceTypes.map((service) => (
                                <SelectItem key={service.value} value={service.value}>
                                  {service.label} - KSh {service.price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <Select onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger data-testid="select-time">
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter address or landmark" 
                              {...field} 
                              data-testid="input-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your full name" 
                              {...field} 
                              data-testid="input-customer-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="+254 7XX XXX XXX" 
                              {...field} 
                              data-testid="input-customer-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="your.email@example.com" 
                              {...field} 
                              data-testid="input-customer-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              {/* Pricing and Payment */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Service Summary</h3>
                <Card className="bg-muted mb-4">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Service Fee</span>
                      <span className="font-medium text-foreground">
                        KSh {selectedService?.price.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Platform Fee</span>
                      <span className="font-medium text-foreground">KSh {platformFee}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="text-xl font-bold text-primary" data-testid="text-total-price">
                        KSh {totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* M-Pesa Payment Section */}
                <Card className="border mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center mr-3">
                        <Smartphone className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">M-Pesa Payment</h4>
                        <p className="text-xs text-muted-foreground">Secure mobile money payment</p>
                      </div>
                    </div>
                    <Form {...form}>
                      <FormField
                        control={form.control}
                        name="mpesaNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="Enter M-Pesa number" 
                                {...field} 
                                data-testid="input-mpesa-number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Form>
                  </CardContent>
                </Card>

                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={bookingMutation.isPending || !selectedService}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
                  data-testid="button-book-and-pay"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {bookingMutation.isPending ? "Processing..." : "Book & Pay Now"}
                </Button>

                <p className="text-xs text-muted-foreground mt-3 text-center">
                  You will receive an M-Pesa prompt to complete payment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
