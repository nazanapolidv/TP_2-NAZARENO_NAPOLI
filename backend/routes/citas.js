const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, mu.nombre AS medico_nombre, mu.apellido AS medico_apellido,
       e.nombre AS especializacion_nombre
       FROM citas c
       JOIN medicos m ON c.medico_id = m.id
       JOIN usuarios mu ON m.usuario_id = mu.id
       JOIN especializaciones e ON m.\`especialización_id\` = e.id
       WHERE c.paciente_id = ?
       ORDER BY c.fecha DESC, c.hora DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, [
  body('medico_id').isInt().withMessage('ID de médico inválido'),
  body('especializacion_id').isInt().withMessage('ID de especialización inválido'),
  body('fecha').isISO8601().withMessage('Fecha inválida'),
  body('hora').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { medico_id, fecha, hora, motivo } = req.body;

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM citas WHERE medico_id = ? AND fecha = ? AND hora = ? AND estado != "cancelada"',
      [medico_id, fecha, hora]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'El horario no está disponible' });
    }

    const [result] = await pool.execute(
      `INSERT INTO citas (paciente_id, medico_id, fecha, hora, motivo) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, medico_id,  fecha, hora, motivo]
    );

    res.status(201).json({
      message: 'Cita creada exitosamente',
      cita_id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id/cancel', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      'UPDATE citas SET estado = "cancelada" WHERE id = ? AND paciente_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.json({ message: 'Cita cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido,
       m.nombre as medico_nombre, m.apellido as medico_apellido,
       e.nombre as especializacion_nombre
       FROM citas c
       JOIN usuarios u ON c.paciente_id = u.id
       JOIN medicos m ON c.medico_id = m.id
       JOIN especializaciones e ON c.especializacion_id = e.id
       ORDER BY c.fecha DESC, c.hora DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener todas las citas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;