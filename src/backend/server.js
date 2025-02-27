import express from 'express';
import multer from 'multer';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Sesuaikan dengan frontend
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-user-id']
}));
app.use(express.json());

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
    database: process.env.DB_NAME
});

const handleError = (res, message, error) => {
    console.error(`${message}:`, error);
    res.status(500).json({ success: false, message: `${message}: ${error.message}` });
};


// Inisialisasi database
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Terhubung ke database');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
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
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        connection.release();
    } catch (err) {
        console.error('❌ Gagal terhubung ke database:', err);
        process.exit(1);
    }
})();

app.post('/api/users/get-or-create', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email diperlukan' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length > 0) {
            return res.json({ success: true, user: users[0] });
        } else {
            const result = await pool.query(
                'INSERT INTO users (email, name) VALUES (?, ?)',
                [email, name]
            );
            return res.json({ success: true, user: { id: result.insertId, email, name } });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
        res.status(500).json({ success: false, message: `Gagal validasi user: ${error.message}` });
    }
};

// Validasi jenis file
const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif'],
    document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ],
    video: ['video/mp4', 'video/quicktime'],
    archive: [
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ]
};

const allowedExtensions = {
    image: ['.jpg', '.jpeg', '.png', '.gif'],
    document: ['.pdf', '.doc', '.docx', '.txt'],
    video: ['.mp4', '.mov'],
    archive: ['.zip', '.rar', '.7z']
};

const fileFilter = (req, file, cb) => {
    const mimeType = file.mimetype;
    const ext = path.extname(file.originalname).toLowerCase();

    // Cek apakah file memiliki ekstensi atau MIME type yang diizinkan
    const isAllowed =
        (allowedTypes.image.includes(mimeType) || allowedExtensions.image.includes(ext)) ||
        (allowedTypes.document.includes(mimeType) || allowedExtensions.document.includes(ext)) ||
        (allowedTypes.video.includes(mimeType) || allowedExtensions.video.includes(ext)) ||
        (allowedTypes.archive.includes(mimeType) || allowedExtensions.archive.includes(ext));

    if (isAllowed) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${ext} (${mimeType}) tidak diperbolehkan`), false);
    }
};

// Konfigurasi Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.headers['x-user-id'];
        const userUploadsDir = path.join(uploadsDir, userId.toString());
        if (!fs.existsSync(userUploadsDir)) {
            fs.mkdirSync(userUploadsDir, { recursive: true });
        }
        cb(null, userUploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage, fileFilter });

// Endpoint upload file
app.post('/api/files/upload', validateUser, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File tidak ditemukan atau format tidak valid' });
        }

        const { id: userId } = req.user;
        const { filename, mimetype, size } = req.file;
        const filePath = `/uploads/${userId}/${filename}`;

        const [result] = await pool.query(
            `INSERT INTO files (user_id, filename, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)`,
            [userId, filename, filePath, mimetype, size]
        );

        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                user_id: userId,
                filename,
                url: `http://localhost:${PORT}${filePath}`,
                file_type: mimetype,
                file_size: size,
                favorite: false,
                created_at: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Gagal upload file: ${error.message}` });
    }
});

// Endpoint mendapatkan daftar file user
app.get('/api/files', validateUser, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { favorite } = req.query; // Ambil query param favorite

        let query = `SELECT *, CONCAT("/uploads/", user_id, "/", filename) as url 
                     FROM files WHERE user_id = ?`;
        let params = [userId];

        if (favorite === 'true') {
            query += ' AND favorite = 1';
        }

        query += ' ORDER BY created_at DESC';

        const [files] = await pool.query(query, params);
        res.json({ success: true, data: files });
    } catch (error) {
        res.status(500).json({ success: false, message: `Gagal mengambil file: ${error.message}` });
    }
});


app.patch('/api/files/:id/favorite', validateUser, async (req, res) => {
    try {
        const fileId = req.params.id;
        const { id: userId } = req.user;

        const [files] = await pool.query(
            'SELECT * FROM files WHERE id = ? AND user_id = ?',
            [fileId, userId]
        );

        if (files.length === 0) {
            return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
        }

        const newFavoriteStatus = !files[0].favorite;

        await pool.query('UPDATE files SET favorite = ? WHERE id = ? AND user_id = ?', [
            newFavoriteStatus,
            fileId,
            userId
        ]);

        res.json({ success: true, message: 'Status favorite diperbarui', favorite: newFavoriteStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: `Gagal memperbarui favorite: ${error.message}` });
    }
});

// Download file endpoint dengan validasi user
app.get('/api/files/:id/download', validateUser , async (req, res) => {
    try {
        // Cek kepemilikan file
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

// Delete file endpoint
app.get('/api/files/:id', validateUser, async (req, res) => {
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
        res.status(500).json({ success: false, message: `Gagal mengambil file: ${error.message}` });
    }
});

app.delete('/api/files/:id', validateUser, async (req, res) => {
    try {
        const fileId = req.params.id;
        const { id: userId } = req.user;

        // Cek apakah file ada dan milik user
        const [files] = await pool.query(
            'SELECT * FROM files WHERE id = ? AND user_id = ?',
            [fileId, userId]
        );

        if (files.length === 0) {
            return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
        }

        const filePath = path.join(__dirname, files[0].file_path);

        // Hapus file dari sistem
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Hapus dari database
        await pool.query('DELETE FROM files WHERE id = ?', [fileId]);

        res.json({ success: true, message: 'File berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, message: `Gagal menghapus file: ${error.message}` });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
