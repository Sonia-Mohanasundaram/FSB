const express = require("express");
const cors = require("cors");
const http = require("http");
const { randomUUID } = require("crypto");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:8080";
const MONGODB_URI = process.env.MONGODB_URI;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@ssnhospital.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";

const isDev = process.env.NODE_ENV !== "production";
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin === FRONTEND_ORIGIN) return true;
  if (isDev && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return true;
  return false;
};

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());

const generateId = () => randomUUID();

const parseTimeToMinutes = (value) => {
  if (typeof value !== "string") return null;
  const v = value.trim();

  // 24h format HH:MM
  const m24 = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(v);
  if (m24) {
    const hh = Number(m24[1]);
    const mm = Number(m24[2]);
    return hh * 60 + mm;
  }

  // 12h format HH:MM AM/PM
  const m12 = /^(0?\d|1[0-2]):([0-5]\d)\s*(AM|PM)$/i.exec(v);
  if (m12) {
    let hh = Number(m12[1]);
    const mm = Number(m12[2]);
    const ap = String(m12[3]).toUpperCase();

    if (hh === 12) hh = 0;
    if (ap === "PM") hh += 12;
    return hh * 60 + mm;
  }

  return null;
};

const formatMinutesToTimeLabel = (minutes) => {
  const m = Number(minutes);
  if (!Number.isFinite(m)) return "";
  const total = ((m % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh24 = Math.floor(total / 60);
  const mm = total % 60;
  const ap = hh24 >= 12 ? "PM" : "AM";
  let hh12 = hh24 % 12;
  if (hh12 === 0) hh12 = 12;
  return `${String(hh12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${ap}`;
};

const listTimesInRange = ({ startMinutes, endMinutes, stepMinutes }) => {
  const start = Number(startMinutes);
  const end = Number(endMinutes);
  const step = Number(stepMinutes);

  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step <= 0) return [];
  if (end <= start) return [];

  const out = [];
  for (let t = start; t < end; t += step) {
    out.push(formatMinutesToTimeLabel(t));
  }
  return out;
};

const BCRYPT_SALT_ROUNDS = 12;

const isBcryptHash = (value) => typeof value === "string" && /^\$2[aby]\$/.test(value);

const hashPassword = async (plainPassword) => bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: generateId },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "doctor", "patient"], required: true },
    specialization: { type: String },
  },
  { versionKey: false, timestamps: true },
);
userSchema.index({ email: 1, role: 1 }, { unique: true });

const doctorSchema = new mongoose.Schema(
  {
    _id: { type: String, default: generateId },
    name: { type: String, required: true },
    email: { type: String, required: true },
    specialization: { type: String, required: true },
    image: { type: String },
  },
  { versionKey: false, timestamps: true },
);

const availabilitySchema = new mongoose.Schema(
  {
    _id: { type: String, default: generateId },
    doctorId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: true },
);
availabilitySchema.index({ doctorId: 1, date: 1, time: 1 }, { unique: true });

const appointmentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: generateId },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true },
    slotId: { type: String, required: true, index: true },
    slotIds: { type: [String], default: [] },
    date: { type: String, required: true },
    time: { type: String, required: true },
    durationMinutes: { type: Number, default: 15 },
    status: { type: String, enum: ["Booked", "Visited", "NoShow"], default: "Booked" },
  },
  { versionKey: false, timestamps: true },
);

const User = mongoose.model("User", userSchema);
const Doctor = mongoose.model("Doctor", doctorSchema);
const Availability = mongoose.model("Availability", availabilitySchema);
const Appointment = mongoose.model("Appointment", appointmentSchema);

const emitDataChanged = () => {
  io.emit("data:changed", { updatedAt: new Date().toISOString() });
};

const toDoctorResponse = (doc) => ({
  id: doc._id,
  name: doc.name,
  email: doc.email,
  specialization: doc.specialization,
  image: doc.image,
});

