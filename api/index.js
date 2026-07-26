import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'arkhet_architecture_os_secret_jwt_key_2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Sebaxx:Dpastora2@inkdb.prnwk92.mongodb.net/arkhet_db?retryWrites=true&w=majority&appName=InkDB';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mongoose Connection Cache for Serverless Functions
let isConnected = false;
async function connectToDatabase() {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('⚡ Conectado a MongoDB Atlas en Vercel Serverless');
  } catch (err) {
    console.error('Error al conectar a MongoDB Atlas:', err);
  }
}

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  avatarUrl: String,
  gitLinkedAccount: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Project Schema
const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  category: { type: String, default: 'Web App' },
  healthStatus: { type: String, default: 'development' },
  complexityScore: { type: Number, default: 75 },
  primaryStack: [String],
  clusters: [mongoose.Schema.Types.Mixed],
  nodes: [mongoose.Schema.Types.Mixed],
  edges: [mongoose.Schema.Types.Mixed],
  folderStructure: [mongoose.Schema.Types.Mixed],
  snapshots: [mongoose.Schema.Types.Mixed],
  risks: [mongoose.Schema.Types.Mixed],
  gitInfo: mongoose.Schema.Types.Mixed,
  repository: String,
  branch: String,
  pendingTasks: [String],
  updatedAt: { type: Date, default: Date.now }
});

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

// Auth Token Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  await connectToDatabase();
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: 'El usuario o correo ya existe' });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      passwordHash,
      avatarUrl: `https://github.com/${username}.png`
    });

    const token = jwt.sign({ id: newUser._id, username: newUser.username, email: newUser.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: { id: newUser._id, username: newUser.username, email: newUser.email, avatarUrl: newUser.avatarUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  await connectToDatabase();
  try {
    const { usernameOrEmail, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
    });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: { id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects
app.get('/api/projects', authenticateToken, async (req, res) => {
  await connectToDatabase();
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
app.post('/api/projects', authenticateToken, async (req, res) => {
  await connectToDatabase();
  try {
    const projectData = req.body;
    const existing = await Project.findOne({ userId: req.user.id, name: projectData.name });

    if (existing) {
      Object.assign(existing, projectData, { updatedAt: new Date() });
      await existing.save();
      return res.json(existing);
    }

    const newProject = await Project.create({
      ...projectData,
      userId: req.user.id,
      updatedAt: new Date()
    });

    res.json(newProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/clean-db - Clean database accounts
app.post('/api/admin/clean-db', async (req, res) => {
  await connectToDatabase();
  try {
    const deletedUsers = await User.deleteMany({});
    const deletedProjects = await Project.deleteMany({});
    res.json({
      success: true,
      message: `Base de datos limpiada. ${deletedUsers.deletedCount} usuarios y ${deletedProjects.deletedCount} proyectos eliminados.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
