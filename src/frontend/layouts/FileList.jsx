import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { format, isValid } from 'date-fns';

function FileList({ title, apiUrl, setModalIsOpen }) {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalIsOpen, setLocalModalIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [contextMenu, setContextMenu] = useState({ id: null, x: 0, y: 0 });
  const menuRef = useRef(null);

  // Config axios instance dengan header default
  const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'x-user-id': localStorage.getItem('user_id')
    }
  });
  
  useEffect(() => {
    const handleFileUploaded = (event) => {
      setFiles((prevFiles) => [...prevFiles, event.detail]);
    };
  
    window.addEventListener('fileUploaded', handleFileUploaded);
    return () => {
      window.removeEventListener('fileUploaded', handleFileUploaded);
    };
  }, []);
  

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(apiUrl); 
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        setFiles(response.data.data); // Update the state with the fetched files
      } else {
        throw new Error('Format data tidak valid');
      }
    } catch (err) {
      console.error("Gagal memuat file:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Call fetchFiles when the component mounts
  useEffect(() => {
    fetchFiles();
  }, [apiUrl]);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu({ id: null, x: 0, y: 0 });
      }
    };

    if (contextMenu.id) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'dd MMM yyyy') : 'N/A';
  };

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
  
    // Cek berdasarkan MIME type
    if (imageTypes.includes(file.file_type)) return 'image';
    if (docTypes.includes(file.file_type)) return 'document';
    if (videoTypes.includes(file.file_type)) return 'video';
    if (archiveTypes.includes(file.file_type)) return 'archive';
  
    // Fallback: cek berdasarkan ekstensi file
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
    return `fas ${icons[fileType]} text-blue-500 mr-4 text-xl`;
  };
 
  const handleContextMenu = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      id,
      x: e.clientX - 10,
      y: e.clientY + 10
    });
  };
  
  // Contoh untuk toggleFavorite
  const toggleFavorite = async (id, e) => {
    e.stopPropagation();
    try {
      await apiClient.patch(`/files/${id}/favorite`);
      await fetchFiles(); // Refresh data after update
    } catch (err) {
      console.error("Gagal mengubah favorite:", err);
      setError(err.message);
    }
  };
  
// Contoh untuk handleDelete
const handleDelete = (id) => {
  apiClient.delete(`/files/${id}`)
    .then(() => setFiles(files.filter(file => file.id !== id)))
    .catch(err => console.error("Delete failed:", err));
  setContextMenu({ id: null, x: 0, y: 0 });
};

  const handleShare = async (file) => {
    try {
      await navigator.share({
        title: file.filename,
        url: `http://localhost:5000${file.url}`
      });
    } catch (err) {
      console.error('Sharing failed:', err);
    }
  };

  const isImageFile = (file) => {
    if (!file) return false;
    return file.filename?.match(/\.(png|jpe?g|webp|gif)$/i);
  };
  
  const isVideoFile = (file) => {
    if (!file) return false;
    return file.filename?.match(/\.(mp4|mov|avi|mkv)$/i);
  };
  
  const isDocumentFile = (file) => {
    if (!file) return false;
    return file.filename?.match(/\.(pdf|docx?|xlsx?|pptx?)$/i);
  };
  
  const isZipFile = (file) => {
    if (!file) return false;
    return file.filename?.match(/\.(zip|rar|7z)$/i);
  };
  
  const openModal = (file) => {
    setSelectedFile(file);
    setLocalModalIsOpen(true);
    setModalIsOpen(true);
  };
  
  const closeAll = () => {
    setLocalModalIsOpen(false);
    setSelectedFile(null);
    setModalIsOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h2>
      
      {isLoading ? (
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
          <p className="mt-2 text-gray-600">Memuat data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-600">⚠️ Error: {error}</p>
          <button
            onClick={fetchFiles}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <ul className="bg-white rounded-lg overflow-hidden shadow-lg">
          {files.map((file, index) => (
            <li key={file.id} className="group">
              <div 
                className="px-6 py-4 hover:bg-blue-50 flex items-center cursor-pointer transition-colors relative"
                onClick={() => openModal(file)}
              >
                {/* Favorite Star */}
                <i
                  className={`fas fa-star mr-4 text-xl cursor-pointer ${
                    file.favorite ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  onClick={(e) => toggleFavorite(file.id, e)}
                />
                
                {/* File Info */}
                <div className="flex-1 flex items-center min-w-0">
                <i className={getFileIcon(getFileType(file))}></i>
                  <span className="truncate text-gray-800 font-medium">
                    {file.filename}
                  </span>
                </div>
  
                {/* Date and Size */}
                <div className="text-gray-500 text-sm mr-8">
                  {formatDate(file.created_at)}
                </div>
                <div className="text-gray-500 text-sm mr-8">
                {(file.file_size / (1024 * 1024)).toFixed(2)} MB
                </div>
  
                {/* Context Menu Trigger */}
                <div 
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(file.id, e);
                  }}
                >
                  <i className="fas fa-ellipsis-v" />
                </div>
  
                {/* Context Menu */}
                {contextMenu.id === file.id && (
                  <div 
                    ref={menuRef}
                    className="fixed bg-white shadow-lg rounded-md py-2 w-40 z-50"
                    style={{ 
                      left: `${contextMenu.x}px`,
                      top: `${contextMenu.y}px`,
                      transform: 'translateX(-100%)'
                    }}
                  >
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.id);
                      }}
                    >
                      <i className="fas fa-trash mr-2 text-red-500 w-4"></i>
                      Delete
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(file);
                      }}
                    >
                      <i className="fas fa-share mr-2 text-blue-500 w-4"></i>
                      Share
                    </button>
                  </div>
                )}
              </div>
              
              {/* Separator */}
              {index < files.length - 1 && (
                <div className="h-px bg-gray-200 mx-6"></div>
              )}
            </li>
          ))}
        </ul>
      )}
  
      {modalIsOpen && (
  <div 
    className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 backdrop-blur-sm"
    onClick={closeAll}
  >
    <div className="relative max-w-4xl w-full bg-white rounded-lg shadow-lg p-4" onClick={(e) => e.stopPropagation()}>
      <button 
        className="absolute -top-8 left-0 text-white hover:text-gray-300 text-3xl transition-colors"
        onClick={closeAll}
      >
        ✕
      </button>

      {isImageFile(selectedFile) ? (
        <img 
          src={`http://localhost:5000${selectedFile.url}`}
          alt={selectedFile.filename} 
          className="mx-auto max-h-[90vh] object-contain rounded-lg shadow-2xl bg-gray-100"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/fallback-image.png";
          }}
        />
      ) : isVideoFile(selectedFile) ? (
        <video controls className="mx-auto max-h-[90vh] rounded-lg shadow-2xl">
          <source src={`http://localhost:5000${selectedFile.url}`} type="video/mp4" />
          Browser Anda tidak mendukung video.
        </video>
      ) : isDocumentFile(selectedFile) ? (
        <iframe 
          src={`http://localhost:5000${selectedFile.url}`} 
          className="w-full h-[500px] rounded-lg shadow-2xl"
        >
        </iframe>
      ) : isZipFile(selectedFile) ? (
        <div className="text-center p-4">
          <p className="text-gray-600">File ZIP tidak bisa ditampilkan.</p>
          <a 
            href={`http://localhost:5000${selectedFile.url}`} 
            download 
            className="text-blue-500 underline"
          >
            Download ZIP
          </a>
        </div>
      ) : (
        <div className="text-center p-4">
          <p className="text-gray-500">Preview tidak tersedia</p>
        </div>
      )}
    </div>
  </div>
)}
    </div>
  );
}

export default FileList;