import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // The page where we integrated the logic
import NotFound from "./pages/NotFound"; // Assuming you have a 404 page
import './App.css'; // Keep base App styles if any

// Create a client for React Query
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Add the regular Toaster for Shadcn UI components */}
      <Toaster /> 
      {/* Add the Sonner component for richer toast notifications */}
      <Sonner /> 
      <BrowserRouter>
        <Routes>
          {/* Route the base path to your Index page */}
          <Route path="/" element={<Index />} />
          
          {/* Catch-all route for 404 Not Found page */}
          <Route path="*" element={<NotFound />} /> 
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
