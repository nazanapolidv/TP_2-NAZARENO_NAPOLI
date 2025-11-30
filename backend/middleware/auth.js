const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');

    const [rows] = await pool.execute(
      'SELECT id, nombre, apellido, email, rol FROM usuarios WHERE id = ? AND estado = "activo"',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario asociado al token no encontrado o inactivo' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };