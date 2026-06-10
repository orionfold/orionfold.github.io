export type PortalOfferId = 'advisor' | 'workflows' | 'experts' | 'cockpit';

export interface NvidiaPortalProfile {
  id: PortalOfferId;
  productServiceName: string;
  webpage: string;
  type: string;
  developmentStage: 'Shipping' | 'Developing' | 'Alpha/Beta';
  valueProposition: string;
  technicalDetails: string;
  runtimeAcceleratedByNvidia: 'Yes' | 'No' | 'Deployment-dependent';
  usesNvidiaTechnologies: 'Yes' | 'No';
  nvidiaTechnologiesUsed: string[];
  nvidiaTechnologiesConsidered: string[];
  nonNvidiaTechnologies: string[];
}

const site = 'https://orionfold.com';

export const nvidiaBrand = {
  program: 'NVIDIA Inception program',
  color: '#76B900',
};

export const nvidiaPortalProfiles: Record<PortalOfferId, NvidiaPortalProfile> = {
  advisor: {
    id: 'advisor',
    productServiceName: 'Orionfold Advisor',
    webpage: `${site}/advisor/`,
    type: 'AI knowledge assistant',
    developmentStage: 'Developing',
    valueProposition:
      'A private expert interface over the Orionfold corpus for small teams adopting local AI. Advisor starts with source-grounded retrieval over books, build notes, model cards, and product docs, then moves toward fine-tuned small models once evals are stable.',
    technicalDetails:
      'Initial architecture is local retrieval over Orionfold materials with citations, confidence cues, and replayable evaluation sets. Target deployments run on customer-controlled hardware, with NVIDIA GPUs used for accelerated embedding, reranking, and local model inference where available.',
    runtimeAcceleratedByNvidia: 'Deployment-dependent',
    usesNvidiaTechnologies: 'Yes',
    nvidiaTechnologiesUsed: ['NVIDIA DGX Spark reference hardware', 'CUDA-capable local inference stacks'],
    nvidiaTechnologiesConsidered: ['NVIDIA NeMo Retriever', 'NVIDIA NIM', 'TensorRT-LLM'],
    nonNvidiaTechnologies: ['Hugging Face', 'Astro', 'local vector search', 'open-weight LLMs'],
  },
  workflows: {
    id: 'workflows',
    productServiceName: 'Private Agent Starter Kit',
    webpage: `${site}/workflows/`,
    type: 'Fixed-scope AI workflow implementation',
    developmentStage: 'Alpha/Beta',
    valueProposition:
      'A fixed-scope starter kit that gives a small team one private agent workflow with trigger, runner, evaluation, approval loop, artifact output, and audit trail. It turns AI experimentation into an owned operating capability.',
    technicalDetails:
      'Built from the AI Native Platform, AI Native API, Sentinel checks, and local workflow patterns. Kits can run on customer-controlled NVIDIA GPU systems for private inference and evaluation, while preserving approval gates, logs, and artifacts for review.',
    runtimeAcceleratedByNvidia: 'Deployment-dependent',
    usesNvidiaTechnologies: 'Yes',
    nvidiaTechnologiesUsed: ['NVIDIA DGX Spark reference hardware', 'CUDA-capable inference runtimes'],
    nvidiaTechnologiesConsidered: ['NVIDIA NIM', 'NVIDIA NeMo Guardrails', 'TensorRT-LLM'],
    nonNvidiaTechnologies: ['AI Native Platform', 'REST APIs', 'Sentinel', 'local filesystems', 'open-weight LLMs'],
  },
  experts: {
    id: 'experts',
    productServiceName: 'Orionfold Domain Experts',
    webpage: `${site}/experts/`,
    type: 'Domain AI models and implementation playbooks',
    developmentStage: 'Shipping',
    valueProposition:
      'Offline model packs for sensitive domain work. Each pack combines a domain model, benchmark or scorecard, local run path, and use-case playbook. Patent Strategist is the live flagship; security, legal, finance, and medical packs follow the same pattern.',
    technicalDetails:
      'Patent Strategist is built with NVIDIA NeMo and shipped as GGUF and adapter artifacts with a public benchmark. Packs are tested on NVIDIA DGX Spark-class hardware and can run offline with local inference stacks, preserving sensitive documents and prompts on customer-controlled machines.',
    runtimeAcceleratedByNvidia: 'Yes',
    usesNvidiaTechnologies: 'Yes',
    nvidiaTechnologiesUsed: ['NVIDIA DGX Spark', 'NVIDIA NeMo', 'CUDA-capable inference'],
    nvidiaTechnologiesConsidered: ['NVIDIA NIM', 'TensorRT-LLM', 'NVIDIA NeMo Evaluator'],
    nonNvidiaTechnologies: ['Hugging Face', 'GGUF', 'llama.cpp', 'DeepSeek', 'Qwen', 'Apple Silicon'],
  },
  cockpit: {
    id: 'cockpit',
    productServiceName: 'Orionfold Local AI Cockpit',
    webpage: `${site}/cockpit/`,
    type: 'Local AI evaluation and operations cockpit',
    developmentStage: 'Shipping',
    valueProposition:
      'A local cockpit for comparing, remembering, evaluating, and shipping private AI work. Arena provides the cockpit, Cortex adds local memory and provenance, and fieldkit carries reusable patterns for model runs, evals, RAG, training, and publishing.',
    technicalDetails:
      'Cockpit components run local model comparisons, telemetry, memory indexing, eval gates, RAG patterns, and training utilities. The stack is proven on NVIDIA DGX Spark and supports NVIDIA GPU acceleration for inference, fine-tuning, NIM serving, and model evaluation workflows.',
    runtimeAcceleratedByNvidia: 'Yes',
    usesNvidiaTechnologies: 'Yes',
    nvidiaTechnologiesUsed: ['NVIDIA DGX Spark', 'NVIDIA NIM', 'CUDA-capable inference', 'NVIDIA NeMo patterns'],
    nvidiaTechnologiesConsidered: ['TensorRT-LLM', 'NVIDIA NeMo Guardrails', 'NVIDIA NeMo Retriever'],
    nonNvidiaTechnologies: ['fieldkit', 'Orionfold Arena', 'Orionfold Cortex', 'Hugging Face', 'Python', 'llama.cpp'],
  },
};
