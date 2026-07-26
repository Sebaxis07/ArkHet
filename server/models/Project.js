import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  category: {
    type: String,
    default: 'Web App'
  },
  healthStatus: {
    type: String,
    default: 'development'
  },
  complexityScore: {
    type: Number,
    default: 75
  },
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
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Project', ProjectSchema);
