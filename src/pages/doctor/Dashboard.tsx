import React, { useState } from "react";
import { useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { useHospitalData } from "@/contexts/HospitalDataContext";
import { Clock, Plus, Trash2, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { isAppointmentExpired } from "@/lib/utils";

const DoctorDashboard: React.FC = () => {
  const { user } = useHospitalAuth();
  const { getSlotsByDoctor, appointments } = useHospitalData();
  const navigate = useNavigate();

  const mySlots = user ? getSlotsByDoctor(user.id) : [];
  const myAppointments = appointments.filter((a) => a.doctorId === user?.id);
  const todayBookings = myAppointments.filter((a) => a.status === "Booked" && !isAppointmentExpired(a)).length;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.name} 👋</h1>
        <p className="text-muted-foreground mt-1">Manage your availability and appointments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-2xl p-6 card-shadow">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-foreground">{mySlots.length}</p>
          <p className="text-sm text-muted-foreground">Total Slots</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 card-shadow">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mb-4">
            <CalendarCheck className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-foreground">{todayBookings}</p>
          <p className="text-sm text-muted-foreground">Active Bookings</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 card-shadow">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
            <CalendarCheck className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-foreground">{myAppointments.filter((a) => a.status === "Visited").length}</p>
          <p className="text-sm text-muted-foreground">Completed Visits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div onClick={() => navigate("/doctor/availability")} className="group bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <Plus className="h-8 w-8 text-white/80 mb-3" />
          <h3 className="font-semibold text-white text-lg mb-1">Set Availability</h3>
          <p className="text-sm text-white/70 mb-4">Add or remove time slots for patients</p>
        </div>
        <div onClick={() => navigate("/doctor/schedule")} className="group bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <CalendarCheck className="h-8 w-8 text-white/80 mb-3" />
          <h3 className="font-semibold text-white text-lg mb-1">My Schedule</h3>
          <p className="text-sm text-white/70 mb-4">View your booked appointments</p>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
