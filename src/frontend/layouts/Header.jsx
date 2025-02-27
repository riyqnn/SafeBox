import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) {
      setUser({ email });
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchActive(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getCurrentPage = () => {
    const path = location.pathname.split("/")[2] || location.pathname.split("/")[1];
    return path ? path.charAt(0).toUpperCase() + path.slice(1) : "";
  };

  const getDisplayText = () => {
    const currentPage = getCurrentPage();
    return currentPage || "Dashboard";
  };

  const getInitials = (email) => {
    return email ? email.charAt(0).toUpperCase() : "?";
  };

  const getPageIcon = () => {
    switch(getDisplayText()) {
      case "Dashboard": return "fa-chart-line";
      case "Files": return "fa-folder-open";
      case "Shared": return "fa-share-alt";
      case "Recent": return "fa-clock";
      case "Favorites": return "fa-star";
      case "Settings": return "fa-cog";
      default: return "fa-compass";
    }
  };

  return (
    <div 
      className={`sticky top-0 z-50 transition-all duration-300 bg-white ${
        scrolled ? 'py-3 shadow-sm' : 'py-4'
      } relative`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Left side with page title */}
          <div className="flex items-center space-x-3">
            <div className={`rounded-lg p-2.5 transition-all duration-300 ${
              scrolled 
                ? 'bg-blue-500 shadow-sm shadow-blue-200' 
                : 'bg-blue-100'
            }`}>
              <i className={`fas ${getPageIcon()} ${scrolled ? 'text-white' : 'text-blue-500'}`}></i>
            </div>
            
            <div className="flex flex-col">
              <h1 className="font-bold text-slate-800 text-lg leading-tight">
                {getDisplayText()}
              </h1>
              <div className="hidden sm:block text-xs text-slate-400">
                {new Date().toLocaleDateString('en-EN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Right side with search and profile */}
          <div className="flex items-center gap-4">
            {/* Animated Search with Auto-close */}
            <div ref={searchRef} className="relative">
              <div 
                onClick={() => setSearchActive(!searchActive)}
                className={`absolute inset-y-0 left-0 flex items-center pl-3 cursor-pointer ${
                  searchActive ? 'text-blue-500' : 'text-gray-400'
                }`}
              >
                <i className="fas fa-search"></i>
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchActive(true)}
                className={`py-2 pl-10 pr-4 rounded-full border transition-all duration-300 outline-none ${
                  searchActive 
                    ? 'w-64 border-blue-300 bg-blue-50 focus:bg-white focus:ring-2 focus:ring-blue-200' 
                    : 'w-10 md:w-40 border-gray-200 bg-white'
                }`}
              />
              {searchActive && searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {/* Profile with cool effects */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium shadow-sm">
                    {getInitials(user.email)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                
                <span className="hidden md:block text-sm text-gray-600 font-medium">
                  {user.email}
                </span>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>
      
      {/* Cool Accent Line at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500"></div>
    </div>
  );
};

export default Header;