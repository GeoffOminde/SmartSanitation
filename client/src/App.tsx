import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/dashboard";
import FleetMap from "@/pages/fleet-map";
import Routes from "@/pages/routes";
import Bookings from "@/pages/bookings";
import Analytics from "@/pages/analytics";
import Maintenance from "@/pages/maintenance";
import NotFound from "@/pages/not-found";
import { CustomerBookingPortal } from "@/components/CustomerBookingPortal";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/fleet-map" component={FleetMap} />
        <Route path="/routes" component={Routes} />
        <Route path="/bookings" component={Bookings} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/maintenance" component={Maintenance} />
        <Route path="/book" component={CustomerBookingPortal} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
