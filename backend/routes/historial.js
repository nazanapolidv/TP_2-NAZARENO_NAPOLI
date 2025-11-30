const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT h.*, u.nombre AS paciente_nombre, u.apellido AS paciente_apellido,
       mu.nombre AS medico_nombre, mu.apellido AS medico_apellido,
       e.nombre AS especialidad_nombre
       FROM historial_medico h
       JOIN medicos m ON h.medico_id = m.id
       JOIN usuarios mu ON m.usuario_id = mu.id
       JOIN usuarios u ON h.paciente_id = u.id
       JOIN especializaciones e ON m.\`especialización_id\` = e.id
       WHERE h.paciente_id = ?
       ORDER BY h.fecha DESC`,
      [req.user.id]
    );

    const historial = rows.map(row => ({
      id: row.id,
      fecha: row.fecha,
      especialidad: row.especialidad_nombre,
      medico: `${row.medico_nombre} ${row.medico_apellido}`,
      diagnostico: row.diagnostico,
      tratamiento: row.tratamiento,
      medicamentos: row.medicamentos,
      observaciones: row.observaciones
    }));

    res.json(historial);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;