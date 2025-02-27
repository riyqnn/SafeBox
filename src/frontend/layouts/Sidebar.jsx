import { NavLink, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";

const Sidebar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  // Refs for the dropdown containers
  const uploadRef = useRef(null);
  const createRef = useRef(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (uploadRef.current && !uploadRef.current.contains(event.target)) {
        setShowUploadMenu(false);
      }
      if (createRef.current && !createRef.current.contains(event.target)) {
        setShowCreateMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear upload status after 3 seconds
  useEffect(() => {
    if (uploadStatus) {
      const timer = setTimeout(() => {
        setUploadStatus(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus]);

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('email');
    localStorage.removeItem('token');
    navigate('/sign-in');
  };

  const menuItems = [
    { path: "/dashboard", icon: "fa-chart-line", label: "Overview" },
    { path: "/files", icon: "fa-folder-open", label: "Files" },
    { path: "/shared", icon: "fa-share-alt", label: "Shared" },
    { path: "/recent", icon: "fa-clock", label: "Recent" },
    { path: "/favorites", icon: "fa-star", label: "Favorites" },
  ];

  const createOptions = [
    { icon: "fa-file-word", label: "Text Document", action: () => { window.open("https://docs.google.com/document/create", "_blank"); setShowCreateMenu(false); }},
    { icon: "fa-file-excel", label: "Spreadsheet", action: () => { window.open("https://docs.google.com/spreadsheets/create", "_blank"); setShowCreateMenu(false); }},
    { icon: "fa-file-powerpoint", label: "Presentation", action: () => { window.open("https://docs.google.com/presentation/create", "_blank"); setShowCreateMenu(false); }},
    { icon: "fa-palette", label: "Canvas Design", action: () => { window.open("https://www.canva.com", "_blank"); setShowCreateMenu(false); }},
    { icon: "fa-wpforms", label: "Form", action: () => { window.open("https://forms.google.com/create", "_blank"); setShowCreateMenu(false); }}
  ];

  const uploadOptions = [
    { icon: "fa-image", label: "Upload Image", action: () => triggerUpload("image/*") },
    { icon: "fa-file-alt", label: "Upload Document", action: () => triggerUpload(".pdf,.doc,.docx,.txt") },
    { icon: "fa-video", label: "Upload Video", action: () => triggerUpload("video/*")},
    { icon: "fa-file-archive", label: "Upload Archive", action: () => triggerUpload(".zip,.rar,.7z") }
  ];
  
  const triggerUpload = (accept) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept; // Accepts multiple types
    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    };
    input.click();
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
  
    try {
      setIsUploading(true);
      setUploadStatus(null);
  
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        throw new Error('User  tidak terautentikasi');
      }
  
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload gagal');
      }
  
      const data = await response.json();
    
      // Pastikan data.data ada dan valid
      if (!data.data) throw new Error('Invalid response from server');
  
      // Dispatch event dengan detail yang lengkap
      window.dispatchEvent(new CustomEvent('fileUploaded', { 
        detail: {
          id: data.data.id,
          user_id: data.data.user_id,
          filename: data.data.filename,
          url: data.data.url,
          file_type: data.data.file_type,
          file_size: data.data.file_size,
          created_at: data.data.created_at,
          favorite: false 
        }
      }));
  
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus({
        success: false,
        message: error.message.replace('Error: ', '')
      });
    } finally {
      setIsUploading(false);
      setShowUploadMenu(false);
    }
  };
  
  return (
    <aside className={`bg-gradient-to-b from-slate-50 to-blue-50 min-h-screen transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} relative`}>
      <div className="h-full px-4 py-8 flex flex-col shadow-lg bg-white/40 backdrop-blur-sm">
        {/* Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-4 top-8 bg-gradient-to-r from-blue-500 to-blue-400 p-2 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
        >
          <i className={`fas fa-chevron-${isOpen ? 'left' : 'right'} text-white group-hover:animate-pulse`}></i>
        </button>

        {/* Logo */}
        <div className="mb-6 pl-2">
          <div className="flex items-center">
            <img src="/logo.png" alt="SafeBox" className="w-8 h-8" />
            {isOpen && <span className="ml-3 text-xl font-semibold text-slate-700">SafeBox</span>}
          </div>
          <div className="mt-4 border-b border-blue-100/80 w-full"></div>
        </div>

        {/* Upload Status Notification */}
        {uploadStatus && isOpen && (
          <div className={`mb-4 p-2 rounded-lg text-sm ${
            uploadStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className="flex items-center">
              <i className={`fas ${uploadStatus.success ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
              <span>{uploadStatus.message}</span>
            </div>
          </div>
        )}

        {/* Upload & Create Buttons */}
        <div className="space-y-2 mb-6">
          {/* Upload Button with Dropdown */}
          <div className="relative" ref={uploadRef}>
            <button
              onClick={() => {
                setShowUploadMenu(!showUploadMenu);
                setShowCreateMenu(false);
              }}
              className={`w-full text-white rounded-xl px-4 py-3 flex items-center justify-center transition-all duration-200 ${
                isUploading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-[#3B5970] hover:shadow-lg'
              }`}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {isOpen && <span>Mengupload...</span>}
                </>
              ) : (
                <>
                  <i className="fas fa-cloud-upload-alt mr-2"></i>
                  {isOpen && <span>Upload</span>}
                </>
              )}
            </button>
            {showUploadMenu && isOpen && !isUploading && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-lg py-2 z-50">
                {uploadOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={option.action}
                    className="w-full flex items-center px-4 py-2 text-slate-600 hover:bg-blue-50 transition-colors"
                  >
                    <i className={`fas ${option.icon} w-5`}></i>
                    <span className="ml-2">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create Button with Dropdown */}
          <div className="relative" ref={createRef}>
            <button
              onClick={() => {
                setShowCreateMenu(!showCreateMenu);
                setShowUploadMenu(false);
              }}
              className="w-full bg-[#5B88AA] text-white rounded-xl px-4 py-3 flex items-center justify-center hover:shadow-lg transition-all duration-200"
            >
              <i className="fas fa-plus mr-2"></i>
              {isOpen && <span>Create New</span>}
            </button>
            {showCreateMenu && isOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-lg py-2 z-50">
                {createOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={option.action}
                    className="w-full flex items-center px-4 py-2 text-slate-600 hover:bg-green-50 transition-colors"
                  >
                    <i className={`fas ${option.icon} w-5`}></i>
                    <span className="ml-2">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-md shadow-blue-200' 
                        : 'text-slate-600 hover:bg-white/80'
                    }`
                  }
                >
                  <i className={`fas ${item.icon} ${isOpen ? 'w-5' : 'w-full text-center'}`}></i>
                  {isOpen && <span className="ml-3">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Settings & Logout */}
          <div className="mt-8 space-y-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-slate-500 to-slate-400 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-white/80'
                }`
              }
            >
              <i className={`fas fa-cog ${isOpen ? 'w-5' : 'w-full text-center'}`}></i>
              {isOpen && <span className="ml-3">Settings</span>}
            </NavLink>

            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 
                text-red-500 hover:bg-red-50 ${!isOpen && 'justify-center'}`}
            >
              <i className={`fas fa-sign-out-alt ${isOpen ? 'w-5' : 'w-full text-center'}`}></i>
              {isOpen && <span className="ml-3">Logout</span>}
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;