import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, App as AntApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import "antd/dist/reset.css";
import "./index.css";

// Pages
import Login from "@pages/Login";
import Layout from "@components/Layout";
import Dashboard from "@pages/Dashboard";
import RecommendorManagement from "@pages/RecommendorManagement";
import DestinationManagement from "@pages/DestinationManagement";
import RecommendorsPublic from "@pages/RecommendorsPublic";
import RecommendorDetail from "@pages/RecommendorDetail";
import DestinationDetail from "@pages/DestinationDetail";

// Services
import { getToken, removeToken } from "@services/auth";
import { message } from "antd";

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || "/api";
axios.defaults.timeout = 30000;

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        message.error("登录已过期，请重新登录");
        removeToken();
        window.location.href = "/login";
      } else if (status === 403) {
        message.error("没有权限访问");
      } else if (status === 404) {
        message.error("请求的资源不存在");
      } else if (status >= 500) {
        message.error("服务器错误，请稍后重试");
      } else if (data && data.error) {
        message.error(data.error);
      } else {
        message.error("网络错误，请稍后重试");
      }
    } else if (error.request) {
      message.error("网络连接失败，请检查网络");
    } else {
      message.error("请求失败，请稍后重试");
    }

    return Promise.reject(error);
  },
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin (you can decode JWT or check user role)
  // For now, just checking if token exists
  // In production, you should decode the token and check user role
  return children;
};

const App = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 4,
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/recommendors" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recommendors" element={<RecommendorsPublic />} />
            <Route path="/recommendors/:id" element={<RecommendorDetail />} />
            <Route path="/destinations/:id" element={<DestinationDetail />} />

            {/* Admin Routes - Protected */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Layout />
                </AdminRoute>
              }
            >
              <Route
                index
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="recommendors" element={<RecommendorManagement />} />
              <Route path="destinations" element={<DestinationManagement />} />
            </Route>

            {/* 404 Page */}
            <Route path="*" element={<Navigate to="/recommendors" replace />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
