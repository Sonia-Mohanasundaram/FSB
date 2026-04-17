import React from "react";
import { useHospitalData } from "@/contexts/HospitalDataContext";
import { Stethoscope, Users, CalendarCheck, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isAppointmentExpired } from "@/lib/utils";

const AdminDashboardPage: React.FC = () => {
  const { doctors, patients, appointments } = useHospitalData();
  const navigate = useNavigate();

  const todayBookings = appointments.filter((a) => a.status === "Booked" && !isAppointmentExpired(a)).length;

  const stats = [
    { label: "Total Doctors", value: doctors.length, icon: Stethoscope, gradient: "from-primary to-blue-600" },
    { label: "Total Patients", value: patients.length, icon: Users, gradient: "from-emerald-500 to-teal-600" },
    { label: "Active Bookings", value: todayBookings, icon: CalendarCheck, gradient: "from-purple-500 to-indigo-600" },
    { label: "Total Appointments", value: appointments.length, icon: TrendingUp, gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Hospital overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="relative overflow-hidden bg-card border border-border rounded-2xl p-6 card-shadow hover:card-shadow-md transition-all">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.gradient} opacity-10 rounded-full -translate-y-4 translate-x-4`} />
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-4 shadow-lg`}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => navigate("/admin/doctors")} className="group bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <Stethoscope className="h-8 w-8 text-white/80 mb-3" />
          <h3 className="font-semibold text-white text-lg">Manage Doctors</h3>
          <p className="text-sm text-white/70 mt-1">Add or remove doctors</p>
        </div>
        <div onClick={() => navigate("/admin/appointments")} className="group bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <CalendarCheck className="h-8 w-8 text-white/80 mb-3" />
          <h3 className="font-semibold text-white text-lg">Appointments</h3>
          <p className="text-sm text-white/70 mt-1">View and manage all appointments</p>
        </div>
        <div onClick={() => navigate("/admin/patients")} className="group bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <Users className="h-8 w-8 text-white/80 mb-3" />
          <h3 className="font-semibold text-white text-lg">Patients</h3>
          <p className="text-sm text-white/70 mt-1">View registered patients</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
