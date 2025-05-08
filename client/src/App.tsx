import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Docs from "@/pages/docs";
import Privacy from "@/pages/privacy";
import Footer from "@/components/footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/docs" component={Docs} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <Footer />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