const toAvailabilityResponse = (slot) => ({
  id: slot._id,
  doctorId: slot.doctorId,
  date: slot.date,
  time: slot.time,
  isBooked: slot.isBooked,
});

const toAppointmentResponse = (apt) => ({
  id: apt._id,
  patientId: apt.patientId,
  patientName: apt.patientName,
  doctorId: apt.doctorId,
  doctorName: apt.doctorName,
  slotId: apt.slotId,
  slotIds: Array.isArray(apt.slotIds) ? apt.slotIds : [],
  date: apt.date,
  time: apt.time,
  durationMinutes: apt.durationMinutes || 15,
  status: apt.status,
});

const toUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  specialization: user.specialization,
});

const parseISODateParts = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
};

const buildLocalDateTime = (dateISO, minutes) => {
  const parts = parseISODateParts(dateISO);
  if (!parts) return null;
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return new Date(parts.y, parts.m - 1, parts.d, hh, mm, 0, 0);
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = String(req.headers.authorization || "");
  const match = /^Bearer\s+mock-token-(.+)$/.exec(header);

  if (!match) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = match[1];
  const user = await User.findById(userId).lean();

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.authUser = user;
  return next();
});

const requireAdmin = [
  requireAuth,
  (req, res, next) => {
    if (req.authUser?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  },
];

io.on("connection", (socket) => {
  socket.emit("data:changed", { updatedAt: new Date().toISOString() });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "hms-backend", dbState: mongoose.connection.readyState });
});

app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const { email, password, role } = req.body || {};

  if (!email || !password || !role) {
    return res.status(400).json({ message: "email, password and role are required" });
  }

  const user = await User.findOne({ email, role }).select("+password");

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const stored = user.password;

  if (!stored) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  let ok = false;

  if (isBcryptHash(stored)) {
    ok = await bcrypt.compare(password, stored);
  } else {
    ok = stored === password;
    if (ok) {
      const passwordHash = await hashPassword(password);
      await User.updateOne({ _id: user._id }, { $set: { password: passwordHash } });
    }
  }

  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (role === "doctor") {
    await Doctor.findByIdAndUpdate(
      user._id,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        specialization: user.specialization || "General",
      },
      { upsert: true, new: true },
    );
  }

  return res.json({ token: `mock-token-${user._id}`, user: toUserResponse(user) });
}));

app.post("/api/auth/register", asyncHandler(async (req, res) => {
  const { name, email, password, role, specialization } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "name, email, password and role are required" });
  }

  if (role !== "patient") {
    return res.status(403).json({ message: "Only patient accounts can be created via registration" });
  }

  const existing = await User.findOne({ email, role });
  if (existing) {
    return res.status(409).json({ message: "User already exists for this role" });
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    password: passwordHash,
    role,
    specialization,
  });

  return res.status(201).json({ token: `mock-token-${user._id}`, user: toUserResponse(user) });
}));

app.get("/api/doctors", asyncHandler(async (_req, res) => {
  const doctors = await Doctor.find().lean();
  return res.json(doctors.map(toDoctorResponse));
}));

app.post("/api/doctors", ...requireAdmin, asyncHandler(async (req, res) => {
  const { name, email, specialization, image, password } = req.body || {};

  if (!name || !email || !specialization || !password) {
    return res.status(400).json({ message: "name, email, specialization and password are required" });
  }

  const existingUser = await User.findOne({ email, role: "doctor" }).lean();
  if (existingUser) {
    return res.status(409).json({ message: "Doctor login already exists for this email" });
  }

  const id = generateId();
  const doctor = await Doctor.create({ _id: id, name, email, specialization, image });

  const passwordHash = await hashPassword(password);
  await User.create({
    _id: id,
    name,
    email,
    password: passwordHash,
    role: "doctor",
    specialization,
  });

  emitDataChanged();

  return res.status(201).json(toDoctorResponse(doctor));
}));

