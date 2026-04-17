import React, { useState } from "react";
import { useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { useHospitalData } from "@/contexts/HospitalDataContext";
import { Stethoscope, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { compareSlotsByDateTime, formatMinutesToTimeLabel, getTimeRangeLabel, parseTimeLabelToMinutes } from "@/lib/utils";

const PatientDoctors: React.FC = () => {
  const { user } = useHospitalAuth();
  const { doctors, getSlotsByDoctor, bookAppointment } = useHospitalData();
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<15 | 30>(15);
  const { toast } = useToast();

  const selectedDoc = doctors.find((d) => d.id === selectedDoctor);
  const doctorSlots = selectedDoctor ? getSlotsByDoctor(selectedDoctor) : [];
  const slotIndex = new Map<string, (typeof doctorSlots)[number]>();
  doctorSlots.forEach((s) => slotIndex.set(`${s.date}__${s.time}`, s));

  const availableSlots = selectedDoctor
    ? doctorSlots
        .filter((s) => !s.isBooked)
        .filter((s) => {
          if (durationMinutes === 15) return true;
          const start = parseTimeLabelToMinutes(s.time);
          if (start === null) return false;
          const nextTime = formatMinutesToTimeLabel(start + 15);
          const next = slotIndex.get(`${s.date}__${nextTime}`);
          return Boolean(next && !next.isBooked);
        })
        .slice()
        .sort(compareSlotsByDateTime)
    : [];

  const handleBook = async (slotId: string) => {
    if (!user || !selectedDoc) return;
    const slot = availableSlots.find((s) => s.id === slotId);
    if (!slot) return;

    try {
      const ok = await bookAppointment({
        patientId: user.id,
        patientName: user.name,
        doctorId: selectedDoc.id,
        doctorName: selectedDoc.name,
        slotId: slot.id,
        date: slot.date,
        time: slot.time,
        durationMinutes,
      });
      if (ok) {
        const start = parseTimeLabelToMinutes(slot.time);
        const endLabel = start === null ? "" : ` – ${formatMinutesToTimeLabel(start + durationMinutes)}`;
        toast({ title: "Appointment Booked!", description: `With ${selectedDoc.name} on ${slot.date} at ${slot.time}${endLabel}` });
      } else {
        toast({ title: "Booking Failed", description: "Slot is no longer available", variant: "destructive" });
      }
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground mb-2">Our Doctors</h1>
      <p className="text-muted-foreground mb-8">Select a doctor to view available time slots</p>

      {!selectedDoctor ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div key={doc.id} className="bg-card border border-border rounded-2xl overflow-hidden card-shadow hover:card-shadow-lg transition-all hover:-translate-y-1">
              <div className="h-36 bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-card-foreground text-lg">{doc.name}</h3>
                <p className="text-primary text-sm font-medium mt-1">{doc.specialization}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  <span className="text-sm text-muted-foreground">4.8</span>
                </div>
                <Button onClick={() => setSelectedDoctor(doc.id)} className="w-full mt-4 bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 text-primary-foreground">
                  <Calendar className="h-4 w-4 mr-2" /> View Availability
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <Button variant="outline" onClick={() => setSelectedDoctor(null)} className="mb-6">
            ← Back to Doctors
          </Button>
          <div className="bg-card border border-border rounded-2xl p-6 card-shadow mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-card-foreground">{selectedDoc?.name}</h2>
                <p className="text-primary text-sm">{selectedDoc?.specialization}</p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-4">Available Slots</h3>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <select
                value={String(durationMinutes)}
                onChange={(e) => setDurationMinutes(e.target.value === "30" ? 30 : 15)}
                className="mt-1.5 flex h-10 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
          </div>
          {availableSlots.length === 0 ? (
            <div className="bg-muted/50 rounded-2xl p-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No available slots at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSlots.map((slot) => (
                <div key={slot.id} className="bg-card border border-border rounded-xl p-4 card-shadow flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">{slot.date}</p>
                    <p className="text-sm text-muted-foreground">{getTimeRangeLabel(slot.time, durationMinutes)}</p>
                  </div>
                  <Button size="sm" onClick={() => handleBook(slot.id)} className="bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 text-primary-foreground">
                    Book
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientDoctors;
