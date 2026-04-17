import React, { useEffect, useState } from "react";
import { useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { useHospitalData } from "@/contexts/HospitalDataContext";
import { Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { compareSlotsForList, getAppointmentDisplayStatus } from "@/lib/utils";

const parseTimeToMinutes = (value: string) => {
  const v = value.trim();
  const m12 = /^(0?\d|1[0-2]):([0-5]\d)\s*(AM|PM)$/i.exec(v);
  if (!m12) return null;
  let hh = Number(m12[1]);
  const mm = Number(m12[2]);
  const ap = String(m12[3]).toUpperCase();
  if (hh === 12) hh = 0;
  if (ap === "PM") hh += 12;
  return hh * 60 + mm;
};

const formatMinutesToTimeLabel = (minutes: number) => {
  const total = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh24 = Math.floor(total / 60);
  const mm = total % 60;
  const ap = hh24 >= 12 ? "PM" : "AM";
  let hh12 = hh24 % 12;
  if (hh12 === 0) hh12 = 12;
  return `${String(hh12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${ap}`;
};

const buildTimeOptions = () => {
  const start = 0;
  const end = 24 * 60;
  const out: string[] = [];
  for (let t = start; t < end; t += 15) {
    out.push(formatMinutesToTimeLabel(t));
  }
  return out;
};

const timeOptions = buildTimeOptions();

const getTodayLocalISODate = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const parseISODate = (value: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
};

const buildLocalDateTime = (dateISO: string, minutes: number) => {
  const parts = parseISODate(dateISO);
  if (!parts) return null;
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return new Date(parts.y, parts.m - 1, parts.d, hh, mm, 0, 0);
};

const DoctorAvailability: React.FC = () => {
  const { user } = useHospitalAuth();
  const { addSlotRange, removeSlot, getSlotsByDoctor, appointments } = useHospitalData();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState(timeOptions[0]);
  const [endTime, setEndTime] = useState(timeOptions[4] || timeOptions[0]);
  const { toast } = useToast();

  const todayISO = getTodayLocalISODate();
  const isToday = date === todayISO;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const minStartMinutes = isToday ? Math.ceil(nowMinutes / 15) * 15 : 0;

  const startTimeOptions = timeOptions.filter((t) => {
    const m = parseTimeToMinutes(t);
    return m !== null && m >= minStartMinutes;
  });

  const mySlots = (user ? getSlotsByDoctor(user.id) : []).slice().sort(compareSlotsForList);
  const myAppointments = user ? appointments.filter((a) => a.doctorId === user.id) : [];

  const slotStatusById = new Map<string, string>();
  myAppointments.forEach((apt) => {
    const ids = apt.slotIds && apt.slotIds.length ? apt.slotIds : [apt.slotId];
    const display = getAppointmentDisplayStatus(apt);
    ids.forEach((id) => slotStatusById.set(id, display));
  });

  const startMinutes = parseTimeToMinutes(startTime) ?? 0;
  const endTimeOptions = timeOptions.filter((t) => {
    const m = parseTimeToMinutes(t);
    return m !== null && m > startMinutes;
  });

  useEffect(() => {
    if (!date) return;

    // If user selects today, don't allow start time in the past.
    const start = parseTimeToMinutes(startTime);
    if (isToday) {
      if (!startTimeOptions.length) return;
      if (start === null || start < minStartMinutes) {
        setStartTime(startTimeOptions[0]);
      }
    }
  }, [date]);

  useEffect(() => {
    const start = parseTimeToMinutes(startTime);
    const currentEnd = parseTimeToMinutes(endTime);
    if (start === null) return;

    if (currentEnd === null || currentEnd <= start) {
      const nextEnd = timeOptions.find((t) => {
        const m = parseTimeToMinutes(t);
        return m !== null && m > start;
      });
      if (nextEnd) setEndTime(nextEnd);
    }
  }, [startTime, endTime]);

  const handleAdd = async () => {
    if (!date || !startTime || !endTime || !user) return;

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    const startDT = buildLocalDateTime(date, startMinutes);
    if (!startDT) {
      toast({
        title: "Invalid date",
        description: "Please select a valid date",
        variant: "destructive",
      });
      return;
    }

    if (startDT.getTime() < now.getTime()) {
      toast({
        title: "Past time not allowed",
        description: "You can only add availability for future times",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await addSlotRange({ doctorId: user.id, date, startTime, endTime });
      toast({
        title: "Availability Added",
        description: `${result.created} created, ${result.skipped} skipped`,
      });
      setDate("");
    } catch (error) {
      toast({
        title: "Could not add slot",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeSlot(id);
      toast({ title: "Slot Removed" });
    } catch (error) {
      toast({
        title: "Could not remove slot",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground mb-2">Set Availability</h1>
      <p className="text-muted-foreground mb-8">Add time slots for patient bookings</p>

      <div className="bg-card border border-border rounded-2xl p-6 card-shadow mb-8">
        <h3 className="font-semibold text-card-foreground mb-4">Add Availability</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label className="text-foreground">Date</Label>
            <Input
              type="date"
              value={date}
              min={todayISO}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="flex-1">
            <Label className="text-foreground">Start Time</Label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {(isToday ? startTimeOptions : timeOptions).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Label className="text-foreground">End Time</Label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {endTimeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleAdd} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-4">Your Time Slots</h3>
      {mySlots.length === 0 ? (
        <div className="bg-muted/50 rounded-2xl p-8 text-center">
          <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No time slots added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mySlots.map((slot) => (
            <div key={slot.id} className={`bg-card border rounded-xl p-4 card-shadow flex items-center justify-between ${slot.isBooked ? "border-primary/30 bg-primary/5" : "border-border"}`}>
              <div>
                <p className="font-medium text-card-foreground">{slot.date}</p>
                <p className="text-sm text-muted-foreground">{slot.time}</p>
                {slot.isBooked && (
                  (() => {
                    const displayStatus = slotStatusById.get(slot.id) || "Booked";
                    const cls =
                      displayStatus === "Visited"
                        ? "text-emerald-700"
                        : displayStatus === "Not Visited"
                          ? "text-rose-700"
                          : displayStatus === "Expired"
                            ? "text-amber-700"
                            : "text-primary";
                    return <span className={`text-xs font-medium ${cls}`}>{displayStatus}</span>;
                  })()
                )}
              </div>
              {!slot.isBooked && (
                <Button size="sm" variant="ghost" onClick={() => handleDelete(slot.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAvailability;
