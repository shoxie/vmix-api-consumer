import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  params: {
    authkey: process.env.NEXT_PUBLIC_AUTHKEY,
  },
});

export default axiosClient;