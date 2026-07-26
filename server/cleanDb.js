import mongoose from 'mongoose';
import User from './models/User.js';
import Project from './models/Project.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Sebaxx:Dpastora2@inkdb.prnwk92.mongodb.net/arkhet_db?retryWrites=true&w=majority&appName=InkDB';

async function cleanDatabase() {
  try {
    console.log('⚡ Conectando a MongoDB Atlas para limpiar colecciones de cuentas...');
    await mongoose.connect(MONGODB_URI);

    const deletedUsers = await User.deleteMany({});
    const deletedProjects = await Project.deleteMany({});

    console.log(`✅ Colección 'User' limpiada. ${deletedUsers.deletedCount} usuarios eliminados.`);
    console.log(`✅ Colección 'Project' limpiada. ${deletedProjects.deletedCount} proyectos eliminados.`);

    await mongoose.disconnect();
    console.log('✨ Base de datos MongoDB Atlas reseteada con éxito.');
  } catch (err) {
    console.error('❌ Error al limpiar MongoDB Atlas:', err);
  }
}

cleanDatabase();
