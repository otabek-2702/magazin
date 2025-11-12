import axios from "axios";
import router from "@/router";
import { toast } from "vue3-toastify";

// Create an Axios instance
const axiosIns = axios.create({
  baseURL: import.meta.env.VITE_DEV_MODE
    ? import.meta.env.VITE_BASE_URL_DEV ?? import.meta.env.VITE_BASE_URL
    : import.meta.env.VITE_BASE_URL,
});

axiosIns.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Handle redirection based on response error status.
 * @param {number} status - The HTTP status code from the response error.
 */
const handleRedirect = (status) => {
  let path = "";

  switch (status) {
    case 404:
      path = "/404";
      break;
    case 401:
      localStorage.removeItem("userAbilities");
      localStorage.removeItem("userData");
      localStorage.removeItem("accessToken");
      path = `/login?to=${
        router.currentRoute.value.path === "/login"
          ? ""
          : router.currentRoute.value.path
      }`;
      break;
    case 403:
      path = "/forbidden";
      break;
    default:
      return; // No redirection for other status codes
  }

  // Redirect to the specified path
  router
    .push(path)
    .then(() => {
      window.location.reload();
    })
    .catch((err) => {
      console.error("Navigation error:", err);
      window.location.reload();
    });
};

/**
 * Add response interceptor to handle errors and notify user.
 * @param {Object} response - The Axios response object.
 * @returns {Object} The response object if successful.
 * @throws {Promise} Rejects with the error object if an error occurs.
 */
axiosIns.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Log error before showing toast
      console.error("Error response:", error.response);
      toast(error.response.data.message ?? error.message, {
        theme: "auto",
        type: "error",
        autoClose: 1700,
      });

      // Handle redirection for specific status codes if not in development mode
      if (!import.meta.env.VITE_DEV_MODE) {
        handleRedirect(error.response.status);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosIns;
