import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "http://YOUR_PC_LOCAL_IP:8000/api", // e.g. http://192.168.0.10:8000/api
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
