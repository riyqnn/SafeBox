import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardPage = location.pathname === "/dashboard";
  const [email, setEmail] = useState("");
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0 });
  const [fileCount, setFileCount] = useState(0);

  // Fetch data from API every 5 seconds (real-time update)
  useEffect(() => {
    const userEmail = localStorage.getItem("email");
    if (!userEmail) {
      navigate("/sign-in");
    } else {
      setEmail(userEmail);
    }

    // Fetch storage data and file statistics
    const fetchData = async () => {
      try {
        const storageResponse = await axios.get("/api/storage"); // Ganti dengan URL API Anda
        const filesResponse = await axios.get("/api/file-statistics"); // Ganti dengan URL API Anda

        setStorageUsage(storageResponse.data);
        setFileCount(filesResponse.data.totalFiles);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    // Initial fetch
    fetchData();

    // Polling every 5 seconds
    const intervalId = setInterval(fetchData, 5000);

    // Clean up polling on component unmount
    return () => clearInterval(intervalId);
  }, [navigate]);

  return (
    <div className="flex">
      <div className="flex-1 p-4 bg-gray-50">
        {/* Welcome Message */}
        {isDashboardPage && (
          <div className="text-center mb-6 bg-blue-100 p-6 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-blue-700 mb-4">
              Welcome to SafeBox
            </h1>
            <p className="text-lg text-gray-700">
              Manage your files and explore your cloud storage.
            </p>
          </div>
        )}

        {/* Storage and File Statistics */}
        {isDashboardPage && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-4">Storage Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="stat-card bg-blue-50 p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-blue-600">Total Storage</h3>
                <p className="text-2xl font-bold text-gray-700">
                  {storageUsage.used}GB / {storageUsage.total}GB
                </p>
                <div className="w-full bg-blue-200 h-2 rounded-lg mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-lg"
                    style={{
                      width: `${(storageUsage.used / storageUsage.total) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="stat-card bg-green-50 p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-green-600">Total Files</h3>
                <p className="text-2xl font-bold text-gray-700">{fileCount}</p>
              </div>
            </div>
          </div>
        )}

        <ProtectedRoute>
          <Outlet />
        </ProtectedRoute>
      </div>
    </div>
  );
};

export default Dashboard;
