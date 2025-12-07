const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET - obtencion de usuarios
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, nombre, apellido, email, telefono, dni, rol, estado, created_at 
       FROM usuarios ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - actualizacion de usuarios
router.put('/:id', authenticateToken, requireAdmin, [
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('estado').optional().isIn(['activo', 'inactivo']).withMessage('Estado inválido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { email, estado } = req.body;

  try {
    // verificar existencia del usuario
    const [existing] = await pool.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (email) {
      const [emailCheck] = await pool.execute(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?',
        [email, id]
      );
      if (emailCheck.length > 0) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }

    const [result] = await pool.execute(
      `UPDATE usuarios SET 
       email = COALESCE(?, email),
       estado = COALESCE(?, estado),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [email || null, estado || null, id]
    );

    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - crear admin o medico
router.post('/admin', authenticateToken, requireAdmin, [
  body('nombre').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  body('apellido').trim().isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('dni').trim().isLength({ min: 7 }).withMessage('DNI inválido'),
  body('rol').isIn(['admin', 'medico']).withMessage('Rol debe ser admin o medico'),
  body('telefono').optional().trim(),
  // campos medico
  body('especializacion_id').optional().isInt().withMessage('Especialización inválida'),
  body('matricula').optional().trim(),
  body('horario_inicio').optional(),
  body('horario_fin').optional(),
  body('dias_atencion').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Errores de validación:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    nombre, apellido, email, password, dni, rol, telefono,
    especializacion_id, matricula, horario_inicio, horario_fin, dias_atencion
  } = req.body;

  console.log('Datos recibidos para crear usuario:', { 
    nombre, apellido, email, dni, rol, 
    especializacion_id, matricula, horario_inicio, horario_fin 
  });

  try {
    const [existingUser] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ? OR dni = ?',
      [email, dni]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe (email o DNI duplicado)' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const [userResult] = await pool.execute(
      `INSERT INTO usuarios (nombre, apellido, email, password, telefono, dni, rol, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [nombre, apellido, email, hashedPassword, telefono || null, dni, rol]
    );

    const userId = userResult.insertId;

    // al ser medico crea el registro en su tabla
    if (rol === 'medico') {
      if (!especializacion_id || !matricula) {
        await pool.execute('DELETE FROM usuarios WHERE id = ?', [userId]);
        return res.status(400).json({ error: 'Para crear un médico se requiere especialización y matrícula' });
      }

      // verificacion de matricula medico
      const [matriculaCheck] = await pool.execute(
        'SELECT id FROM medicos WHERE matricula = ?',
        [matricula]
      );
      if (matriculaCheck.length > 0) {
        await pool.execute('DELETE FROM usuarios WHERE id = ?', [userId]);
        return res.status(400).json({ error: 'La matrícula ya está registrada' });
      }

      await pool.execute(
        `INSERT INTO medicos (usuario_id, \`especialización_id\`, matricula, horario_inicio, horario_fin, dias_atencion, estado) 
         VALUES (?, ?, ?, ?, ?, ?, 'activo')`,
        [userId, especializacion_id, matricula, horario_inicio || '09:00', horario_fin || '17:00', dias_atencion || '["Lunes","Martes","Miércoles","Jueves","Viernes"]']
      );
    }

    res.status(201).json({
      message: `Usuario ${rol} creado exitosamente`,
      user: { id: userId, nombre, apellido, email, rol }
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, nombre, apellido, email, telefono, direccion, fecha_nacimiento, 
       dni, obra_social, numero_afiliado, rol, created_at 
       FROM usuarios WHERE id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/profile', authenticateToken, [
  body('nombre').optional().trim().isLength({ min: 2 }),
  body('apellido').optional().trim().isLength({ min: 2 }),
  body('telefono').optional().trim(),
  body('direccion').optional().trim(),
  body('obra_social').optional().trim(),
  body('numero_afiliado').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre, apellido, telefono, direccion, obra_social, numero_afiliado } = req.body;

  try {
    const [result] = await pool.execute(
      `UPDATE usuarios SET 
       nombre = COALESCE(?, nombre),
       apellido = COALESCE(?, apellido),
       telefono = COALESCE(?, telefono),
       direccion = COALESCE(?, direccion),
       obra_social = COALESCE(?, obra_social),
       numero_afiliado = COALESCE(?, numero_afiliado),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nombre, apellido, telefono, direccion, obra_social, numero_afiliado, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;