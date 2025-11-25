import type {
  LoginRequest,
  LoginResponse,
  AuthResponse,
} from "@paintwithchat/shared";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any,
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, response.statusText, errorData);
  }

  return response.json();
}

// Auth
export const loginWithTwitch = async (code: string): Promise<LoginResponse> => {
  return fetchApi<LoginResponse>("/auth/twitch", {
    method: "POST",
    body: JSON.stringify({ code } as LoginRequest),
  });
};

export const getCurrentUser = async (): Promise<AuthResponse> => {
  return fetchApi<AuthResponse>("/auth/me");
};
