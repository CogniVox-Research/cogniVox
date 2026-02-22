import type { AuthResponse, LoginInput, RegisterInput } from "../types";

export async function loginUser(data: LoginInput): Promise<AuthResponse> {
  const response = await fetch(`/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Login failed" }));
    throw new Error(error.message ?? "Login failed");
  }

  return response.json();
}

export async function registerUser(data: RegisterInput): Promise<AuthResponse> {
  const response = await fetch(`/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Registration failed" }));
    throw new Error(error.message ?? "Registration failed");
  }

  return response.json();
}
