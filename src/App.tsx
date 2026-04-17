import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { HospitalAuthProvider, useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { HospitalDataProvider, useHospitalData } from "@/contexts/HospitalDataContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import HospitalLanding from "@/pages/HospitalLanding";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/NotFound";

import PatientLayout from "@/components/layout/PatientLayout";
import PatientDashboard from "@/pages/patient/Dashboard";
import PatientDoctors from "@/pages/patient/Doctors";
import PatientAppointments from "@/pages/patient/Appointments";

import DoctorLayout from "@/components/layout/DoctorLayout";
import DoctorDashboard from "@/pages/doctor/Dashboard";
import DoctorAvailability from "@/pages/doctor/Availability";
import DoctorSchedule from "@/pages/doctor/Schedule";

import HospitalAdminLayout from "@/components/layout/HospitalAdminLayout";
import AdminDashboardPage from "@/pages/admin/HospitalDashboard";
import AdminDoctors from "@/pages/admin/Doctors";
import AdminAppointments from "@/pages/admin/Appointments";
import AdminPatients from "@/pages/admin/Patients";

const queryClient = new QueryClient();

const BackendStatusBanner: React.FC = () => {
  const { backendError, clearBackendError, isLoading, retryLoadData } = useHospitalData();

  if (isLoading || !backendError) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-2xl">
      <Alert variant="destructive" className="bg-destructive text-destructive-foreground border-none shadow-xl">
        <AlertTitle>Backend Connection Required</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{backendError}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                retryLoadData().catch(() => {
                  // Error message is set in context.
                });
              }}
              className="text-xs font-semibold underline underline-offset-2 hover:opacity-90"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={clearBackendError}
              className="text-xs font-medium underline underline-offset-2 hover:opacity-90"
            >
              Dismiss
            </button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; role: string }> = ({ children, role }) => {
  const { user, isAuthenticated } = useHospitalAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HospitalLanding />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    <Route path="/patient" element={<ProtectedRoute role="patient"><PatientLayout /></ProtectedRoute>}>
      <Route path="dashboard" element={<PatientDashboard />} />
      <Route path="doctors" element={<PatientDoctors />} />
      <Route path="appointments" element={<PatientAppointments />} />
    </Route>

    <Route path="/doctor" element={<ProtectedRoute role="doctor"><DoctorLayout /></ProtectedRoute>}>
      <Route path="dashboard" element={<DoctorDashboard />} />
      <Route path="availability" element={<DoctorAvailability />} />
      <Route path="schedule" element={<DoctorSchedule />} />
    </Route>

    <Route path="/admin" element={<ProtectedRoute role="admin"><HospitalAdminLayout /></ProtectedRoute>}>
      <Route path="dashboard" element={<AdminDashboardPage />} />
      <Route path="doctors" element={<AdminDoctors />} />
      <Route path="appointments" element={<AdminAppointments />} />
      <Route path="patients" element={<AdminPatients />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <HospitalAuthProvider>
        <HospitalDataProvider>
          <TooltipProvider>
            <BackendStatusBanner />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </HospitalDataProvider>
      </HospitalAuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
