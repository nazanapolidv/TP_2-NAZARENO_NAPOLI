const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306,
            charset: 'utf8mb4',
            multipleStatements: true
        });

        const sqlFilePath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        await connection.query(sql);

    } catch (error) {
        console.error('Error inicializando la base de datos:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function testConnection() {
    const pool = require('../config/database');

    try {
        const [rows] = await pool.execute('SELECT 1 as test');
        return true;
    } catch (error) {
        console.error('Error conectando a la base de datos:', error);
        return false;
    }
}

module.exports = {
    initializeDatabase,
    testConnection
};
