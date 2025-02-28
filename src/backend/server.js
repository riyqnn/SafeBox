import express from 'express';
import multer from 'multer';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-user-id']
}));
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Konfigurasi direktori upload
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Koneksi database
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Inisialisasi database
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Terhubung ke database');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                filename VARCHAR(255) NOT NULL,
                file_path TEXT NOT NULL,
                file_type VARCHAR(100) NOT NULL,
                file_size BIGINT NOT NULL,
                favorite BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                action VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        connection.release();
    } catch (err) {
        console.error('❌ Gagal terhubung ke database:', err);
        process.exit(1);
    }
})();

// Helper functions
const handleError = (res, message, error) => {
    console.error(`${message}:`, error);
    res.status(500).json({ success: false, message: `${message}: ${error.message}` });
};

const logActivity = async (userId, action) => {
    try {
        await pool.query(
            `INSERT INTO activity_log (user_id, action) VALUES (?, ?)`,
            [userId, action]
        );
    } catch (error) {
        console.error('Gagal mencatat aktivitas:', error);
    }
};

// Routes
app.post('/api/users/get-or-create', async (req, res) => {
    try {
        const { email, name } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Email tidak valid' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length > 0) {
            return res.json({ success: true, user: users[0] });
        }

        const [result] = await pool.query(
            'INSERT INTO users (email, name) VALUES (?, ?)',
            [email, name]
        );

        res.json({ 
            success: true, 
            user: { 
                id: result.insertId, 
                email, 
                name,
                created_at: new Date()
            } 
        });
    } catch (error) {
        handleError(res, 'Server error', error);
    }
});

// Middleware validasi user
const validateUser = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User ID diperlukan' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User tidak valid' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        handleError(res, 'Gagal validasi user', error);
    }
};

// File handling
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'video/mp4', 'video/quicktime',
        'application/zip', 'application/x-rar-compressed',
        'application/x-7z-compressed'
    ];

    const allowedExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.pdf',
        '.doc', '.docx', '.txt', '.mp4', '.mov',
        '.zip', '.rar', '.7z'
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Jenis file tidak didukung: ${ext} (${file.mimetype})`));
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.headers['x-user-id'];
        const userUploadsDir = path.join(uploadsDir, userId);
        fs.mkdirSync(userUploadsDir, { recursive: true });
        cb(null, userUploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 100 } // 100MB
});

app.post('/api/files/upload', validateUser, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File tidak valid' });
        }

        const { id: userId } = req.user;
        const { filename, mimetype, size } = req.file;

        // Cek duplikat file
        const [existing] = await pool.query(
            'SELECT id FROM files WHERE user_id = ? AND filename = ?',
            [userId, filename]
        );

        if (existing.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'File dengan nama yang sama sudah ada' 
            });
        }

        const filePath = `/uploads/${userId}/${filename}`;
        const [result] = await pool.query(
            `INSERT INTO files (user_id, filename, file_path, file_type, file_size)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, filename, filePath, mimetype, size]
        );

        // Catat aktivitas
        await logActivity(userId, `File uploaded: ${filename}`);

        res.status(201).json({
            success: true,
            data: {
                ...req.file,
                id: result.insertId,
                url: `http://localhost:${PORT}${filePath}`,
                favorite: false,
                created_at: new Date()
            }
        });
    } catch (error) {
        handleError(res, 'Gagal upload file', error);
    }
});

app.get('/api/files', validateUser, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { favorite } = req.query;

        let query = `SELECT *, CONCAT('/uploads/', user_id, '/', filename) as url 
                     FROM files WHERE user_id = ?`;
        const params = [userId];

        if (favorite === 'true') {
            query += ' AND favorite = 1';
        }

        query += ' ORDER BY created_at DESC';

        const [files] = await pool.query(query, params);
        res.json({ success: true, data: files });
    } catch (error) {
        handleError(res, 'Gagal mengambil file', error);
    }
});

app.patch('/api/files/:id/favorite', validateUser, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const fileId = req.params.id;

        const [files] = await pool.query(
            'SELECT * FROM files WHERE id = ? AND user_id = ?',
            [fileId, userId]
        );

        if (files.length === 0) {
            return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
        }

        const newStatus = !files[0].favorite;
        await pool.query(
            'UPDATE files SET favorite = ? WHERE id = ?',
            [newStatus, fileId]
        );

        // Catat aktivitas
        const action = newStatus ? 'marked as favorite' : 'removed from favorites';
        await logActivity(userId, `File ${files[0].filename} ${action}`);

        res.json({ 
            success: true, 
            message: 'Status favorite diperbarui',
            favorite: newStatus 
        });
    } catch (error) {
        handleError(res, 'Gagal memperbarui favorite', error);
    }
});

app.delete('/api/files/:id', validateUser, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const fileId = req .params.id;

        const [files] = await pool.query(
            'SELECT * FROM files WHERE id = ? AND user_id = ?',
            [fileId, userId]
        );

        if (files.length === 0) {
            return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
        }

        // Catat aktivitas sebelum menghapus
        await logActivity(userId, `File deleted: ${files[0].filename}`);

        const filePath = path.join(__dirname, files[0].file_path);

        // Hapus file dari sistem
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Hapus dari database
        await pool.query('DELETE FROM files WHERE id = ?', [fileId]);

        res.json({ success: true, message: 'File berhasil dihapus' });
    } catch (error) {
        handleError(res, 'Gagal menghapus file', error);
    }
});

app.get('/api/files/:id', validateUser , async (req, res) => {
    try {
        const fileId = req.params.id;
        const { id: userId } = req.user;

        const [files] = await pool.query(
            `SELECT *, CONCAT("/uploads/", user_id, "/", filename) as url 
             FROM files WHERE id = ? AND user_id = ?`, 
            [fileId, userId]
        );

        if (files.length === 0) {
            return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
        }

        res.json({ success: true, data: files[0] });
    } catch (error) {
        handleError(res, 'Gagal mengambil file', error);
    }
});

app.get('/api/files/:id/download', validateUser , async (req, res) => {
    try {
        const [results] = await pool.query(
            'SELECT * FROM files WHERE id = ? AND user_id = ?', 
            [req.params.id, req.user.id]
        );

        if (results.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'File tidak ditemukan' 
            });
        }

        const filePath = path.join(__dirname, results[0].file_path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan di server'
            });
        }
        
        // Download file
        res.download(filePath, results[0].filename, (downloadErr) => {
            if (downloadErr) {
                console.error('Download error:', downloadErr);
                return res.status(500).json({
                    success: false,
                    message: 'Gagal mengunduh file',
                    error: downloadErr.message
                });
            }
        });
    } catch (err) {
        handleError(res, 'Gagal mengunduh file', err);
    }
});

// Get activity log
app.get('/api/activity', validateUser, async (req, res) => {
    try {
        const { id: userId } = req.user;
        
        const [activities] = await pool.query(
            `SELECT * FROM activity_log 
             WHERE user_id = ? 
             ORDER BY timestamp DESC 
             LIMIT 10`,
            [userId] 
        );

        res.json({ 
            success: true, 
            data: activities.map(activity => ({
                action: activity.action,
                timestamp: activity.timestamp
            }))
        });
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ 
            success: false, 
            message: `Gagal mengambil log aktivitas: ${error.message}` 
        });
    }
});


// Middleware untuk menangani route yang tidak ada
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});