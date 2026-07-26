import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from './models/User.js';
import Project from './models/Project.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'arkhet_secret_key_2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arkhet';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB Atlas Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('⚡ Conectado exitosamente a MongoDB Atlas'))
  .catch(err => console.warn('⚠️ MongoDB Atlas no conectado aún. Pega tu MONGODB_URI en server/.env:', err.message));

// Middleware Auth Token Verification
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token de autenticación requerido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
}

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario o email ya se encuentra registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      passwordHash,
      avatarUrl: `https://github.com/${username}.png`
    });

    const token = jwt.sign({ id: newUser._id, username: newUser.username, email: newUser.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl,
        gitLinkedAccount: newUser.gitLinkedAccount
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
    });

    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        gitLinkedAccount: user.gitLinkedAccount
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/link-git
app.post('/api/auth/link-git', authenticateToken, async (req, res) => {
  try {
    const { gitUsername, gitToken } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    user.gitLinkedAccount = {
      username: gitUsername,
      accessToken: gitToken,
      isLinked: true
    };

    await user.save();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        gitLinkedAccount: user.gitLinkedAccount
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// PROJECT CLOUD SYNC ROUTES
// ----------------------------------------------------

// GET /api/projects - Fetch User Projects from MongoDB Atlas
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects - Save or Sync Project to MongoDB Atlas
app.post('/api/projects', authenticateToken, async (req, res) => {
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

// DELETE /api/projects/:id
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    await Project.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend de Arkhet corriendo en http://localhost:${PORT}`);
});