app.put("/api/doctors/:id", ...requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, specialization, image } = req.body || {};

  if (!name && !email && !specialization && !image) {
    return res.status(400).json({ message: "At least one field is required" });
  }

  const doctor = await Doctor.findById(id);
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  if (email && email !== doctor.email) {
    const emailInDoctors = await Doctor.findOne({ email, _id: { $ne: id } }).lean();
    if (emailInDoctors) {
      return res.status(409).json({ message: "A doctor with this email already exists" });
    }

    const emailInUsers = await User.findOne({ email, role: "doctor", _id: { $ne: id } }).lean();
    if (emailInUsers) {
      return res.status(409).json({ message: "Doctor login already exists for this email" });
    }
  }

  if (typeof name === "string" && name) doctor.name = name;
  if (typeof email === "string" && email) doctor.email = email;
  if (typeof specialization === "string" && specialization) doctor.specialization = specialization;
  if (typeof image === "string") doctor.image = image;

  await doctor.save();

  const userUpdate = {};
  if (typeof name === "string" && name) userUpdate.name = name;
  if (typeof email === "string" && email) userUpdate.email = email;
  if (typeof specialization === "string" && specialization) userUpdate.specialization = specialization;

  if (Object.keys(userUpdate).length) {
    await User.updateOne({ _id: id, role: "doctor" }, { $set: userUpdate });
  }

  if (typeof name === "string" && name) {
    await Appointment.updateMany({ doctorId: id }, { $set: { doctorName: name } });
  }

  emitDataChanged();
  return res.json(toDoctorResponse(doctor));
}));

app.delete("/api/doctors/:id", ...requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctor = await Doctor.findByIdAndDelete(id);

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  await Availability.deleteMany({ doctorId: id });
  await Appointment.deleteMany({ doctorId: id });
  await User.deleteOne({ _id: id, role: "doctor" });
  emitDataChanged();

  return res.json({ success: true });
}));

app.put("/api/doctors/:id/password", ...requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ message: "password is required" });
  }

  const passwordHash = await hashPassword(password);

  const doctorUser = await User.findOne({ _id: id, role: "doctor" }).select("+password");
  if (!doctorUser) {
    const doctor = await Doctor.findById(id).lean();
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const emailInUse = await User.findOne({ email: doctor.email, role: "doctor", _id: { $ne: id } }).lean();
    if (emailInUse) {
      return res.status(409).json({ message: "Doctor login already exists for this email" });
    }

    await User.create({
      _id: id,
      name: doctor.name,
      email: doctor.email,
      password: passwordHash,
      role: "doctor",
      specialization: doctor.specialization,
    });

    emitDataChanged();
    return res.json({ success: true, created: true });
  }

  await User.updateOne({ _id: id, role: "doctor" }, { $set: { password: passwordHash } });

  return res.json({ success: true });
}));

app.get("/api/availability/:doctorId", asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const slots = await Availability.find({ doctorId }).lean();
  return res.json(slots.map(toAvailabilityResponse));
}));

