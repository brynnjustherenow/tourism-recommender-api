import axios from "axios";
import { message } from "antd";

const TOKEN_KEY = "tourism_admin_token";
const USER_KEY = "tourism_admin_user";

// Token Management
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error("Error setting token:", error);
  }
};

export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error removing token:", error);
  }
};

// User Info Management
export const getUser = () => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

export const setUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.error("Error setting user:", error);
  }
};

export const removeUser = () => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error("Error removing user:", error);
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) {
    return false;
  }

  // Check if token is expired (simple check, should use JWT decode in production)
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    if (payload.exp && payload.exp < currentTime) {
      removeToken();
      removeUser();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return false;
  }
};

// Check if user is admin
export const isAdmin = () => {
  const user = getUser();
  return user && user.role === "admin";
};

// Login API
export const login = async (username, password) => {
  try {
    const response = await axios.post("/auth/login", {
      username,
      password,
    });

    const { token, user } = response.data.data;

    // Store token and user info
    setToken(token);
    setUser(user);

    return { success: true, data: response.data.data };
  } catch (error) {
    const errorMessage =
      error.response?.data?.error || "登录失败，请检查用户名和密码";
    message.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Logout
export const logout = async () => {
  try {
    // Call logout API if needed
    await axios.post("/admin/auth/logout");
  } catch (error) {
    console.error("Logout API error:", error);
    // Continue with local logout even if API fails
  } finally {
    // Clear local storage
    removeToken();
    removeUser();

    // Redirect to login page
    window.location.href = "/login";
  }
};

// Verify Token
export const verifyToken = async () => {
  try {
    const token = getToken();
    if (!token) {
      return false;
    }

    const response = await axios.get("/admin/auth/verify");
    return response.data.valid;
  } catch (error) {
    console.error("Token verification failed:", error);
    return false;
  }
};

// Refresh Token (optional, if backend supports it)
export const refreshToken = async () => {
  try {
    const response = await axios.post("/auth/refresh-token");
    const { token } = response.data.data;

    setToken(token);
    return { success: true, token };
  } catch (error) {
    console.error("Token refresh failed:", error);
    return { success: false };
  }
};

// Get Current User Info
export const getCurrentUser = async () => {
  try {
    const token = getToken();
    if (!token) {
      return null;
    }

    const response = await axios.get("/auth/me");
    return response.data.data;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Decode JWT Token
export const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Clear all auth data
export const clearAuth = () => {
  removeToken();
  removeUser();
};

// Initialize auth on app load
export const initAuth = () => {
  const token = getToken();
  const user = getUser();

  if (token && user) {
    // Validate token
    const payload = decodeToken(token);
    if (payload && payload.exp) {
      const currentTime = Date.now() / 1000;
      if (payload.exp < currentTime) {
        // Token expired
        clearAuth();
        return { authenticated: false, reason: "expired" };
      }
    }

    // Set axios default header
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    return { authenticated: true, user };
  }

  return { authenticated: false, reason: "no_token" };
};
