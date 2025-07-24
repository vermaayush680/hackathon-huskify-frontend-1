import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { setPlatformInStorage, getCurrentPlatform } from "@/utils/platform";
import { useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Homepage from "./pages/Homepage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PlatformAwareRoutes = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Store platform from URL when component mounts
    const platform = getCurrentPlatform();
    if (platform) {
      setPlatformInStorage(platform);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Homepage - shows platform selection */}
      <Route path="/" element={<Homepage />} />
      
      {/* Platform-based routes */}
      <Route 
        path="/:platform" 
        element={user ? <DashboardProvider><Index /></DashboardProvider> : <Login />} 
      />
      <Route 
        path="/:platform/login" 
        element={user ? <DashboardProvider><Index /></DashboardProvider> : <Login />} 
      />
      
      {/* Legacy login route (redirects to homepage) */}
      <Route path="/login" element={<Homepage />} />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PlatformAwareRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
