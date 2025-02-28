import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import "./App.css";
import Login from "./frontend/pages/Login";
import Register from "./frontend/pages/Register";
import Dashboard from "./frontend/pages/Dashboard";
import Files from "./frontend/pages/Files";
import Sidebar from "./frontend/layouts/Sidebar";
import Header from "./frontend/layouts/Header";
import Recent from "./frontend/pages/Recent";
import Favorites from './frontend/pages/Favorites';
import Shared from './frontend/pages/Shared';

const MainLayout = ({ children, isPopupOpen }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4 bg-gray-50">
        {!isPopupOpen && <Header />} {/* Sembunyikan Header jika modal aktif */}
        {children}
      </div>
    </div>
  );
};

function App() {
  const isAuthenticated = localStorage.getItem("email");
  const [isPopupOpen, setPopupOpen] = useState(false); // State global untuk modal

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/sign-in"} />} />
        <Route path="/sign-in" element={<Login />} />
        <Route path="/sign-up" element={<Register />} />

        <Route 
          path="/dashboard" 
          element={isAuthenticated ? (
            <MainLayout isPopupOpen={isPopupOpen}>
              <Dashboard />
            </MainLayout>
          ) : (
            <Navigate to="/sign-in" />
          )}
        />
        
        <Route 
          path="/files" 
          element={isAuthenticated ? (
            <MainLayout isPopupOpen={isPopupOpen}>
              <Files />
            </MainLayout>
          ) : (
            <Navigate to="/sign-in" />
          )}
        />

        <Route 
          path="/shared" 
          element={isAuthenticated ? (
            <MainLayout isPopupOpen={isPopupOpen}>
              <Shared setModalIsOpen={setPopupOpen} />
            </MainLayout>
          ) : (
            <Navigate to="/sign-in" />
          )}
        />

        <Route 
          path="/recent" 
          element={isAuthenticated ? (
            <MainLayout isPopupOpen={isPopupOpen}>
              <Recent setModalIsOpen={setPopupOpen} />
            </MainLayout>
          ) : (
            <Navigate to="/sign-in" />
          )}
        />

        <Route 
          path="/favorites" 
          element={isAuthenticated ? (
            <MainLayout isPopupOpen={isPopupOpen}>
              <Favorites setModalIsOpen={setPopupOpen} />
            </MainLayout>
          ) : (
            <Navigate to="/sign-in" />
          )}
        />
      </Routes>
    </Router>
  );
}

export default App;
