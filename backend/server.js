const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const citasRoutes = require('./routes/citas');
const medicosRoutes = require('./routes/medicos');
const especializacionesRoutes = require('./routes/especializaciones');
const historialRoutes = require('./routes/historial');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/especializaciones', especializacionesRoutes);
app.use('/api/historial', historialRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

async function startServer() {
  try {
    console.log('Iniciando servidor...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    console.log('Conexión a la base de datos exitosa');

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log('Base de datos conectada correctamente');
    });

  } catch (error) {
    console.error('Error iniciando el servidor:', error);
    process.exit(1);
  }
}

startServer();