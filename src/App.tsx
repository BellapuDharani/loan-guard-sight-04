import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Login } from "@/pages/auth/Login";
import { BorrowerDashboard } from "@/pages/borrower/Dashboard";
import { Upload } from "@/pages/borrower/Upload";
import { Status } from "@/pages/borrower/Status";
import { OfficerDashboard } from "@/pages/officer/Dashboard";
import { Loans } from "@/pages/officer/Loans";
import { Alerts } from "@/pages/officer/Alerts";
import { Verification } from "@/pages/officer/Verification";
import { LoanManagement } from "@/pages/officer/LoanManagement";
import { Settings } from "@/pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'officer' ? '/officer/dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        user ? (
          <Navigate to={user.role === 'officer' ? '/officer/dashboard' : '/dashboard'} replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      {/* Borrower Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['user']}>
          <BorrowerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/upload" element={
        <ProtectedRoute allowedRoles={['user']}>
          <Upload />
        </ProtectedRoute>
      } />
      <Route path="/status" element={
        <ProtectedRoute allowedRoles={['user']}>
          <Status />
        </ProtectedRoute>
      } />

      {/* Officer Routes */}
      <Route path="/officer/dashboard" element={
        <ProtectedRoute allowedRoles={['officer']}>
          <OfficerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/officer/loans" element={
        <ProtectedRoute allowedRoles={['officer']}>
          <Loans />
        </ProtectedRoute>
      } />
      <Route path="/officer/loan-management" element={
        <ProtectedRoute allowedRoles={['officer']}>
          <LoanManagement />
        </ProtectedRoute>
      } />
      <Route path="/officer/alerts" element={
        <ProtectedRoute allowedRoles={['officer']}>
          <Alerts />
        </ProtectedRoute>
      } />
      <Route path="/officer/verification" element={
        <ProtectedRoute allowedRoles={['officer']}>
          <Verification />
        </ProtectedRoute>
      } />
      
      {/* Settings (both roles) */}
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

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
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
