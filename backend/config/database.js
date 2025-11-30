const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'plataformas_desarrollo',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Error conectando a MySQL:', error);
    return false;
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;