app.post("/api/availability", asyncHandler(async (req, res) => {
  const { doctorId, date, time, endTime, stepMinutes } = req.body || {};

  if (!doctorId || !date || !time) {
    return res.status(400).json({ message: "doctorId, date and time are required" });
  }

  // Disallow creating slots in the past (past date or earlier time today)
  const startMinutesForValidation = parseTimeToMinutes(time);
  if (startMinutesForValidation === null) {
    return res.status(400).json({ message: "Invalid time format" });
  }
  const startDateTime = buildLocalDateTime(date, startMinutesForValidation);
  if (!startDateTime) {
    return res.status(400).json({ message: "Invalid date format" });
  }
  if (startDateTime.getTime() < Date.now()) {
    return res.status(400).json({ message: "Cannot add availability in the past" });
  }

  // Range mode: create 15-min slots between time (start) and endTime.
  if (endTime) {
    const startMinutes = parseTimeToMinutes(time);
    const endMinutes = parseTimeToMinutes(endTime);
    const step = Number(stepMinutes || 15);

    if (startMinutes === null || endMinutes === null) {
      return res.status(400).json({ message: "Invalid time or endTime format" });
    }
    if (endMinutes <= startMinutes) {
      return res.status(400).json({ message: "endTime must be after time" });
    }
    if (![15, 30, 60].includes(step)) {
      return res.status(400).json({ message: "stepMinutes must be 15, 30, or 60" });
    }

    const times = listTimesInRange({ startMinutes, endMinutes, stepMinutes: step });
    if (!times.length) {
      return res.status(400).json({ message: "No slots generated for the provided range" });
    }

    const existing = await Availability.find({ doctorId, date, time: { $in: times } }).lean();
    const existingTimes = new Set((existing || []).map((s) => s.time));

    const toCreate = times
      .filter((t) => !existingTimes.has(t))
      .map((t) => ({ doctorId, date, time: t, isBooked: false }));

    if (toCreate.length) {
      try {
        await Availability.insertMany(toCreate, { ordered: false });
      } catch (err) {
        // If a duplicate sneaks in due to concurrency, ignore and continue.
        if (err?.code !== 11000) throw err;
      }
    }

    emitDataChanged();
    return res.status(201).json({
      created: toCreate.length,
      skipped: times.length - toCreate.length,
      total: times.length,
    });
  }

  const exists = await Availability.findOne({ doctorId, date, time });
  if (exists) {
    return res.status(409).json({ message: "Slot already exists" });
  }

  const slot = await Availability.create({ doctorId, date, time, isBooked: false });
  emitDataChanged();

  return res.status(201).json(toAvailabilityResponse(slot));
}));

app.delete("/api/availability/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const slot = await Availability.findById(id);

  if (!slot) {
    return res.status(404).json({ message: "Slot not found" });
  }

  if (slot.isBooked) {
    return res.status(409).json({ message: "Cannot delete a booked slot" });
  }

  await Availability.findByIdAndDelete(id);
  emitDataChanged();
  return res.json({ success: true });
}));

app.get("/api/appointments", asyncHandler(async (_req, res) => {
  const appointments = await Appointment.find().lean();
  return res.json(appointments.map(toAppointmentResponse));
}));

app.post("/api/appointments", asyncHandler(async (req, res) => {
  const {
    patientId,
    patientName,
    doctorId,
    doctorName,
    slotId,
    date,
    time,
    durationMinutes,
  } = req.body || {};

  if (!patientId || !doctorId || !slotId || !date || !time) {
    return res
      .status(400)
      .json({ message: "patientId, doctorId, slotId, date and time are required" });
  }

  const duration = Number(durationMinutes || 15);
  if (![15, 30].includes(duration)) {
    return res.status(400).json({ message: "durationMinutes must be 15 or 30" });
  }

  const slot = await Availability.findById(slotId);
  if (!slot) {
    return res.status(404).json({ message: "Slot not found" });
  }

  if (slot.isBooked) {
    return res.status(409).json({ message: "Slot already booked" });
  }

  const toBook = [slot];

  if (duration === 30) {
    const startMinutes = parseTimeToMinutes(slot.time);
    if (startMinutes === null) {
      return res.status(400).json({ message: "Invalid slot time format" });
    }

    const nextTime = formatMinutesToTimeLabel(startMinutes + 15);
    const nextSlot = await Availability.findOne({ doctorId, date, time: nextTime });
    if (!nextSlot) {
      return res.status(409).json({ message: "Next 15-minute slot not available" });
    }
    if (nextSlot.isBooked) {
      return res.status(409).json({ message: "Next 15-minute slot already booked" });
    }
    toBook.push(nextSlot);
  }

  const bookedIds = [];
  try {
    for (const s of toBook) {
      const updated = await Availability.findOneAndUpdate(
        { _id: s._id, isBooked: false },
        { $set: { isBooked: true } },
        { new: true },
      );
      if (!updated) {
        if (bookedIds.length) {
          await Availability.updateMany({ _id: { $in: bookedIds } }, { $set: { isBooked: false } });
        }
        return res.status(409).json({ message: "Slot is no longer available" });
      }
      bookedIds.push(String(s._id));
    }
  } catch (err) {
    if (bookedIds.length) {
      await Availability.updateMany({ _id: { $in: bookedIds } }, { $set: { isBooked: false } });
    }
    throw err;
  }

  const appointment = await Appointment.create({
    patientId,
    patientName,
    doctorId,
    doctorName,
    slotId,
    slotIds: bookedIds,
    date,
    time,
    durationMinutes: duration,
    status: "Booked",
  });

  emitDataChanged();
  return res.status(201).json(toAppointmentResponse(appointment));
}));

