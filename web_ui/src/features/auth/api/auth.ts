import type { AuthResponse, LoginInput, RegisterInput } from "../types";

const AUTH_BASE = "/api/auth";

export async function loginUser(data: LoginInput): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Login failed" }));
    throw new Error(error.detail ?? "Login failed");
  }

  return response.json();
}

export async function registerUser(data: RegisterInput): Promise<{ id: number; username: string; email: string }> {
  const response = await fetch(`${AUTH_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Registration failed" }));
    throw new Error(error.detail ?? "Registration failed");
  }

  return response.json();
}
