import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { appointmentsAPI, availabilityAPI, doctorsAPI } from "@/services/api";

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  image?: string;
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  time: string;
  isBooked: boolean;
}

export type AppointmentStatus = "Booked" | "Visited" | "NoShow";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  slotId: string;
  slotIds: string[];
  date: string;
  time: string;
  durationMinutes: number;
  status: AppointmentStatus;
}

interface DataContextType {
  doctors: Doctor[];
  isLoading: boolean;
  backendError: string | null;
  retryLoadData: () => Promise<void>;
  clearBackendError: () => void;
  addDoctor: (doc: Omit<Doctor, "id"> & { password?: string }) => Promise<void>;
  updateDoctor: (id: string, patch: Partial<Omit<Doctor, "id">>) => Promise<void>;
  removeDoctor: (id: string) => Promise<void>;
  resetDoctorPassword: (id: string, password: string) => Promise<void>;
  slots: TimeSlot[];
  addSlot: (slot: Omit<TimeSlot, "id" | "isBooked">) => Promise<boolean>;
  addSlotRange: (payload: { doctorId: string; date: string; startTime: string; endTime: string }) => Promise<{ created: number; skipped: number; total: number }>;
  removeSlot: (id: string) => Promise<void>;
  getSlotsByDoctor: (doctorId: string) => TimeSlot[];
  appointments: Appointment[];
  bookAppointment: (apt: Omit<Appointment, "id" | "status" | "slotIds" | "durationMinutes"> & { durationMinutes?: number }) => Promise<boolean>;
  cancelAppointment: (id: string) => Promise<void>;
  markVisited: (id: string) => Promise<void>;
  markNoShow: (id: string) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  patients: { id: string; name: string; email: string }[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const HospitalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const parseErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message) return error.message;
    return "Unable to connect to backend. Please start backend on http://localhost:5000";
  };

  const clearBackendError = () => setBackendError(null);

  const retryLoadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setBackendError(null);

      const [doctorsFromApi, appointmentsFromApi] = await Promise.all([
        doctorsAPI.getAll(),
        appointmentsAPI.getAll(),
      ]);

      const mappedDoctors: Doctor[] = (doctorsFromApi || []).map((doc: any) => ({
        id: String(doc.id),
        name: doc.name,
        email: doc.email,
        specialization: doc.specialization,
        image: doc.image,
      }));

      const mappedAppointments: Appointment[] = (appointmentsFromApi || []).map((apt: any) => ({
        id: String(apt.id),
        patientId: String(apt.patientId),
        patientName: apt.patientName,
        doctorId: String(apt.doctorId),
        doctorName: apt.doctorName,
        slotId: String(apt.slotId),
        slotIds: Array.isArray(apt.slotIds) ? apt.slotIds.map(String) : [],
        date: apt.date,
        time: apt.time,
        durationMinutes: Number(apt.durationMinutes || 15),
        status: apt.status === "Visited" ? "Visited" : (apt.status === "NoShow" ? "NoShow" : "Booked"),
      }));

      setDoctors(mappedDoctors);
      setAppointments(mappedAppointments);

      const slotsByDoctor = await Promise.all(
        mappedDoctors.map(async (doc) => {
          const doctorSlots = await availabilityAPI.getByDoctor(doc.id);
          return (doctorSlots || []).map((slot: any) => ({
            id: String(slot.id),
            doctorId: String(slot.doctorId || doc.id),
            date: slot.date,
            time: slot.time,
            isBooked: Boolean(slot.isBooked),
          }));
        }),
      );

      setSlots(slotsByDoctor.flat());

      const patientMap = new Map<string, { id: string; name: string; email: string }>();
      mappedAppointments.forEach((apt) => {
        if (!patientMap.has(apt.patientId)) {
          patientMap.set(apt.patientId, {
            id: apt.patientId,
            name: apt.patientName,
            email: "",
          });
        }
      });
      setPatients(Array.from(patientMap.values()));
    } catch (error) {
      setDoctors([]);
      setSlots([]);
      setAppointments([]);
      setPatients([]);
      setBackendError(parseErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    retryLoadData().catch(() => {
      // Backend error state is already handled in retryLoadData.
    });
  }, [retryLoadData]);

  useEffect(() => {
    const socketUrl = (import.meta.env.VITE_SOCKET_URL || "http://localhost:5000").replace(/\/$/, "");
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("data:changed", () => {
      retryLoadData().catch(() => {
        // Backend error state is already handled in retryLoadData.
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [retryLoadData]);

  const addDoctor = async (doc: Omit<Doctor, "id"> & { password?: string }) => {
    try {
      setBackendError(null);
      const created = await doctorsAPI.create(doc);
      const doctor: Doctor = {
        id: String(created?.id || crypto.randomUUID()),
        name: created?.name || doc.name,
        email: created?.email || doc.email,
        specialization: created?.specialization || doc.specialization,
        image: created?.image,
      };
      setDoctors((prev) => [...prev, doctor]);
    } catch (error) {
      setBackendError(parseErrorMessage(error));
      throw error;
    }
  };

  const updateDoctor = async (id: string, patch: Partial<Omit<Doctor, "id">>) => {
    try {
      setBackendError(null);
      const updated = await doctorsAPI.update(id, patch);
      const nextDoctor: Doctor = {
        id: String(updated?.id || id),
        name: updated?.name || patch.name || "",
        email: updated?.email || patch.email || "",
        specialization: updated?.specialization || patch.specialization || "",
        image: updated?.image,
      };

      setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, ...nextDoctor } : d)));
      setAppointments((prev) => prev.map((a) => (a.doctorId === id ? { ...a, doctorName: nextDoctor.name || a.doctorName } : a)));
    } catch (error) {
      setBackendError(parseErrorMessage(error));
      throw error;
    }
  };

  const removeDoctor = async (id: string) => {
    try {
      setBackendError(null);
      await doctorsAPI.delete(id);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      setSlots((prev) => prev.filter((s) => s.doctorId !== id));
    } catch (error) {
      setBackendError(parseErrorMessage(error));
      throw error;
    }
  };

  const resetDoctorPassword = async (id: string, password: string) => {
    try {
      setBackendError(null);
      await doctorsAPI.resetPassword(id, password);
    } catch (error) {
      setBackendError(parseErrorMessage(error));
      throw error;
    }
  };

  const addSlot = async (slot: Omit<TimeSlot, "id" | "isBooked">): Promise<boolean> => {
    const exists = slots.some((s) => s.doctorId === slot.doctorId && s.date === slot.date && s.time === slot.time);
    if (exists) return false;

    try {
      setBackendError(null);
      const created = await availabilityAPI.create(slot);
      const normalizedSlot: TimeSlot = {
        id: String(created?.id || crypto.randomUUID()),
        doctorId: String(created?.doctorId || slot.doctorId),
        date: created?.date || slot.date,
        time: created?.time || slot.time,
        isBooked: Boolean(created?.isBooked),
      };
      setSlots((prev) => [...prev, normalizedSlot]);
      return true;
    } catch (error) {
      setBackendError(parseErrorMessage(error));
      throw error;
    }
  };

  const addSlotRange = async (payload: { doctorId: string; date: string; startTime: string; endTime: string }) => {
    try {
      setBackendError(null);
      const result = await availabilityAPI.createRange({
        doctorId: payload.doctorId,
        date: payload.date,
        startTime: payload.startTime,
        endTime: payload.endTime,
        stepMinutes: 15,
      });

      // Ensure local state reflects all created slots.
      await retryLoadData();
      return result;
    } catch (error) {
      setBackendError(parseErrorMessage(error));
      throw error;
    }
  };

  const removeSlot = async (id: string) => {
    try {
      setBackendError(null);
      await availabilityAPI.delete(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      setBackendError(parseErrorMessage(error));
      throw error;
    }
  };

  const getSlotsByDoctor = (doctorId: string) => slots.filter((s) => s.doctorId === doctorId);

  const bookAppointment = async (
    apt: Omit<Appointment, "id" | "status" | "slotIds" | "durationMinutes"> & { durationMinutes?: number },
  ): Promise<boolean> => {
    const slot = slots.find((s) => s.id === apt.slotId);
    if (!slot || slot.isBooked) return false;

    try {
      setBackendError(null);
      const created = await appointmentsAPI.create(apt);
      const appointment: Appointment = {
        id: String(created?.id || crypto.randomUUID()),
        patientId: String(created?.patientId || apt.patientId),
        patientName: created?.patientName || apt.patientName,
        doctorId: String(created?.doctorId || apt.doctorId),
        doctorName: created?.doctorName || apt.doctorName,
        slotId: String(created?.slotId || apt.slotId),
        slotIds: Array.isArray(created?.slotIds) ? created.slotIds.map(String) : [],
        date: created?.date || apt.date,
        time: created?.time || apt.time,
        durationMinutes: Number(created?.durationMinutes || apt.durationMinutes || 15),
        status: created?.status === "Visited" ? "Visited" : "Booked",
      };

      const bookedSlotIds = appointment.slotIds.length ? appointment.slotIds : [appointment.slotId];
      setSlots((prev) => prev.map((s) => (bookedSlotIds.includes(s.id) ? { ...s, isBooked: true } : s)));
      setAppointments((prev) => [...prev, appointment]);

      if (!patients.find((p) => p.id === apt.patientId)) {
        setPatients((prev) => [...prev, { id: apt.patientId, name: apt.patientName, email: "" }]);
      }
      return true;
    } catch (error) {
      setBackendError(parseErrorMessage(error));
      throw error;
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      setBackendError(null);
      const apt = appointments.find((a) => a.id === id);
      await appointmentsAPI.delete(id);
      if (apt) {
        const freedSlotIds = apt.slotIds.length ? apt.slotIds : [apt.slotId];
        setSlots((prev) => prev.map((s) => (freedSlotIds.includes(s.id) ? { ...s, isBooked: false } : s)));
      }
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      setBackendError(parseErrorMessage(error));
      throw error;
    }
  };

  const markVisited = async (id: string) => {
    try {
      setBackendError(null);
      const res = await appointmentsAPI.markVisited(id);
      const nextStatus: AppointmentStatus = res?.appointment?.status === "NoShow" ? "NoShow" : "Visited";
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a)));
    } catch (error) {
      setBackendError(parseErrorMessage(error));
      throw error;
    }
  };

  const markNoShow = async (id: string) => {
    try {
      setBackendError(null);
      const res = await appointmentsAPI.markNoShow(id);
      const nextStatus: AppointmentStatus = res?.appointment?.status === "Visited" ? "Visited" : "NoShow";
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a)));
    } catch (error) {
      setBackendError(parseErrorMessage(error));
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      setBackendError(null);
      const apt = appointments.find((a) => a.id === id);
      await appointmentsAPI.delete(id);
      if (apt) {
        const freedSlotIds = apt.slotIds.length ? apt.slotIds : [apt.slotId];
        setSlots((prev) => prev.map((s) => (freedSlotIds.includes(s.id) ? { ...s, isBooked: false } : s)));
      }
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      setBackendError(parseErrorMessage(error));
      throw error;
    }
  };

  return (
    <DataContext.Provider
      value={{
        doctors,
        isLoading,
        backendError,
        retryLoadData,
        clearBackendError,
        addDoctor,
        updateDoctor,
        removeDoctor,
        resetDoctorPassword,
        slots,
        addSlot,
        addSlotRange,
        removeSlot,
        getSlotsByDoctor,
        appointments,
        bookAppointment,
        cancelAppointment,
        markVisited,
        markNoShow,
        deleteAppointment,
        patients,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useHospitalData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useHospitalData must be used within HospitalDataProvider");
  return ctx;
};
