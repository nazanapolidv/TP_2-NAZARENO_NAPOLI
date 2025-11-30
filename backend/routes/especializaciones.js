const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// 1. OBTENER TODAS (GET /)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM especializaciones WHERE estado = "activo" ORDER BY nombre'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener especializaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 2. CREAR (POST /)
router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre || !descripcion) {
    return res.status(400).json({ error: 'Nombre y descripción son obligatorios.' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO especializaciones (nombre, descripcion, estado, created_at) VALUES (?, ?, "activo", NOW())',
      [nombre, descripcion]);
    res.status(201).json({
      id: result.insertId,
      nombre,
      descripcion,
      message: 'Especialización creada correctamente'
    });
  } catch (error) {
    console.error('Error al crear especialización:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear' });
  }
});

// 3. ACTUALIZAR (PUT /:id) 
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  if (!nombre || !descripcion) {
    return res.status(400).json({ error: 'Nombre y descripción son obligatorios.' });
  }
  try {
    const [result] = await pool.execute(
      'UPDATE especializaciones SET nombre = ?, descripcion = ? WHERE id = ?',
      [nombre, descripcion, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Especialización no encontrada' });
    }

    res.json({ message: 'Especialización actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar especialización:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar' });
  }
});

// 4. ELIMINAR/DESACTIVAR (DELETE /:id) 
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      'UPDATE especializaciones SET estado = "inactivo" WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Especialización no encontrada' });
    }

    res.json({ message: 'Especialización desactivada correctamente (estado: inactivo)' });
  } catch (error) {
    console.error('Error al desactivar especialización:', error);
    res.status(500).json({ error: 'Error interno del servidor al desactivar' });
  }
});

// 5. OBTENER MÉDICOS POR ESPECIALIZACIÓN (GET /:id/medicos)
router.get('/:id/medicos', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT m.*, u.nombre, u.apellido, e.nombre AS especializacion_nombre
       FROM medicos m
       JOIN usuarios u ON m.usuario_id = u.id
       JOIN especializaciones e ON m.\`especialización_id\` = e.id
       WHERE m.\`especialización_id\` = ? AND m.estado = "activo"
       ORDER BY u.nombre, u.apellido`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;