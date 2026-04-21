<<<<<<< HEAD:src/services/api.ts
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
=======
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "/api" : "https://fsb-1.onrender.com/api")
).replace(/\/$/, "");
>>>>>>> 21ada80 (Fix: Use Render backend URL in production):FSD-PBL-main/src/services/api.ts
const DEV_FALLBACK_API_BASE = (
  import.meta.env.VITE_DEV_FALLBACK_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;
  const authToken = token || localStorage.getItem("hms_token") || "";

  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  const shouldRetryWithFallback = import.meta.env.DEV && API_BASE.startsWith("/");
  const baseCandidates = shouldRetryWithFallback ? [API_BASE, DEV_FALLBACK_API_BASE] : [API_BASE];

  let response: Response | null = null;

  for (let i = 0; i < baseCandidates.length; i += 1) {
    response = await fetch(`${baseCandidates[i]}${path}`, requestInit);

    // In dev, a relative /api path can 404 if the app is served without Vite proxy.
    // Retry once against the backend URL before surfacing the error.
    if (response.status !== 404 || i === baseCandidates.length - 1) {
      break;
    }
  }

  if (!response) {
    throw new Error("No response from server");
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export const authAPI = {
  login: async (email: string, password: string, role: string) => {
    return request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: { email, password, role },
    });
  },
  register: async (
    name: string,
    email: string,
    password: string,
    role: string,
    specialization?: string,
  ) => {
    return request<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      body: { name, email, password, role, specialization },
    });
  },
};

export const doctorsAPI = {
  getAll: async () => {
    return request<any[]>("/doctors");
  },
  create: async (doctor: any) => {
    return request<any>("/doctors", {
      method: "POST",
      body: doctor,
    });
  },
  update: async (id: string, patch: any) => {
    return request<any>(`/doctors/${id}`, {
      method: "PUT",
      body: patch,
    });
  },
  delete: async (id: string) => {
    return request<{ success: boolean }>(`/doctors/${id}`, {
      method: "DELETE",
    });
  },
  resetPassword: async (id: string, password: string) => {
    return request<{ success: boolean }>(`/doctors/${id}/password`, {
      method: "PUT",
      body: { password },
    });
  },
};

export const availabilityAPI = {
  create: async (slot: any) => {
    return request<any>("/availability", {
      method: "POST",
      body: slot,
    });
  },
  createRange: async (payload: { doctorId: string; date: string; startTime: string; endTime: string; stepMinutes?: number }) => {
    return request<{ created: number; skipped: number; total: number }>("/availability", {
      method: "POST",
      body: {
        doctorId: payload.doctorId,
        date: payload.date,
        time: payload.startTime,
        endTime: payload.endTime,
        stepMinutes: payload.stepMinutes,
      },
    });
  },
  getByDoctor: async (doctorId: string) => {
    return request<any[]>(`/availability/${doctorId}`);
  },
  delete: async (id: string) => {
    return request<{ success: boolean }>(`/availability/${id}`, {
      method: "DELETE",
    });
  },
};

export const appointmentsAPI = {
  getAll: async () => {
    return request<any[]>("/appointments");
  },
  create: async (appointment: any) => {
    return request<any>("/appointments", {
      method: "POST",
      body: appointment,
    });
  },
  delete: async (id: string) => {
    return request<{ success: boolean }>(`/appointments/${id}`, {
      method: "DELETE",
    });
  },
  markVisited: async (id: string) => {
    return request<{ success: boolean; appointment?: any }>(`/appointments/${id}/visit`, {
      method: "PUT",
    });
  },
  markNoShow: async (id: string) => {
    return request<{ success: boolean; appointment?: any }>(`/appointments/${id}/no-show`, {
      method: "PUT",
    });
  },
};
