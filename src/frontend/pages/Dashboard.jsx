import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { format, isValid } from 'date-fns';
import ProtectedRoute from "../components/ProtectedRoute";
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "x-user-id": localStorage.getItem("user_id"),
  },
});

const getFileType = (file) => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const docTypes = [
    'application/pdf',
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  const videoTypes = ['video/mp4', 'video/quicktime'];
  const archiveTypes = [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];

  if (imageTypes.includes(file.file_type)) return 'image';
  if (docTypes.includes(file.file_type)) return 'document';
  if (videoTypes.includes(file.file_type)) return 'video';
  if (archiveTypes.includes(file.file_type)) return 'archive';

  const ext = file.filename.split('.').pop().toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return 'document';
  if (['mp4', 'mov'].includes(ext)) return 'video';
  if (['zip', 'rar', '7z'].includes(ext)) return 'archive';

  return 'other';
};

const getFileIcon = (fileType) => {
  const icons = {
    image: 'fa-image',
    document: 'fa-file-alt',
    video: 'fa-video',
    archive: 'fa-file-archive',
    other: 'fa-file'
  };
  return `fas ${icons[fileType]} text-blue-500 text-xl mr-3`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboardPage = location.pathname === "/dashboard";
  const [email, setEmail] = useState("");
  const [storageUsage, setStorageUsage] = useState({ 
    used: 0, 
    total: 15 * 1024 ** 3 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fileCount, setFileCount] = useState(0);
  const [recentFiles, setRecentFiles] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [storageBreakdown, setStorageBreakdown] = useState([
    { type: 'Documents', size: 0, color: 'bg-blue-500' },
    { type: 'Images', size: 0, color: 'bg-green-500' },
    { type: 'Videos', size: 0, color: 'bg-purple-500' },
    { type: 'Others', size: 0, color: 'bg-yellow-500' }
  ]);

  useEffect(() => {
    const userEmail = localStorage.getItem("email");
    if (!userEmail) {
      navigate("/sign-in");
    } else {
      setEmail(userEmail);
      fetchStorageData();

      const interval = setInterval(fetchStorageData, 5000);
      return () => clearInterval(interval);
    }
  }, [navigate]);

  const fetchStorageData = async () => {
    try {
      setIsLoading(true);
      
      // Ambil data files dan activity sekaligus
      const [filesResponse, activityResponse] = await Promise.all([
        apiClient.get("/files"),
        apiClient.get("/activity")
      ]);

      if (!filesResponse.data?.success || !activityResponse.data?.success) {
        throw new Error("Gagal memuat data");
      }

      const allFiles = filesResponse.data.data || [];
      const activityData = activityResponse.data.data || [];

      const usedStorage = allFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);

      const breakdown = allFiles.reduce(
        (acc, file) => {
          const [mainType] = file.file_type.split("/");
          if (mainType === "image") acc.Images += file.file_size || 0;
          else if (
            mainType === "application" &&
            (file.file_type.includes("pdf") || 
             file.file_type.includes("msword") || 
             file.file_type.includes("text"))
          ) {
            acc.Documents += file.file_size || 0;
          } else if (mainType === "video") {
            acc.Videos += file.file_size || 0;
          } else {
            acc.Others += file.file_size || 0;
          }
          return acc;
        },
        { Documents: 0, Images: 0, Videos: 0, Others: 0 }
      );

      setStorageUsage(prev => ({ ...prev, used: usedStorage }));
      setFileCount(allFiles.length);
      setRecentFiles(
        [...allFiles]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
      );
      setStorageBreakdown([
        { type: "Documents", size: breakdown.Documents, color: "bg-blue-500" },
        { type: "Images", size: breakdown.Images, color: "bg-green-500" },
        { type: "Videos", size: breakdown.Videos, color: "bg-purple-500" },
        { type: "Others", size: breakdown.Others, color: "bg-yellow-500" }
      ]);
      setActivityLog(activityData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes >= 1024 ** 3) {
      return `${(sizeInBytes / 1024 ** 3).toFixed(2)} GB`;
    }
    if (sizeInBytes >= 1024 ** 2) {
      return `${(sizeInBytes / 1024 ** 2).toFixed(2)} MB`;
    }
    if (sizeInBytes >= 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    }
    return `${sizeInBytes} Bytes`;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return isValid(date) ? format(date, 'dd MMM yyyy HH:mm') : 'N/A';
    } catch (error) {
      return 'N/A';
    }
  };

  const renderDashboardContent = () => {
    if (!isDashboardPage) return null;
    const storagePercentage = (storageUsage.used / storageUsage.total) * 100;

    return (
      <div className="p-4 bg-gray-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-xl p-6 md:p-8 mb-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome to SafeBox</h1>
              <p className="opacity-90">Your secure cloud storage solution</p>
            </div>
            <div className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm p-3 rounded-lg">
              <p className="text-sm font-medium">{email}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Storage Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Storage Used</h3>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatFileSize(storageUsage.used)}
                      <span className="text-sm font-normal text-gray-500">
                        {" "}of {formatFileSize(storageUsage.total)}
                      </span>
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      storagePercentage > 85
                        ? "bg-red-500"
                        : storagePercentage > 60
                        ? "bg-yellow-500"
                        : "bg-blue-600"
                    }`}
                    style={{ width: `${storagePercentage}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {storagePercentage.toFixed(1)}% used
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Files</h3>
                    <p className="text-2xl font-bold text-gray-800">{fileCount}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full text-green-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Documents
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Images
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Other
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Files */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Recent Files</h2>
                <button
                  onClick={() => navigate('/recent')}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View All
                </button>
              </div>

              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentFiles.length > 0 ? (
                    recentFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <i className={`${getFileIcon(getFileType(file))}`}></i>
                        <div className="flex-grow min-w-0">
                          <h3 className="text-sm font-medium text-gray-800 truncate">
                            {file.filename}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                          </p>
                        </div>
                        <button
                          className="text-gray-400 hover:text-gray-600 focus:outline-none ml-2"
                          onClick={() => navigate(`/files/${file.id}`)}
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-gray-500">No recent files</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Storage Breakdown */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Storage Breakdown</h2>
              <div className="space-y-3">
                {storageBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 ${item.color} rounded-full mr-2`}></div>
                      <span className="text-sm text-gray-600">{item.type}</span>
                    </div>
                    <span className="text-sm font-medium">{formatFileSize(item.size)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLog && activityLog.length > 0 ? (
                    activityLog.map((activity, index) => (
                      <div key={index} className="flex items-start text-sm border-l-2 border-blue-500 pl-3 py-1">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{activity.action}</p>
                          <p className="text-xs text-gray-500">
                            {isValid(new Date(activity.timestamp)) 
                              ? format(new Date(activity.timestamp), 'dd MMM yyyy HH:mm')
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className ="text-center py-4 text-gray-500">No recent activity</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-50">
      {isDashboardPage ? renderDashboardContent() : null}
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    </div>
  );
};

export default Dashboard;