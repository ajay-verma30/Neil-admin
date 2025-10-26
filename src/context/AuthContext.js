import React, { createContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import {jwtDecode} from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const accessTokenRef = useRef(accessToken);
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Cleanup function
  const clientCleanup = () => {
    localStorage.removeItem("accessToken");
    setAccessToken(null);
    setUser(null);
  };

  // Refresh token
  const refreshAccessToken = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3000/users/refresh",
        {},
        { withCredentials: true }
      );
      const token = res.data.accessToken;
      localStorage.setItem("accessToken", token);
      setAccessToken(token);
      setUser(jwtDecode(token));
      return token;
    } catch (err) {
      console.error("Refresh token error:", err.response?.data?.message || err.message);
      clientCleanup();
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await axios.post("http://localhost:3000/users/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout error (server cleanup failed):", err);
    }
    clientCleanup();
  };

  // Initialize from localStorage
  useEffect(() => {
    const init = () => {
      const token = localStorage.getItem("accessToken");
      if (token && token !== "undefined") {
        try {
          setAccessToken(token);
          setUser(jwtDecode(token));
        } catch (err) {
          console.error("Failed to decode token:", err);
          clientCleanup();
        }
      }
      setLoading(false);
    };

    init();

    // Axios interceptors
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = accessTokenRef.current;
        if (token && !config.headers.Authorization) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const isAuthError =
          error.response?.status === 401 || error.response?.status === 403;
        const isTokenExpiredMessage =
          error.response?.data?.message?.includes("Invalid Token") ||
          error.response?.data?.message?.includes("Expired");

        if (isAuthError && isTokenExpiredMessage && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await refreshAccessToken();
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      const res = await axios.post(
        "http://localhost:3000/users/login",
        { email, password },
        { withCredentials: true }
      );

      if (res.status === 200 && res.data.accessToken) {
        const token = res.data.accessToken;
        const decodedUser = jwtDecode(token);
        localStorage.setItem("accessToken", token);
        setAccessToken(token);
        setUser(decodedUser);

        return {
          success: true,
          org_id: decodedUser.org_id,
          role: decodedUser.role,
        };
      } else {
        return { success: false, message: "Login failed." };
      }
    } catch (err) {
      console.error("Login error:", err);
      return {
        success: false,
        message: err.response?.data?.message || "Login failed. Try again.",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        refreshAccessToken,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
