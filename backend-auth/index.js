require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET;
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

// Asegurar que el directorio de uploads existe
const uploadDir = path.join(__dirname, 'uploads/profile-pics');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de multer para subida de imágenes
const storage = multer.memoryStorage(); // Cambiamos a memoria para procesar antes de guardar

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
  }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexión a la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) {
    console.error('Error conectando a la BD:', err);
  } else {
    console.log('Conectado a la base de datos MySQL');
  }
});

// 🟢 Registro de usuario (POST)
app.post('/register', async (req, res) => {
    console.log('Datos recibidos:', req.body);
  
    const { nombre, correo, contrasena, captchaToken } = req.body;
    if (!nombre || !correo || !contrasena || !captchaToken) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    try {
      // Verificar el token de reCAPTCHA
      const recaptchaResponse = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${captchaToken}`
      );

      if (!recaptchaResponse.data.success) {
        return res.status(400).json({ error: 'Verificación de reCAPTCHA fallida' });
      }

      const hashedPassword = await bcrypt.hash(contrasena, 10);
      const sql = 'INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, ?)';

      db.query(sql, [nombre, correo, hashedPassword], (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El correo ya está registrado' });
          }
          return res.status(500).json({ error: 'Error al registrar usuario' });
        }
        res.json({ message: 'Usuario registrado correctamente' });
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
});

// 🟢 Login de usuario (POST)
app.post('/login', (req, res) => {
    console.log('Datos recibidos en login:', req.body); // ✅ Verifica qué datos llegan
  
    const { correo, contrasena } = req.body;
    
    if (!correo || !contrasena) {
      console.error('❌ Error: Faltan datos en la petición');
      return res.status(400).json({ error: 'Faltan datos en la petición' });
    }
  
    const sql = 'SELECT * FROM usuarios WHERE correo = ?';
    db.query(sql, [correo], async (err, results) => {
      if (err) {
        console.error('❌ Error en la consulta SQL:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
      }
  
      if (results.length === 0) {
        console.warn('⚠️ Advertencia: Usuario no encontrado');
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
  
      const user = results[0];
      const isMatch = await bcrypt.compare(contrasena, user.contrasena);
  
      if (!isMatch) {
        console.warn('⚠️ Advertencia: Contraseña incorrecta');
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
  
      const token = jwt.sign({ id: user.id, nombre: user.nombre, correo: user.correo }, JWT_SECRET, { expiresIn: '1h' });
  
      console.log('✅ Login exitoso para:', correo);
      res.json({ message: 'Login exitoso', token });
    });
  });

// 🟠 Logout (no es necesario en backend, solo indica éxito)
app.post('/logout', (req, res) => {
  res.json({ message: 'Logout exitoso' });
});

// 🟢 Obtener todos los grupos (GET)
app.get('/grupos', (req, res) => {
  const sql = 'SELECT id, grado, grupo, carrera, modalidad FROM grupos';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error obteniendo grupos:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results);
  });
});

// 🟢 Obtener alumnos de un grupo
app.get('/grupos/:id/alumnos', (req, res) => {
  const grupoId = req.params.id;
  const sql = `
    SELECT alumnos.id, alumnos.nombre, alumnos.apellido, alumnos.grado 
    FROM alumnos 
    WHERE alumnos.id_grupo = ?
  `;

  db.query(sql, [grupoId], (err, results) => {
    if (err) {
      console.error('Error obteniendo alumnos del grupo:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results);
  });
});

// 🛑 Eliminar un alumno por ID
app.delete('/alumnos/:id', (req, res) => {
  const alumnoId = req.params.id;
  const sql = 'DELETE FROM alumnos WHERE id = ?';

  db.query(sql, [alumnoId], (err, result) => {
    if (err) {
      console.error('Error eliminando alumno:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    res.json({ message: 'Alumno eliminado correctamente' });
  });
});

// 🔄 Editar nombre y apellido de un alumno por ID
app.put('/alumnos/:id', (req, res) => {
  const alumnoId = req.params.id;
  const { nombre, apellido } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ error: 'Nombre y apellido son obligatorios' });
  }

  const sql = 'UPDATE alumnos SET nombre = ?, apellido = ? WHERE id = ?';

  db.query(sql, [nombre, apellido, alumnoId], (err, result) => {
    if (err) {
      console.error('Error actualizando alumno:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    res.json({ message: 'Alumno actualizado correctamente' });
  });
});

// 🛡️ Verificar token
app.get('/verify-token', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extraer token del encabezado

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    res.json({ message: 'Token válido', usuario: decoded });
  });
});

// 🔍 Obtener información del usuario
app.get('/user-info', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const sql = `
      SELECT id, nombre, correo, especialidad, foto_perfil, curriculum, sobre_mi, 
             creado_en, origen, numero_telefono, domicilio 
      FROM usuarios 
      WHERE id = ?
    `;

    db.query(sql, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error al obtener información del usuario:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(results[0]);
    });
  });
});

// 🔄 Actualizar información del usuario
app.put('/user-info', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const { nombre, especialidad, origen, sobre_mi, numero_telefono, domicilio } = req.body;
    const sql = `
      UPDATE usuarios 
      SET nombre = ?, especialidad = ?, origen = ?, sobre_mi = ?, 
          numero_telefono = ?, domicilio = ?
      WHERE id = ?
    `;

    db.query(sql, [nombre, especialidad, origen, sobre_mi, numero_telefono, domicilio, decoded.id], (err, result) => {
      if (err) {
        console.error('Error al actualizar información del usuario:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ message: 'Información actualizada correctamente' });
    });
  });
});

// 🖼️ Actualizar foto de perfil
app.post('/update-profile-pic', upload.single('foto'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Procesar la imagen con sharp
    const filename = 'profile-' + Date.now() + '.webp';
    const filepath = path.join(uploadDir, filename);

    // Procesar y recortar la imagen en un cuadrado
    await sharp(req.file.buffer)
      .resize(500, 500, { // Tamaño fijo de 500x500
        fit: sharp.fit.cover, // Recortar y centrar
        position: 'center'
      })
      .webp({ quality: 80 }) // Convertir a webp para mejor compresión
      .toFile(filepath);

    // Obtener la foto anterior para eliminarla
    const sqlSelect = 'SELECT foto_perfil FROM usuarios WHERE id = ?';
    db.query(sqlSelect, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error al obtener foto anterior:', err);
      } else if (results[0]?.foto_perfil) {
        const oldPath = path.join(__dirname, results[0].foto_perfil.replace(/^\/uploads\//, 'uploads/'));
        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, (err) => {
            if (err) console.error('Error al eliminar foto anterior:', err);
          });
        }
      }

      // Actualizar con la nueva foto
      const newPhotoUrl = `/uploads/profile-pics/${filename}`;
      const sqlUpdate = 'UPDATE usuarios SET foto_perfil = ? WHERE id = ?';
      
      db.query(sqlUpdate, [newPhotoUrl, decoded.id], (err, result) => {
        if (err) {
          console.error('Error al actualizar foto de perfil:', err);
          return res.status(500).json({ error: 'Error al actualizar foto de perfil' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ 
          message: 'Foto de perfil actualizada correctamente',
          foto_perfil: newPhotoUrl
        });
      });
    });
  } catch (error) {
    console.error('Error procesando la imagen:', error);
    res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

// Servidor corriendo
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});