const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();

async function resetDatabase() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306,
            charset: 'utf8mb4'
        });
        // creacion bdd
        await connection.query('DROP DATABASE IF EXISTS plataformas_desarrollo');
        await connection.query('CREATE DATABASE plataformas_desarrollo');
        await connection.query('USE plataformas_desarrollo');
        // cracion tablas
        await connection.query(`
            CREATE TABLE usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                apellido VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                telefono VARCHAR(20),
                direccion TEXT,
                fecha_nacimiento DATE,
                dni VARCHAR(20) UNIQUE NOT NULL,
                obra_social VARCHAR(100),
                numero_afiliado VARCHAR(50),
                rol ENUM('paciente', 'medico', 'admin') DEFAULT 'paciente',
                estado ENUM('activo', 'inactivo') DEFAULT 'activo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE especializaciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                imagen VARCHAR(255),
                estado ENUM('activo', 'inactivo') DEFAULT 'activo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE medicos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                especialización_id INT NOT NULL,
                matricula VARCHAR(50) UNIQUE NOT NULL,
                horario_inicio TIME,
                horario_fin TIME,
                dias_atencion JSON,
                estado ENUM('activo', 'inactivo') DEFAULT 'activo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (especialización_id) REFERENCES especializaciones(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE citas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                paciente_id INT NOT NULL,
                medico_id INT NOT NULL,
                fecha DATE NOT NULL,
                hora TIME NOT NULL,
                motivo TEXT,
                estado ENUM('pendiente', 'confirmada', 'cancelada', 'completada') DEFAULT 'pendiente',
                observaciones TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE historial_medico (
                id INT AUTO_INCREMENT PRIMARY KEY,
                paciente_id INT NOT NULL,
                medico_id INT NOT NULL,
                cita_id INT,
                fecha DATE NOT NULL,
                diagnostico TEXT,
                tratamiento TEXT,
                medicamentos TEXT,
                observaciones TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,
                FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL
            )
        `);

        await connection.query(`
            INSERT INTO especializaciones (nombre, descripcion, imagen) VALUES
            ('Cardiología', 'Especialidad médica que se encarga del estudio, diagnóstico y tratamiento de las enfermedades del corazón y del aparato circulatorio', 'cardiologia.png'),
            ('Neurología', 'Especialidad médica que trata los trastornos del sistema nervioso', 'neurologia.png'),
            ('Dermatología', 'Especialidad médica que se encarga del estudio de la estructura y función de la piel', 'dermatologia.png'),
            ('Pediatría', 'Especialidad médica que estudia al niño y sus enfermedades', 'pediatria.png'),
            ('Ginecología', 'Especialidad médica que trata las enfermedades del sistema reproductor femenino', 'ginecologia.png'),
            ('Traumatología', 'Especialidad médica que se dedica al estudio de las lesiones del aparato locomotor', 'traumatologia.png')
        `);
        // creacion users
        await connection.query(`
            INSERT INTO usuarios 
            (nombre, apellido, email, password, dni, rol, telefono, direccion, fecha_nacimiento, obra_social, numero_afiliado) 
            VALUES
            ('Admin', 'Sistema', 'admin@hospital.com', '$2a$10$.5Elh8fgxypNUWhpUUr/xOa2sZm0VIaE0qWuGGl9otUfobb46T1Pq', '10000001', 'admin', '1112345678', 'Oficina Central', '1980-01-01', NULL, NULL),
            ('Juan', 'Paciente', 'paciente@hospital.com', '$2a$10$.5Elh8fgxypNUWhpUUr/xOa2sZm0VIaE0qWuGGl9otUfobb46T1Pq', '20000002', 'paciente', '1187654321', 'Calle Falsa 123', '1995-06-15', 'OSDE', '3104567890')
        `);

        await connection.query('CREATE INDEX idx_usuarios_email ON usuarios(email)');
        await connection.query('CREATE INDEX idx_usuarios_dni ON usuarios(dni)');
        await connection.query('CREATE INDEX idx_citas_fecha ON citas(fecha)');
        await connection.query('CREATE INDEX idx_citas_paciente ON citas(paciente_id)');
        await connection.query('CREATE INDEX idx_citas_medico ON citas(medico_id)');
        await connection.query('CREATE INDEX idx_historial_paciente ON historial_medico(paciente_id)');
        await connection.query('CREATE INDEX idx_historial_fecha ON historial_medico(fecha)');

        console.log('Base de datos creada');

    } catch (error) {
        console.error('Error:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

resetDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));