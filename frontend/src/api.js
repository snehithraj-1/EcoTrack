import axios from "axios";

import { auth, isFirebaseConfigured } from "./firebase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  if (isFirebaseConfigured && auth?.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    config.headers["X-User-Id"] = auth.currentUser.uid;
  }
  return config;
});

function headersFor(userId) {
  return { "X-User-Id": userId };
}

export async function calculateFootprint(payload) {
  const { data } = await api.post("/calculate/footprint", payload);
  return data;
}

export async function logHabit(userId, payload) {
  const { data } = await api.post("/habits/log", { ...payload, user_id: userId }, { headers: headersFor(userId) });
  return data;
}

export async function getHistory(userId, days = 30) {
  const { data } = await api.get("/habits/history", { params: { user_id: userId, days }, headers: headersFor(userId) });
  return data.history || [];
}

export async function getToday(userId) {
  const { data } = await api.get("/habits/today", { params: { user_id: userId }, headers: headersFor(userId) });
  return data.log || null;
}

export async function getSettings(userId) {
  const { data } = await api.get("/habits/settings", { params: { user_id: userId }, headers: headersFor(userId) });
  return data.settings;
}

export async function saveSettings(userId, settings) {
  const { data } = await api.patch("/habits/settings", { ...settings, user_id: userId }, { headers: headersFor(userId) });
  return data.settings;
}

export async function getBadges(userId) {
  const { data } = await api.get("/habits/badges", { params: { user_id: userId }, headers: headersFor(userId) });
  return data.badges || [];
}

export async function saveBadges(userId, badges) {
  const { data } = await api.post("/habits/badges", { user_id: userId, badges }, { headers: headersFor(userId) });
  return data.badges || [];
}

export async function resetUserData(userId) {
  const { data } = await api.delete("/habits/reset", { params: { user_id: userId }, headers: headersFor(userId) });
  return data;
}

export async function generateSuggestions(context) {
  const { data } = await api.post("/suggestions/generate", context);
  return data;
}
