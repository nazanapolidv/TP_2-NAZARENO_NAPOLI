const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, e.nombre as especializacion_nombre, u.nombre, u.apellido
       FROM medicos m 
       JOIN especializaciones e ON m.especialización_id = e.id 
       JOIN usuarios u ON m.usuario_id = u.id
       WHERE m.estado = 'activo' 
       ORDER BY e.nombre, u.nombre, u.apellido`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, e.nombre as especializacion_nombre, u.nombre, u.apellido
       FROM medicos m 
       JOIN especializaciones e ON m.especialización_id = e.id 
       JOIN usuarios u ON m.usuario_id = u.id
       WHERE m.id = ? AND m.estado = 'activo'`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener médico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;