import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const defaultBaseURL = Platform.select({
  android: "http://10.0.2.2:8000/api",
  ios: "http://localhost:8000/api",
  default: "http://localhost:8000/api",
});

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? defaultBaseURL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
