const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function insertMedicosYEspecialidades() {
    try {
        const especialidades = [
            { nombre: 'Cardiología', descripcion: 'Especialidad médica que se ocupa del diagnóstico y tratamiento de las enfermedades del corazón' },
            { nombre: 'Dermatología', descripcion: 'Especialidad médica que se ocupa del diagnóstico y tratamiento de las enfermedades de la piel' },
            { nombre: 'Neurología', descripcion: 'Especialidad médica que se ocupa del diagnóstico y tratamiento de las enfermedades del sistema nervioso' },
            { nombre: 'Pediatría', descripcion: 'Especialidad médica que se ocupa del cuidado de la salud de bebés, niños y adolescentes' },
            { nombre: 'Traumatología', descripcion: 'Especialidad médica que se ocupa del diagnóstico y tratamiento de lesiones del sistema musculoesquelético' }
        ];

        const especialidadIds = [];
        for (const especialidad of especialidades) {
            try {
                const [result] = await pool.execute(
                    'INSERT INTO especializaciones (nombre, descripcion) VALUES (?, ?)',
                    [especialidad.nombre, especialidad.descripcion]
                );
                especialidadIds.push(result.insertId);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    const [existing] = await pool.execute(
                        'SELECT id FROM especializaciones WHERE nombre = ?',
                        [especialidad.nombre]
                    );
                    especialidadIds.push(existing[0].id);
                } else {
                    throw error;
                }
            }
        }

        const medicos = [
            {
                nombre: 'Dr. Carlos',
                apellido: 'Mendoza',
                email: 'carlos.mendoza@hospital.com',
                password: 'medico123',
                telefono: '11-2345-6789',
                dni: '12345678',
                especialidad_id: especialidadIds[0],
                matricula: 'MP-12345',
                horario_inicio: '09:00',
                horario_fin: '13:00',
                dias_atencion: JSON.stringify(['Lunes', 'Martes', 'Miércoles'])
            },
            {
                nombre: 'Dra. Ana',
                apellido: 'García',
                email: 'ana.garcia@hospital.com',
                password: 'medico123',
                telefono: '11-3456-7890',
                dni: '23456789',
                especialidad_id: especialidadIds[1],
                matricula: 'MP-23456',
                horario_inicio: '14:00',
                horario_fin: '18:00',
                dias_atencion: JSON.stringify(['Martes', 'Miércoles', 'Jueves'])
            },
            {
                nombre: 'Dr. Roberto',
                apellido: 'Silva',
                email: 'roberto.silva@hospital.com',
                password: 'medico123',
                telefono: '11-4567-8901',
                dni: '34567890',
                especialidad_id: especialidadIds[2],
                matricula: 'MP-34567',
                horario_inicio: '10:00',
                horario_fin: '16:00',
                dias_atencion: JSON.stringify(['Lunes', 'Jueves', 'Viernes'])
            },
            {
                nombre: 'Dra. María',
                apellido: 'López',
                email: 'maria.lopez@hospital.com',
                password: 'medico123',
                telefono: '11-5678-9012',
                dni: '45678901',
                especialidad_id: especialidadIds[3],
                matricula: 'MP-45678',
                horario_inicio: '08:00',
                horario_fin: '14:00',
                dias_atencion: JSON.stringify(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'])
            },
            {
                nombre: 'Dr. Luis',
                apellido: 'Fernández',
                email: 'luis.fernandez@hospital.com',
                password: 'medico123',
                telefono: '11-6789-0123',
                dni: '56789012',
                especialidad_id: especialidadIds[4],
                matricula: 'MP-56789',
                horario_inicio: '13:00',
                horario_fin: '17:00',
                dias_atencion: JSON.stringify(['Miércoles', 'Jueves', 'Viernes'])
            }
        ];

        for (const medico of medicos) {
            try {
                const hashedPassword = await bcrypt.hash(medico.password, 10);
                const [userResult] = await pool.execute(
                    `INSERT INTO usuarios (nombre, apellido, email, password, telefono, dni, rol, estado) 
                     VALUES (?, ?, ?, ?, ?, ?, 'medico', 'activo')`,
                    [medico.nombre, medico.apellido, medico.email, hashedPassword, medico.telefono, medico.dni]
                );

                await pool.execute(
                    `INSERT INTO medicos (usuario_id, especialización_id, matricula, horario_inicio, horario_fin, dias_atencion) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [userResult.insertId, medico.especialidad_id, medico.matricula, medico.horario_inicio, medico.horario_fin, medico.dias_atencion]
                );

            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                } else {
                    throw error;
                }
            }
        }

    } catch (error) {
        console.error('Error al insertar médicos:', error);
    } finally {
        process.exit(0);
    }
}

insertMedicosYEspecialidades();
