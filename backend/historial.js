const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();

async function cargarHistorial() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'plataformas_desarrollo',
            port: process.env.DB_PORT || 3306
        });

        const [pacientes] = await connection.query("SELECT id FROM usuarios WHERE email = 'paciente@hospital.com'");
        const juanId = pacientes[0].id;

        const [medicosPasados] = await connection.query(`
            SELECT m.id 
            FROM medicos m 
            JOIN usuarios u ON m.usuario_id = u.id 
            WHERE u.email = 'carlos.mendoza@hospital.com'
        `);

        const drCarlosId = medicosPasados[0].id;


        // crea cita historica
        const [citaPasadaResult] = await connection.query(`
            INSERT INTO citas (paciente_id, medico_id, fecha, hora, motivo, estado, observaciones)
            VALUES (?, ?, DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '10:00:00', 'Chequeo anual del corazón', 'completada', 'Paciente asistió puntual.')
        `, [juanId, drCarlosId]);

        const citaPasadaId = citaPasadaResult.insertId;

        await connection.query(`
            INSERT INTO historial_medico (paciente_id, medico_id, cita_id, fecha, diagnostico, tratamiento, medicamentos, observaciones)
            VALUES (?, ?, ?, DATE_SUB(CURDATE(), INTERVAL 1 MONTH), ?, ?, ?, ?)
        `, [
            juanId, 
            drCarlosId, 
            citaPasadaId,
            'Hipertensión leve controlada.',
            'Dieta baja en sodio y ejercicio moderado.',
            'Enalapril 5mg si la presión sube de 14/9.',
            'Volver a control en 6 meses.'
        ]);


        // proxima cita
        const [medicosFuturos] = await connection.query(`
            SELECT m.id 
            FROM medicos m 
            JOIN usuarios u ON m.usuario_id = u.id 
            WHERE u.email = 'ana.garcia@hospital.com'
        `);

        if (medicosFuturos.length === 0) {
            console.warn("No se encontró a la Dra. Ana García, saltando creación de cita futura.");
        } else {
            const draAnaId = medicosFuturos[0].id;

            await connection.query(`
                INSERT INTO citas (paciente_id, medico_id, fecha, hora, motivo, estado)
                VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '15:30:00', 'Consulta por mancha en la piel', 'confirmada')
            `, [juanId, draAnaId]);
        }

        console.log("citas creadas");

    } catch (error) {
        console.error('Error al cargar historial:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

cargarHistorial();