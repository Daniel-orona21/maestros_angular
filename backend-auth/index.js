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

// Función helper para manejar errores
const handleError = (res, status, message, errorCode = 'ERROR_GENERAL') => {
  return res.status(status).json({
    error: message,
    errorCode: errorCode,
    shouldRedirect: true
  });
};

// Middleware para verificar el token JWT
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return handleError(res, 401, 'Token no proporcionado', 'ERROR_AUTH');
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return handleError(res, 401, 'Token inválido o expirado', 'ERROR_AUTH');
    }
    req.usuario = decoded;
    next();
  });
};

// Asegurar que el directorio de uploads existe
const uploadDir = path.join(__dirname, 'uploads/profile-pics');
const certificadosDir = path.join(__dirname, 'uploads/certificados');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(certificadosDir)) {
  fs.mkdirSync(certificadosDir, { recursive: true });
}

// Configuración de multer para subida de imágenes de perfil
const storage = multer.memoryStorage();

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

// Configuración de multer para subida de certificados
const certificadosStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, certificadosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'certificado-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadCertificado = multer({
  storage: certificadosStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max para certificados
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpg|jpeg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten archivos PDF, DOC, DOCX, JPG, JPEG y PNG'));
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

// 🟢 Obtener experiencias del usuario
app.get('/experiencias', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const sql = `
      SELECT * FROM experiencia 
      WHERE usuario_id = ?
      ORDER BY fecha_inicio_anio DESC, fecha_inicio_mes DESC`;

    db.query(sql, [decoded.id], (err, results) => {
      if (err) {
        console.error('Error al obtener experiencias:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
      }
      res.json(results);
    });
  });
});

