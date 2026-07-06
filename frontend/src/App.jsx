import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext.jsx"

import Home from "./components/Home.jsx"
import BestSelling from "./components/bestselling.jsx"
import Man from "./components/man.jsx"
import Women from "./components/women.jsx"
import Children from "./components/children.jsx"

import Login from "./components/login.jsx"
import Signup from "./components/signup.jsx"

import ForgotPassword from "./components/ForgotPassword.jsx"
import ResetPassword from "./components/ResetPassword.jsx"

import PaymentSuccess from "./components/PaymentSuccess.jsx"
import PaymentFailed from "./components/PaymentFailed.jsx"

import UserDashboard from "./components/UserDashboard.jsx"
import AdminDashboard from "./components/AdminDashboard.jsx"



const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px" }}>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/best-selling" element={<BestSelling />} />
      <Route path="/man" element={<Man />} />
      <Route path="/women" element={<Women />} />
      <Route path="/children" element={<Children />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed" element={<PaymentFailed />} />
      <Route
        path="/store"
        element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute adminOnly={true}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  )
}

export default App