app.delete("/api/appointments/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  const slotIds = Array.isArray(appointment.slotIds) && appointment.slotIds.length
    ? appointment.slotIds
    : [appointment.slotId];

  await Availability.updateMany({ _id: { $in: slotIds } }, { $set: { isBooked: false } });

  await Appointment.findByIdAndDelete(id);
  emitDataChanged();
  return res.json({ success: true });
}));

const canUpdateAppointmentStatus = (authUser, appointment) => {
  if (!authUser || !appointment) return false;
  if (authUser.role === "admin") return true;
  if (authUser.role === "doctor") return String(appointment.doctorId) === String(authUser._id);
  return false;
};

app.put("/api/appointments/:id/visit", requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  if (!canUpdateAppointmentStatus(req.authUser, appointment)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  appointment.status = "Visited";
  await appointment.save();
  emitDataChanged();
  return res.json({ success: true, appointment: toAppointmentResponse(appointment) });
}));

app.put("/api/appointments/:id/no-show", requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  if (!canUpdateAppointmentStatus(req.authUser, appointment)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  appointment.status = "NoShow";
  await appointment.save();
  emitDataChanged();
  return res.json({ success: true, appointment: toAppointmentResponse(appointment) });
}));

app.use((err, _req, res, _next) => {
  if (err?.code === 11000) {
    return res.status(409).json({ message: "Duplicate value" });
  }

  console.error(err);
  return res.status(500).json({ message: err?.message || "Internal server error" });
});

async function migratePlaintextPasswords() {
  const users = await User.find({ password: { $exists: true, $type: "string" } })
    .select("+password")
    .lean();

  const plaintextUsers = users.filter((u) => u.password && !isBcryptHash(u.password));

  await Promise.all(
    plaintextUsers.map(async (u) => {
      const passwordHash = await hashPassword(u.password);
      await User.updateOne({ _id: u._id }, { $set: { password: passwordHash } });
    }),
  );
}

async function seedAdminIfMissing() {
  const existing = await User.findOne({ email: ADMIN_EMAIL, role: "admin" }).lean();
  if (existing) return;

  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  await User.create({
    name: "Admin",
    email: ADMIN_EMAIL,
    password: passwordHash,
    role: "admin",
  });
}

async function seedDoctorsIfEmpty() {
  const count = await Doctor.countDocuments();
  if (count > 0) return;

  await Doctor.insertMany([
    { name: "Dr. Mohan", email: "sarah@hospital.com", specialization: "Cardiology" },
    { name: "Dr. Pubesh", email: "michael@hospital.com", specialization: "Neurology" },
    { name: "Dr. Krishnaveni", email: "emily@hospital.com", specialization: "Gynecology" },
    { name: "Dr. Pooja", email: "james@hospital.com", specialization: "Orthopedics" },
  ]);
}

async function startServer() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in environment. Add it to backend/.env");
  }

  await mongoose.connect(MONGODB_URI);
  await migratePlaintextPasswords();
  await seedAdminIfMissing();
  await seedDoctorsIfEmpty();

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. If the backend is already running, you don't need to start it again.\n` +
          `Otherwise, stop the process using port ${PORT} or change PORT in backend/.env (e.g. PORT=5001).`,
      );
      process.exit(0);
    }
  });

  server.listen(PORT, () => {
    console.log(`Backend API running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});
