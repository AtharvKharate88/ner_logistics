import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReportIncident from "./pages/ReportIncident";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import RouteHistory from "./pages/RouteHistory";
import FieldOfficerLogin from "./pages/FieldOfficerLogin";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import RoutePlanner from "./pages/RoutePlanner";
import RiskPrediction from "./pages/RiskPrediction";
import NotFound from "./pages/NotFound";
import { Navigate } from "react-router-dom";
import { isFieldOfficer } from "./utils/auth";
function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((open) => !open);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      <Navbar onMenuClick={toggleSidebar} />

      <div className="app-shell__body">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />

        <main className="app-shell__content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/field-officer/login" element={<FieldOfficerLogin />} />
            <Route
              path="/field-officer/report"
              element={<ReportIncident />}
            />
            <Route
              path="/dashboard"
              element={
                isFieldOfficer() ? <Dashboard /> : <Navigate to="/field-officer/login" replace />
              }
            />
            <Route path="/route-planner" element={<RoutePlanner />} />
            <Route path="/risk-prediction" element={<RiskPrediction />} />
            <Route path="/route-history" element={<RouteHistory />} />
            <Route path="*" element={<NotFound />} />
            
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;