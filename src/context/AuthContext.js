import React, { createContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import {jwtDecode} from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
   const [mode, setMode] = useState(null);

  const accessTokenRef = useRef(accessToken);
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    const savedMode = localStorage.getItem("mode");
    if (savedMode) setMode(savedMode);
  }, []);

  useEffect(() => {
    if (mode) localStorage.setItem("mode", mode);
  }, [mode]);

const clientCleanup = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("mode");
  sessionStorage.clear(); 
  setAccessToken(null);
  setUser(null);
  setMode(null);
};


    // ==============================
  // Cart Logic
  // ==============================

  useEffect(() => {
    const savedCart = localStorage.getItem("user_cart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("user_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + item.quantity } : p
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Refresh token
  const refreshAccessToken = async () => {
    try {
      const res = await axios.post(
        "https://neil-backend-1.onrender.com/users/refresh",
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
      await axios.post("https://neil-backend-1.onrender.com/users/logout", {}, { withCredentials: true });
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
      "https://neil-backend-1.onrender.com/users/login",
      { email, password },
      { withCredentials: true }
    );

    if (res.status === 200 && res.data.accessToken) {
      const token = res.data.accessToken;
      const decodedUser = jwtDecode(token);
      localStorage.setItem("accessToken", token);
      setAccessToken(token);
      setUser(decodedUser);

      setMode(null);
      localStorage.removeItem("mode");

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
         cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount,
         mode, setMode 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
