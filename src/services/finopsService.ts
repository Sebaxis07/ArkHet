import type { Project } from '../types/architecture';

export interface NodeCostItem {
  nodeId: string;
  nodeLabel: string;
  category: string;
  provider: string;
  estimatedMonthlyCost: number;
  costBreakdown: string;
}

export interface FinOpsAnalysis {
  totalMonthlyCost: number;
  projectedCostHighTraffic: number;
  nodeCosts: NodeCostItem[];
  savingsRecommendations: Array<{
    title: string;
    description: string;
    potentialSavingsMonthly: number;
  }>;
}

export function calculateProjectFinOps(project: Project, trafficMultiplier = 1): FinOpsAnalysis {
  const nodes = project.nodes || [];
  const nodeCosts: NodeCostItem[] = [];

  let totalMonthlyCost = 0;

  for (const node of nodes) {
    let baseCost = 0;
    let breakdown = '';
    const category = node.category.toLowerCase();
    const provider = (node.cloudProvider || node.hosting || 'Cloud').toLowerCase();

    if (category === 'frontend') {
      baseCost = provider.includes('vercel') ? 20 : 15;
      breakdown = 'Vercel Pro Tier & Bandwidth Edge';
    } else if (category === 'backend' || category === 'auth') {
      baseCost = provider.includes('ec2') || provider.includes('aws') ? 35 : 25;
      breakdown = 'Node.js API Container (2 vCPU / 4GB RAM)';
    } else if (category === 'database') {
      baseCost = provider.includes('atlas') ? 57 : 40;
      breakdown = 'MongoDB Atlas Dedicated M10 Cluster';
    } else if (category === 'microservice') {
      baseCost = 45;
      breakdown = 'FastAPI LLM Inference & Token Quotas';
    } else if (category === 'queue') {
      baseCost = 15;
      breakdown = 'Redis Enterprise Cloud Queue Tier';
    } else if (category === 'storage') {
      baseCost = 12;
      breakdown = 'AWS S3 Standard Storage (50GB)';
    } else {
      baseCost = 10;
      breakdown = 'Standard Cloud Service Instance';
    }

    const calculatedCost = parseFloat((baseCost * Math.pow(trafficMultiplier, 0.65)).toFixed(2));
    totalMonthlyCost += calculatedCost;

    nodeCosts.push({
      nodeId: node.id,
      nodeLabel: node.label,
      category: node.category,
      provider: node.cloudProvider || node.hosting || 'Serverless Cloud',
      estimatedMonthlyCost: calculatedCost,
      costBreakdown: breakdown
    });
  }

  const projectedCostHighTraffic = parseFloat((totalMonthlyCost * 3.8).toFixed(2));

  const savingsRecommendations = [
    {
      title: 'Habilitar Caché de Inferencia LLM en Redis',
      description: 'Guarda respuestas repetidas de OpenAI/Gemini en Redis para reducir consumo de tokens.',
      potentialSavingsMonthly: 28.00
    },
    {
      title: 'Optimizar Instancia MongoDB Atlas a Serverless',
      description: 'Migra clusters dedicados M10 a pago por uso Serverless en etapas de desarrollo.',
      potentialSavingsMonthly: 35.00
    },
    {
      title: 'Reglas de Ciclo de Vida S3 Lifecycle',
      description: 'Archiva adjuntos con más de 90 días en S3 Glacier para reducir costo de almacenamiento.',
      potentialSavingsMonthly: 8.50
    }
  ];

  return {
    totalMonthlyCost: parseFloat(totalMonthlyCost.toFixed(2)),
    projectedCostHighTraffic,
    nodeCosts,
    savingsRecommendations
  };
}
