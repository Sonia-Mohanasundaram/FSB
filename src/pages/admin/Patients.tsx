import React from "react";
import { useHospitalData } from "@/contexts/HospitalDataContext";
import { Users } from "lucide-react";

const AdminPatients: React.FC = () => {
  const { patients, appointments } = useHospitalData();

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground mb-2">Patients</h1>
      <p className="text-muted-foreground mb-8">All registered patients</p>

      {patients.length === 0 ? (
        <div className="bg-muted/50 rounded-2xl p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">No patients yet</p>
          <p className="text-muted-foreground">Patients will appear here after booking</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden card-shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Patient ID</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Appointments</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-card-foreground font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{p.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {appointments.filter((a) => a.patientId === p.id).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPatients;
