// src/App.js
import React, { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import LoginScreen from "./screens/LoginScreen"
import HomeScreen from "./screens/HomeScreen"
import ProfileScreen from "./screens/ProfileScreen"
import DetailScreen from "./screens/DetailScreen"
import DashboardPage from "./screens/DashboardPage"
import ResetPasswordScreen from "./screens/ResetPasswordScreen"

import ActivitiesScreen from "./screens/ActivitiesScreen"
import InlineActivitiesScreen from "./screens/InlineActivitiesScreen"

import PWAInstallPopup from "./components/PWAInstallPopup"

export default function App() {
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      // Only show if user is logged in (checked in render)
      // We can also check if it's already installed via other means, but this event only fires if installable
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallPopup(false);
  };

  const handleClosePopup = () => {
    setShowInstallPopup(false);
  };

  // Check if we should show the popup
  // Show if:
  // 1. We have a deferred prompt (browser says it's installable)
  // 2. User is logged in (user state is not null)
  // 3. We haven't explicitly closed it (showInstallPopup state - though we need to init this effectively)

  // Actually, let's sync showInstallPopup with deferredPrompt presence initially?
  // Or just use a separate effect.



  // initialize from sessionStorage so reload keeps logged-in user
  const initialUser = (() => {
    try {
      const raw = sessionStorage.getItem("user")
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })()

  const [user, setUser] = useState(initialUser)
  // console.log("[App] Current user state:", user);

  React.useEffect(() => {
    if (deferredPrompt && user) {
      setShowInstallPopup(true);
    }
  }, [deferredPrompt, user]);

  const handleLogin = (userData) => {
    try {
      sessionStorage.setItem("user", JSON.stringify(userData || {}))
    } catch (e) {
      // console.warn("sessionStorage write failed", e)
    }
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
    try {
      sessionStorage.removeItem("user")
    } catch { }
  }

  // Note: DO NOT call useNavigate() here at top-level of App.
  // Instead we'll define small wrapper components below and those wrappers will call useNavigate()
  // while being rendered inside <Router> so hooks are valid.

  // Merge-only-profile-keys helper (keeps details untouched)
  const mergeProfileIntoUser = (profileOnly) => {
    setUser((prev) => {
      const prevObj = prev || {}
      const merged = { ...prevObj, ...(profileOnly || {}) }
      try {
        const existing = JSON.parse(sessionStorage.getItem("user") || "{}")
        sessionStorage.setItem("user", JSON.stringify({ ...existing, ...(profileOnly || {}) }))
      } catch (e) {
        // console.warn("sessionStorage update failed:", e)
      }
      return merged
    })
  }

  // Render a Router and Routes. Any component that needs navigation will use a wrapper that calls useNavigate()
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={!user ? <LoginScreen onLogin={(u) => handleLogin(u)} /> : <Navigate to={(user.role_type || "").trim().toLowerCase() === "manager" ? "/dashboard" : "/details"} />}
        />

        {/* /dashboard route for Managers */}
        <Route
          path="/dashboard"
          element={
            user ? (
              (user.role_type || "").trim().toLowerCase() === "manager" ? <DashboardPage onLogout={handleLogout} /> : <Navigate to="/details" />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* /home route - keeps previous UX where Profile is toggled inside home */}
        <Route
          path="/home"
          element={
            user ? (
              (user.role_type || "").trim().toLowerCase() === "manager" ? <HomeScreen onLogout={handleLogout} employee={user} /> : <Navigate to="/details" />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Details route wrapper - useNavigate inside wrapper (valid because wrapper rendered inside Router) */}
        <Route
          path="/details"
          element={
            user ? <DetailsRoute user={user} mergeProfileIntoUser={mergeProfileIntoUser} setUser={setUser} onLogout={handleLogout} /> : <Navigate to="/" />
          }
        />

        {/* Profile route wrapper (route-based profile view) */}
        <Route
          path="/profile"
          element={user ? <ProfileRoute user={user} mergeProfileIntoUser={mergeProfileIntoUser} onLogout={handleLogout} /> : <Navigate to="/" />}
        />

        {/* Reset Password route wrapper */}
        <Route
          path="/reset-password"
          element={
            user ? <ResetPasswordRoute user={user} onLogout={handleLogout} /> : <Navigate to="/" />
          }
        />

        {/* Activities route wrapper (Manager only) */}
        <Route
          path="/activities"
          element={
            user ? (
              (user.role_type || "").trim().toLowerCase() === "manager" ? <ActivitiesScreen onLogout={handleLogout} /> : <Navigate to="/home" />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Inline Activities route wrapper (User only) */}
        <Route
          path="/inline-activities"
          element={
            user ? <InlineActivitiesScreen onLogout={handleLogout} /> : <Navigate to="/" />
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {
        showInstallPopup && (
          <PWAInstallPopup
            onInstall={handleInstallClick}
            onClose={handleClosePopup}
          />
        )
      }
    </Router >
  )
}

/* ----- Wrapper components (must be defined after default export or inside file) ----- */

/**
 * DetailsRoute
 * - Uses useNavigate safely (this component is rendered inside Router)
 * - onSaveDetails merges entire server details into user (details endpoint expected)
 */
function DetailsRoute({ user, mergeProfileIntoUser, setUser, onLogout }) {
  const navigate = useNavigate()

  const onSaveDetails = (serverRecord) => {
    // serverRecord likely contains details fields + maybe profile keys; merge whole record (details are allowed to update)
    setUser((prev) => ({ ...(prev || {}), ...(serverRecord || {}) }))
    try {
      const existing = JSON.parse(sessionStorage.getItem("user") || "{}")
      sessionStorage.setItem("user", JSON.stringify({ ...existing, ...(serverRecord || {}) }))
    } catch (e) {
      // console.warn("Failed to update sessionStorage after details save", e)
    }
    navigate("/inline-activities")
  }

  return <DetailScreen employee={user} onBack={() => navigate("/home")} onSaveDetails={onSaveDetails} onLogout={onLogout} />
}

/**
 * ProfileRoute
 * - Uses useNavigate safely
 * - onSaveProfile merges *only profile keys* returned from ProfileScreen
 */
function ProfileRoute({ user, mergeProfileIntoUser, onLogout }) {
  const navigate = useNavigate()

  const onSaveProfile = (profileOnly) => {
    mergeProfileIntoUser(profileOnly)
    navigate("/inline-activities")
  }

  return <ProfileScreen employee={user} onBack={() => navigate("/home")} onSaveProfile={onSaveProfile} onLogout={onLogout} />
}

/**
 * ResetPasswordRoute
 * - Uses useNavigate safely
 */
function ResetPasswordRoute({ user, onLogout }) {
  return <ResetPasswordScreen user={user} onLogout={onLogout} />;
}
