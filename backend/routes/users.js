const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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