// 🟢 Agregar nueva experiencia
app.post('/experiencias', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const { 
      puesto, empleador, ciudad, pais,
      fecha_inicio_mes, fecha_inicio_anio,
      fecha_fin_mes, fecha_fin_anio
    } = req.body;

    // Validar campos requeridos
    if (!puesto || !empleador || !ciudad || !pais || !fecha_inicio_mes || !fecha_inicio_anio) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const sql = `
      INSERT INTO experiencia (
        usuario_id, puesto, empleador, ciudad, pais,
        fecha_inicio_mes, fecha_inicio_anio,
        fecha_fin_mes, fecha_fin_anio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [
      decoded.id, puesto, empleador, ciudad, pais,
      fecha_inicio_mes, fecha_inicio_anio,
      fecha_fin_mes || null, fecha_fin_anio || null
    ], (err, result) => {
      if (err) {
        console.error('Error al agregar experiencia:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
      }
      res.json({ 
        message: 'Experiencia agregada correctamente',
        id: result.insertId 
      });
    });
  });
});

// 🔄 Actualizar experiencia
app.put('/experiencias/:id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const experienciaId = req.params.id;
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const { 
      puesto, empleador, ciudad, pais,
      fecha_inicio_mes, fecha_inicio_anio,
      fecha_fin_mes, fecha_fin_anio
    } = req.body;

    // Validar campos requeridos
    if (!puesto || !empleador || !ciudad || !pais || !fecha_inicio_mes || !fecha_inicio_anio) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Primero verificamos que la experiencia pertenezca al usuario
    const checkSql = 'SELECT usuario_id FROM experiencia WHERE id = ?';
    db.query(checkSql, [experienciaId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error en el servidor' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Experiencia no encontrada' });
      }

      if (results[0].usuario_id !== decoded.id) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      // Si todo está bien, actualizamos
      const updateSql = `
        UPDATE experiencia 
        SET puesto = ?, empleador = ?, ciudad = ?, pais = ?,
            fecha_inicio_mes = ?, fecha_inicio_anio = ?,
            fecha_fin_mes = ?, fecha_fin_anio = ?
        WHERE id = ? AND usuario_id = ?`;

      db.query(updateSql, [
        puesto, empleador, ciudad, pais,
        fecha_inicio_mes, fecha_inicio_anio,
        fecha_fin_mes || null, fecha_fin_anio || null,
        experienciaId, decoded.id
      ], (err, result) => {
        if (err) {
          console.error('Error al actualizar experiencia:', err);
          return res.status(500).json({ error: 'Error en el servidor' });
        }
        res.json({ message: 'Experiencia actualizada correctamente' });
      });
    });
  });
});

// 🗑️ Eliminar experiencia
app.delete('/experiencias/:id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const experienciaId = req.params.id;
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Primero verificamos que la experiencia pertenezca al usuario
    const checkSql = 'SELECT usuario_id FROM experiencia WHERE id = ?';
    db.query(checkSql, [experienciaId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error en el servidor' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Experiencia no encontrada' });
      }

      if (results[0].usuario_id !== decoded.id) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      // Si todo está bien, eliminamos
      const deleteSql = 'DELETE FROM experiencia WHERE id = ? AND usuario_id = ?';
      db.query(deleteSql, [experienciaId, decoded.id], (err, result) => {
        if (err) {
          console.error('Error al eliminar experiencia:', err);
          return res.status(500).json({ error: 'Error en el servidor' });
        }
        res.json({ message: 'Experiencia eliminada correctamente' });
      });
    });
  });
});

// Endpoints para educación
app.get('/educacion', verificarToken, (req, res) => {
    db.query(
        'SELECT * FROM educacion WHERE usuario_id = ? ORDER BY ano_inicio DESC, mes_inicio DESC',
        [req.usuario.id],
        (err, results) => {
            if (err) {
                console.error('Error al obtener educación:', err);
                return res.status(500).json({ mensaje: 'Error al obtener la educación' });
            }
            res.json(results);
        }
    );
});

app.post('/educacion', verificarToken, (req, res) => {
    const { institucion, titulo, especialidad, ciudad, mes_inicio, ano_inicio, mes_fin, ano_fin } = req.body;

    if (!institucion || !titulo || !especialidad || !ciudad || !mes_inicio || !ano_inicio) {
        return res.status(400).json({ mensaje: 'Todos los campos son requeridos excepto la fecha de fin' });
    }

    db.query(
        'INSERT INTO educacion (usuario_id, institucion, titulo, especialidad, ciudad, mes_inicio, ano_inicio, mes_fin, ano_fin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.usuario.id, institucion, titulo, especialidad, ciudad, mes_inicio, ano_inicio, mes_fin, ano_fin],
        (err, result) => {
            if (err) {
                console.error('Error al agregar educación:', err);
                return res.status(500).json({ mensaje: 'Error al agregar la educación' });
            }

            db.query(
                'SELECT * FROM educacion WHERE id = ?',
                [result.insertId],
                (err, results) => {
                    if (err) {
                        console.error('Error al obtener la educación insertada:', err);
                        return res.status(500).json({ mensaje: 'Error al obtener la educación insertada' });
                    }
                    res.status(201).json(results[0]);
                }
            );
        }
    );
});

app.put('/educacion/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    const { institucion, titulo, especialidad, ciudad, mes_inicio, ano_inicio, mes_fin, ano_fin } = req.body;

    if (!institucion || !titulo || !especialidad || !ciudad || !mes_inicio || !ano_inicio) {
        return res.status(400).json({ mensaje: 'Todos los campos son requeridos excepto la fecha de fin' });
    }

    // Verificar que la educación pertenece al usuario
    db.query(
        'SELECT * FROM educacion WHERE id = ? AND usuario_id = ?',
        [id, req.usuario.id],
        (err, results) => {
            if (err) {
                console.error('Error al verificar educación:', err);
                return res.status(500).json({ mensaje: 'Error al verificar la educación' });
            }

            if (results.length === 0) {
                return res.status(404).json({ mensaje: 'Educación no encontrada o no autorizada' });
            }

            db.query(
                'UPDATE educacion SET institucion = ?, titulo = ?, especialidad = ?, ciudad = ?, mes_inicio = ?, ano_inicio = ?, mes_fin = ?, ano_fin = ? WHERE id = ? AND usuario_id = ?',
                [institucion, titulo, especialidad, ciudad, mes_inicio, ano_inicio, mes_fin, ano_fin, id, req.usuario.id],
                (err) => {
                    if (err) {
                        console.error('Error al actualizar educación:', err);
                        return res.status(500).json({ mensaje: 'Error al actualizar la educación' });
                    }

                    db.query(
                        'SELECT * FROM educacion WHERE id = ?',
                        [id],
                        (err, results) => {
                            if (err) {
                                console.error('Error al obtener la educación actualizada:', err);
                                return res.status(500).json({ mensaje: 'Error al obtener la educación actualizada' });
                            }
                            res.json(results[0]);
                        }
                    );
                }
            );
        }
    );
});

app.delete('/educacion/:id', verificarToken, (req, res) => {
    const { id } = req.params;

    // Verificar que la educación pertenece al usuario
    db.query(
        'SELECT * FROM educacion WHERE id = ? AND usuario_id = ?',
        [id, req.usuario.id],
        (err, results) => {
            if (err) {
                console.error('Error al verificar educación:', err);
                return res.status(500).json({ mensaje: 'Error al verificar la educación' });
            }

            if (results.length === 0) {
                return res.status(404).json({ mensaje: 'Educación no encontrada o no autorizada' });
            }

            db.query(
                'DELETE FROM educacion WHERE id = ? AND usuario_id = ?',
                [id, req.usuario.id],
                (err) => {
                    if (err) {
                        console.error('Error al eliminar educación:', err);
                        return res.status(500).json({ mensaje: 'Error al eliminar la educación' });
                    }
                    res.json({ mensaje: 'Educación eliminada correctamente' });
                }
            );
        }
    );
});

// Endpoints para habilidades
app.get('/habilidades', verificarToken, (req, res) => {
    db.query(
        'SELECT * FROM habilidades WHERE usuario_id = ?',
        [req.usuario.id],
        (err, results) => {
            if (err) {
                console.error('Error al obtener habilidades:', err);
                return res.status(500).json({ mensaje: 'Error al obtener las habilidades' });
            }
            res.json(results);
        }
    );
});

app.post('/habilidades', verificarToken, (req, res) => {
    const { habilidades } = req.body;

    if (!habilidades || !Array.isArray(habilidades) || habilidades.length === 0) {
        return res.status(400).json({ mensaje: 'Debe proporcionar al menos una habilidad' });
    }

    // Usamos una transacción para asegurar que todas las habilidades se guarden
    db.beginTransaction(err => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.status(500).json({ mensaje: 'Error al guardar las habilidades' });
        }

        const insertPromises = habilidades.map(descripcion => {
            return new Promise((resolve, reject) => {
                db.query(
                    'INSERT INTO habilidades (usuario_id, descripcion) VALUES (?, ?)',
                    [req.usuario.id, descripcion],
                    (err, result) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(result);
                    }
                );
            });
        });

        Promise.all(insertPromises)
            .then(() => {
                db.commit(err => {
                    if (err) {
                        console.error('Error al hacer commit:', err);
                        return db.rollback(() => {
                            res.status(500).json({ mensaje: 'Error al guardar las habilidades' });
                        });
                    }
                    res.status(201).json({ mensaje: 'Habilidades guardadas correctamente' });
                });
            })
            .catch(err => {
                console.error('Error al insertar habilidades:', err);
                db.rollback(() => {
                    res.status(500).json({ mensaje: 'Error al guardar las habilidades' });
                });
            });
    });
});

app.put('/habilidades/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    const { descripcion } = req.body;

    if (!descripcion) {
        return res.status(400).json({ mensaje: 'La descripción es requerida' });
    }

    // Verificar que la habilidad pertenece al usuario
    db.query(
        'SELECT * FROM habilidades WHERE id = ? AND usuario_id = ?',
        [id, req.usuario.id],
        (err, results) => {
            if (err) {
                console.error('Error al verificar habilidad:', err);
                return res.status(500).json({ mensaje: 'Error al verificar la habilidad' });
            }

            if (results.length === 0) {
                return res.status(404).json({ mensaje: 'Habilidad no encontrada o no autorizada' });
            }

            db.query(
                'UPDATE habilidades SET descripcion = ? WHERE id = ? AND usuario_id = ?',
                [descripcion, id, req.usuario.id],
                (err) => {
                    if (err) {
                        console.error('Error al actualizar habilidad:', err);
                        return res.status(500).json({ mensaje: 'Error al actualizar la habilidad' });
                    }
                    res.json({ mensaje: 'Habilidad actualizada correctamente' });
                }
            );
        }
    );
});

app.delete('/habilidades/:id', verificarToken, (req, res) => {
    const { id } = req.params;

    // Verificar que la habilidad pertenece al usuario
    db.query(
        'SELECT * FROM habilidades WHERE id = ? AND usuario_id = ?',
        [id, req.usuario.id],
        (err, results) => {
            if (err) {
                console.error('Error al verificar habilidad:', err);
                return res.status(500).json({ mensaje: 'Error al verificar la habilidad' });
            }

            if (results.length === 0) {
                return res.status(404).json({ mensaje: 'Habilidad no encontrada o no autorizada' });
            }

            db.query(
                'DELETE FROM habilidades WHERE id = ? AND usuario_id = ?',
                [id, req.usuario.id],
                (err) => {
                    if (err) {
                        console.error('Error al eliminar habilidad:', err);
                        return res.status(500).json({ mensaje: 'Error al eliminar la habilidad' });
                    }
                    res.json({ mensaje: 'Habilidad eliminada correctamente' });
                }
            );
        }
    );
});

// Endpoints para certificados
app.get('/certificados', verificarToken, (req, res) => {
  db.query(
    'SELECT * FROM certificados WHERE usuario_id = ? ORDER BY fecha_obtencion DESC',
    [req.usuario.id],
    (err, results) => {
      if (err) {
        console.error('Error al obtener certificados:', err);
        return handleError(res, 500, 'Error al obtener los certificados', 'ERROR_DB');
      }
      res.json(results);
    }
  );
});

app.post('/certificados', verificarToken, uploadCertificado.single('archivo'), (req, res) => {
  const { nombre, institucion, fecha_obtencion } = req.body;
  const archivo = req.file ? `/certificados/${req.file.filename}` : null;

  if (!nombre || !institucion || !fecha_obtencion) {
    return handleError(res, 400, 'Faltan campos requeridos', 'ERROR_VALIDATION');
  }

  db.query(
    'INSERT INTO certificados (usuario_id, nombre, institucion, fecha_obtencion, archivo) VALUES (?, ?, ?, ?, ?)',
    [req.usuario.id, nombre, institucion, fecha_obtencion, archivo],
    (err, result) => {
      if (err) {
        console.error('Error al crear certificado:', err);
        return handleError(res, 500, 'Error al crear el certificado', 'ERROR_DB');
      }

      db.query(
        'SELECT * FROM certificados WHERE id = ?',
        [result.insertId],
        (err, results) => {
          if (err) {
            console.error('Error al obtener el certificado creado:', err);
            return handleError(res, 500, 'Error al obtener el certificado creado', 'ERROR_DB');
          }
          res.status(201).json(results[0]);
        }
      );
    }
  );
});

app.put('/certificados/:id', verificarToken, uploadCertificado.single('archivo'), (req, res) => {
  const { id } = req.params;
  const { nombre, institucion, fecha_obtencion } = req.body;
  const archivo = req.file ? `/certificados/${req.file.filename}` : undefined;

  db.query(
    'SELECT * FROM certificados WHERE id = ? AND usuario_id = ?',
    [id, req.usuario.id],
    (err, certificado) => {
      if (err) {
        console.error('Error al verificar certificado:', err);
        return handleError(res, 500, 'Error al verificar el certificado', 'ERROR_DB');
      }

      if (certificado.length === 0) {
        return handleError(res, 404, 'Certificado no encontrado', 'ERROR_NOT_FOUND');
      }

      let query = 'UPDATE certificados SET nombre = ?, institucion = ?, fecha_obtencion = ?';
      let params = [nombre, institucion, fecha_obtencion];

      if (archivo) {
        query += ', archivo = ?';
        params.push(archivo);

        if (certificado[0].archivo) {
          const rutaArchivo = path.join(__dirname, 'uploads', certificado[0].archivo);
          fs.unlink(rutaArchivo, (err) => {
            if (err) console.error('Error al eliminar archivo anterior:', err);
          });
        }
      }

      query += ' WHERE id = ? AND usuario_id = ?';
      params.push(id, req.usuario.id);

      db.query(query, params, (err) => {
        if (err) {
          console.error('Error al actualizar certificado:', err);
          return handleError(res, 500, 'Error al actualizar el certificado', 'ERROR_DB');
        }

        db.query(
          'SELECT * FROM certificados WHERE id = ?',
          [id],
          (err, results) => {
            if (err) {
              console.error('Error al obtener el certificado actualizado:', err);
              return handleError(res, 500, 'Error al obtener el certificado actualizado', 'ERROR_DB');
            }
            res.json(results[0]);
          }
        );
      });
    }
  );
});

app.delete('/certificados/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  db.query(
    'SELECT * FROM certificados WHERE id = ? AND usuario_id = ?',
    [id, req.usuario.id],
    (err, certificado) => {
      if (err) {
        console.error('Error al verificar certificado:', err);
        return handleError(res, 500, 'Error al verificar el certificado', 'ERROR_DB');
      }

      if (certificado.length === 0) {
        return handleError(res, 404, 'Certificado no encontrado', 'ERROR_NOT_FOUND');
      }

      if (certificado[0].archivo) {
        const rutaArchivo = path.join(__dirname, 'uploads', certificado[0].archivo);
        fs.unlink(rutaArchivo, (err) => {
          if (err) console.error('Error al eliminar archivo:', err);
        });
      }

      db.query(
        'DELETE FROM certificados WHERE id = ? AND usuario_id = ?',
        [id, req.usuario.id],
        (err) => {
          if (err) {
            console.error('Error al eliminar certificado:', err);
            return handleError(res, 500, 'Error al eliminar el certificado', 'ERROR_DB');
          }
          res.json({ message: 'Certificado eliminado correctamente' });
        }
      );
    }
  );
});

// Endpoints para Logros
app.get('/logros', verificarToken, (req, res) => {
  db.query(
    'SELECT * FROM logros WHERE usuario_id = ? ORDER BY fecha DESC',
    [req.usuario.id],
    (err, results) => {
      if (err) {
        console.error('Error al obtener logros:', err);
        return handleError(res, 500, 'Error al obtener los logros', 'ERROR_DB');
      }
      res.json(results);
    }
  );
});

app.post('/logros', verificarToken, uploadCertificado.single('archivo'), (req, res) => {
  const { titulo, descripcion, fecha } = req.body;
  const archivo = req.file ? `/certificados/${req.file.filename}` : null;

  if (!titulo || !fecha) {
    return handleError(res, 400, 'Título y fecha son requeridos', 'ERROR_VALIDACION');
  }

  db.query(
    'INSERT INTO logros (usuario_id, titulo, descripcion, fecha, archivo) VALUES (?, ?, ?, ?, ?)',
    [req.usuario.id, titulo, descripcion || null, fecha, archivo],
    (err, result) => {
      if (err) {
        console.error('Error al crear logro:', err);
        return handleError(res, 500, 'Error al crear el logro', 'ERROR_DB');
      }

      db.query(
        'SELECT * FROM logros WHERE id = ?',
        [result.insertId],
        (err, logros) => {
          if (err) {
            console.error('Error al obtener el logro creado:', err);
            return handleError(res, 500, 'Error al obtener el logro creado', 'ERROR_DB');
          }
          res.status(201).json(logros[0]);
        }
      );
    }
  );
});

app.put('/logros/:id', verificarToken, uploadCertificado.single('archivo'), (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, fecha } = req.body;
  const archivo = req.file ? `/certificados/${req.file.filename}` : undefined;

  if (!titulo || !fecha) {
    return handleError(res, 400, 'Título y fecha son requeridos', 'ERROR_VALIDACION');
  }

  db.query(
    'SELECT * FROM logros WHERE id = ? AND usuario_id = ?',
    [id, req.usuario.id],
    (err, logros) => {
      if (err) {
        console.error('Error al verificar logro:', err);
        return handleError(res, 500, 'Error al verificar el logro', 'ERROR_DB');
      }

      if (logros.length === 0) {
        return handleError(res, 404, 'Logro no encontrado', 'ERROR_NOT_FOUND');
      }

      const archivoAnterior = logros[0].archivo;

      let updateQuery = 'UPDATE logros SET titulo = ?, descripcion = ?, fecha = ?';
      let updateParams = [titulo, descripcion || null, fecha];

      if (archivo) {
        updateQuery += ', archivo = ?';
        updateParams.push(archivo);
        
        // Eliminar archivo anterior si existe
        if (archivoAnterior) {
          const rutaArchivo = path.join(__dirname, 'uploads', archivoAnterior.replace(/^\/uploads\//, ''));
          fs.unlink(rutaArchivo, (err) => {
            if (err) console.error('Error al eliminar archivo anterior:', err);
          });
        }
      }

      updateQuery += ' WHERE id = ? AND usuario_id = ?';
      updateParams.push(id, req.usuario.id);

      db.query(updateQuery, updateParams, (err) => {
        if (err) {
          console.error('Error al actualizar logro:', err);
          return handleError(res, 500, 'Error al actualizar el logro', 'ERROR_DB');
        }

        db.query(
          'SELECT * FROM logros WHERE id = ?',
          [id],
          (err, logros) => {
            if (err) {
              console.error('Error al obtener el logro actualizado:', err);
              return handleError(res, 500, 'Error al obtener el logro actualizado', 'ERROR_DB');
            }
            res.json(logros[0]);
          }
        );
      });
    }
  );
});

app.delete('/logros/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  db.query(
    'SELECT * FROM logros WHERE id = ? AND usuario_id = ?',
    [id, req.usuario.id],
    (err, logros) => {
      if (err) {
        console.error('Error al verificar logro:', err);
        return handleError(res, 500, 'Error al verificar el logro', 'ERROR_DB');
      }

      if (logros.length === 0) {
        return handleError(res, 404, 'Logro no encontrado', 'ERROR_NOT_FOUND');
      }

      // Eliminar archivo si existe
      if (logros[0].archivo) {
        const rutaArchivo = path.join(__dirname, 'uploads', logros[0].archivo);
        fs.unlink(rutaArchivo, (err) => {
          if (err) console.error('Error al eliminar archivo:', err);
        });
      }

      db.query(
        'DELETE FROM logros WHERE id = ? AND usuario_id = ?',
        [id, req.usuario.id],
        (err) => {
          if (err) {
            console.error('Error al eliminar logro:', err);
            return handleError(res, 500, 'Error al eliminar el logro', 'ERROR_DB');
          }
          res.json({ message: 'Logro eliminado correctamente' });
        }
      );
    }
  );
});

// Servidor corriendo
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});