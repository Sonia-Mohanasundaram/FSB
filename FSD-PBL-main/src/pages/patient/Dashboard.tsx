import React from "react";
import { useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { useHospitalData } from "@/contexts/HospitalDataContext";
import { CalendarCheck, Stethoscope, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isAppointmentExpired } from "@/lib/utils";

const PatientDashboard: React.FC = () => {
  const { user } = useHospitalAuth();
  const { appointments, doctors } = useHospitalData();
  const navigate = useNavigate();

  const myAppointments = appointments.filter((a) => a.patientId === user?.id);
  const upcoming = myAppointments.filter((a) => a.status === "Booked" && !isAppointmentExpired(a)).length;
  const totalVisits = myAppointments.filter((a) => a.status === "Visited").length;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.name} 👋</h1>
        <p className="text-muted-foreground mt-1">Manage your appointments and health</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-2xl p-6 card-shadow">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mb-4">
            <CalendarCheck className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-foreground">{upcoming}</p>
          <p className="text-sm text-muted-foreground">Upcoming Appointments</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 card-shadow">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-foreground">{doctors.length}</p>
          <p className="text-sm text-muted-foreground">Available Doctors</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 card-shadow">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalVisits}</p>
          <p className="text-sm text-muted-foreground">Total Visits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div onClick={() => navigate("/patient/doctors")} className="group bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <Stethoscope className="h-8 w-8 text-white/80 mb-3" />
          <h3 className="font-semibold text-white text-lg mb-1">Browse Doctors</h3>
          <p className="text-sm text-white/70 mb-4">Find and book appointments with doctors</p>
          <div className="flex items-center text-white/80 text-sm font-medium group-hover:text-white">
            View doctors <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
        <div onClick={() => navigate("/patient/appointments")} className="group bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <CalendarCheck className="h-8 w-8 text-white/80 mb-3" />
          <h3 className="font-semibold text-white text-lg mb-1">My Appointments</h3>
          <p className="text-sm text-white/70 mb-4">View and manage your appointments</p>
          <div className="flex items-center text-white/80 text-sm font-medium group-hover:text-white">
            View all <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
