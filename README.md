# ![Bluebird Star App Logo](public/Logo/MainLogo.png)

# 🌟 Bluebird Star App - PWA Frontend

**Bluebird Star App** is a state-of-the-art **Progressive Web Application (PWA)** designed to revolutionize employee availability management and project tracking. This client-side application provides a seamless, high-performance interface for both managers and individual contributors, featuring real-time updates, gamified recognition, and offline capabilities.

---

## ✨ Key Features

### 👔 For Managers
- **Capacity Overview:** Visualize team availability at a glance with interactive charts.
- **Dynamic Assignments:** Create and manage **Inline Activities** that sync instantly with team dashboards.
- **recognition System:** Award **Stars** to high-performing team members to boost engagement.

### 👥 For Individual Contributors
- **Status Management:** Effortlessly log availability and project hours in a responsive interface.
- **Real-time Tasks:** View prioritized activities assigned directly by management.
- **Compliance Guard:** Built-in safeguards ensure employee profiles are refreshed every 15 days for data integrity.

---

## 🚀 Tech Stack

- **Core:** [React 18](https://reactjs.org/)
- **Navigation:** [React Router 7](https://reactrouter.com/)
- **Design System:** [React Bootstrap](https://react-bootstrap.github.io/) & [Styled Components](https://styled-components.com/)
- **UX Enhancements:** `react-toastify` for notifications, `react-datepicker` for scheduling.
- **PWA Core:** Service Workers, Web Push API, and Manifest integration for a native-like experience.

---

## 📂 Project Structure

```bash
bluebird-star-frontend/
├── public/           # Static assets & PWA configuration
│   ├── Logo/         # Branding and application icons
│   └── sw.js         # Service Worker for push notifications
├── src/
│   ├── components/   # Modular UI components (Navbars, Popups, Charts)
│   ├── screens/      # Complex view components (Dashboard, Login, Details)
│   ├── hooks/        # Custom React logic hooks
│   └── App.js        # Application root and routing logic
└── package.json      # Dependency management
```

---

## 🛠️ Setup & Installation

1. **Clone & Navigate:**
   ```bash
   cd workload_frontend
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Launch Development Server:**
   ```bash
   npm start
   ```
   > The application will be accessible at `http://localhost:3000`.

---

## 📱 Progressive Web App (PWA)

Bluebird Star App is fully optimized for mobile and desktop installation.
- **Installable:** Add to home screen directly via the custom installation prompt.
- **Push Notifications:** Stay updated with real-time alerts for:
  - New manager assignments.
  - Security-critical login events.
  - Profile update reminders.

---

## 🛡️ Security & Access Control

- **Protected Routes:** Critical dashboards are secured via authentication middleware.
- **Role-Based UI:** The interface dynamically adapts based on user privileges (`Manager` vs `IC`).

---

## 🔗 Repository Links

- **Backend Repository:** [Bluebird Star Backend](https://github.com/bluebirdttl/Bluebird_User_Backend.git)

