require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET;
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

// Middleware
app.use(express.json());
app.use(cors());

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
      SELECT id, nombre, correo, especialidad, foto_perfil, curriculum, sobre_mi, creado_en, origen 
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

    const { nombre, especialidad, origen, sobre_mi } = req.body;
    const sql = `
      UPDATE usuarios 
      SET nombre = ?, especialidad = ?, origen = ?, sobre_mi = ?
      WHERE id = ?
    `;

    db.query(sql, [nombre, especialidad, origen, sobre_mi, decoded.id], (err, result) => {
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

// Servidor corriendo
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});