import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Sidebar from "../layouts/Sidebar";
import Header from "../layouts/Header";
import ProtectedRoute from "../components/ProtectedRoute";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardPage = location.pathname === "/dashboard";
  const [email, setEmail] = useState("");

  useEffect(() => {
    const userEmail = localStorage.getItem("email");
    if (!userEmail) {
      navigate("/sign-in");
    } else {
      setEmail(userEmail);
    }
  }, [navigate]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("email");
    localStorage.removeItem("token");
    navigate("/sign-in");
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4 bg-gray-50">
        <Header />

        {/* Konten utama */}
        <div className="flex-1 p-6 space-y-6">
          {isDashboardPage && (
            <div className="welcome-message text-center mb-6 bg-blue-100 p-6 rounded-lg shadow-lg">
              <h1 className="text-3xl font-bold text-blue-700 mb-4">
                Welcome to Worksphere Dashboard
              </h1>
              <p className="text-lg text-gray-700">
                Find the best job opportunities and manage your career.
              </p>
            </div>
          )}

          {isDashboardPage && (
            <div className="job-statistics bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Job Statistics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="stat-card bg-blue-50 p-4 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-blue-600">Open Positions</h3>
                  <p className="text-2xl font-bold text-gray-700">120</p>
                </div>
                <div className="stat-card bg-green-50 p-4 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-green-600">Applications Submitted</h3>
                  <p className="text-2xl font-bold text-gray-700">350</p>
                </div>
                <div className="stat-card bg-orange-50 p-4 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-orange-600">Jobs Closed</h3>
                  <p className="text-2xl font-bold text-gray-700">50</p>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="text-center">
            <p className="text-lg text-gray-700">Logged in as: {email}</p>
            <button 
              onClick={handleLogout} 
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
