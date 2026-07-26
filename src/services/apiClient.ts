import type { Project, UserProfile } from '../types/architecture';

const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:5000/api');

export function getStoredAuthToken(): string | null {
  return localStorage.getItem('arkhet_jwt_token');
}

export function setStoredAuthToken(token: string) {
  localStorage.setItem('arkhet_jwt_token', token);
}

export function clearStoredAuthToken() {
  localStorage.removeItem('arkhet_jwt_token');
}

export async function loginUserCloud(usernameOrEmail: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
  setStoredAuthToken(data.token);
  return data;
}

export async function registerUserCloud(username: string, email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al registrar usuario');
  setStoredAuthToken(data.token);
  return data;
}

export async function fetchUserProjectsCloud(): Promise<Project[]> {
  const token = getStoredAuthToken();
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('Backend API cloud offline, using local storage.');
    return [];
  }
}

export async function syncProjectCloud(project: Project): Promise<Project | null> {
  const token = getStoredAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(project)
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Could not sync project to cloud MongoDB Atlas:', err);
    return null;
  }
}
