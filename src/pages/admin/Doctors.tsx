import React, { useState } from "react";
import { useHospitalData } from "@/contexts/HospitalDataContext";
import { Stethoscope, Plus, Trash2, KeyRound, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AdminDoctors: React.FC = () => {
  const { doctors, addDoctor, updateDoctor, removeDoctor, resetDoctorPassword } = useHospitalData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [password, setPassword] = useState("");

  const [resetDoctorId, setResetDoctorId] = useState<string | null>(null);
  const [resetDoctorEmail, setResetDoctorEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  const [editDoctorId, setEditDoctorId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSpecialization, setEditSpecialization] = useState("");

  const { toast } = useToast();

  const handleAdd = async () => {
    if (!name || !email || !specialization || !password) return;

    try {
      await addDoctor({ name, email, specialization, password });
      toast({ title: "Doctor Added", description: name });
      setName(""); setEmail(""); setSpecialization(""); setPassword(""); setShowForm(false);
    } catch (error) {
      toast({
        title: "Could not add doctor",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const openResetDialog = (doctorId: string, doctorEmail: string) => {
    setResetDoctorId(doctorId);
    setResetDoctorEmail(doctorEmail);
    setResetPassword("");
    setEditDoctorId(null);
  };

  const handleResetPassword = async () => {
    if (!resetDoctorId || !resetPassword) return;

    try {
      await resetDoctorPassword(resetDoctorId, resetPassword);
      toast({ title: "Password updated", description: resetDoctorEmail });
      setResetDoctorId(null);
      setResetDoctorEmail("");
      setResetPassword("");
    } catch (error) {
      toast({
        title: "Could not reset password",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const openEditDoctor = (doctor: { id: string; name: string; email: string; specialization: string }) => {
    setEditDoctorId(doctor.id);
    setEditName(doctor.name);
    setEditEmail(doctor.email);
    setEditSpecialization(doctor.specialization);
    setResetDoctorId(null);
    setResetDoctorEmail("");
    setResetPassword("");
  };

  const handleUpdateDoctor = async () => {
    if (!editDoctorId) return;
    if (!editName || !editEmail || !editSpecialization) return;

    try {
      await updateDoctor(editDoctorId, {
        name: editName,
        email: editEmail,
        specialization: editSpecialization,
      });
      toast({ title: "Doctor updated", description: editEmail });
      setEditDoctorId(null);
    } catch (error) {
      toast({
        title: "Could not update doctor",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Doctors</h1>
          <p className="text-muted-foreground mt-1">Add, view, and remove doctors</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 text-primary-foreground w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Add Doctor
        </Button>
      </div>

      {editDoctorId && (
        <div className="bg-card border border-border rounded-2xl p-6 card-shadow mb-8">
          <h3 className="font-semibold text-card-foreground mb-4">Edit Doctor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-foreground">Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-foreground">Email</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-foreground">Specialization</Label>
              <Input value={editSpecialization} onChange={(e) => setEditSpecialization(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleUpdateDoctor} className="bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 text-primary-foreground">Save</Button>
            <Button variant="outline" onClick={() => setEditDoctorId(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {resetDoctorId && (
        <div className="bg-card border border-border rounded-2xl p-6 card-shadow mb-8">
          <h3 className="font-semibold text-card-foreground mb-1">Reset Doctor Password</h3>
          <p className="text-sm text-muted-foreground">Existing passwords cannot be viewed. Set a new password for {resetDoctorEmail}.</p>

          <div className="mt-4 max-w-md">
            <Label className="text-foreground">New Password</Label>
            <Input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Enter new password"
              className="mt-1.5"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <Button onClick={handleResetPassword} className="bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 text-primary-foreground">Update</Button>
            <Button variant="outline" onClick={() => { setResetDoctorId(null); setResetDoctorEmail(""); setResetPassword(""); }}>Cancel</Button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 card-shadow mb-8">
          <h3 className="font-semibold text-card-foreground mb-4">New Doctor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-foreground">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Name" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-foreground">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@hospital.com" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-foreground">Specialization</Label>
              <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Cardiology" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-foreground">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set password" className="mt-1.5" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleAdd} className="bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 text-primary-foreground">Save</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Doctor</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Specialization</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                        <Stethoscope className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-card-foreground">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{doc.email}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{doc.specialization}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDoctor(doc)}
                        title="Edit doctor"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openResetDialog(doc.id, doc.email)}
                        title="Reset password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          try {
                            await removeDoctor(doc.id);
                            toast({ title: "Doctor Removed" });
                          } catch (error) {
                            toast({
                              title: "Could not remove doctor",
                              description: error instanceof Error ? error.message : "Please try again",
                              variant: "destructive",
                            });
                          }
                        }}
                        title="Delete doctor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDoctors;
