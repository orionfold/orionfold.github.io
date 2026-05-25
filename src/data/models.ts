// Models showcase data (spec §6). A small typed array feeding /models/. Eight
// open-weight models plus one benchmark dataset, all live under
// huggingface.co/Orionfold. Facts (base model, format, recommended build,
// license) come from the donor artifact YAMLs; the plain taglines read grade
// 3–5 with inline glosses, and the deeper detail lives in the page's
// BehindTheScenes reveal (memory `website-copy-style`, spec §7).
export interface Model {
  group: 'patent' | 'domain' | 'dataset';
  domain: string; // eyebrow label
  title: string;
  variant?: string; // build differentiator, e.g. "unsloth · GGUF"
  tagline: string;
  base?: string; // base model id (mono spec row)
  format: string;
  recommended?: string; // recommended variant/quant
  license: string;
  href: string; // real HuggingFace repo
  ctaText?: string;
}

const HF = 'https://huggingface.co/Orionfold';

export const models: Model[] = [
  // ── Patent Strategist: one model, four builds (two training toolkits × two formats) ──
  {
    group: 'patent',
    domain: 'Patent',
    title: 'Patent Strategist',
    variant: 'unsloth · GGUF',
    tagline: 'Offline patent reasoning in ready-to-run files. Private text never leaves your desktop.',
    base: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
    format: 'GGUF',
    recommended: 'Q5_K_M',
    license: 'Apache-2.0',
    href: `${HF}/patent-strategist-v3-unsloth-GGUF`,
  },
  {
    group: 'patent',
    domain: 'Patent',
    title: 'Patent Strategist',
    variant: 'unsloth · adapter',
    tagline: 'The same patent reasoning as a small add-on patch for the base model. Best if you build your own setup.',
    base: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
    format: 'LoRA adapter (BF16)',
    recommended: 'BF16',
    license: 'Apache-2.0',
    href: `${HF}/patent-strategist-v3-unsloth`,
  },
  {
    group: 'patent',
    domain: 'Patent',
    title: 'Patent Strategist',
    variant: 'nemo · GGUF',
    tagline: 'Offline patent reasoning in ready-to-run files, built with the NeMo toolkit. Nothing leaves your desktop.',
    base: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
    format: 'GGUF',
    recommended: 'Q5_K_M',
    license: 'Apache-2.0',
    href: `${HF}/patent-strategist-v3-nemo-GGUF`,
  },
  {
    group: 'patent',
    domain: 'Patent',
    title: 'Patent Strategist',
    variant: 'nemo · adapter',
    tagline: 'The NeMo-built patent reasoning as a small add-on patch for the base model. For your own custom builds.',
    base: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
    format: 'LoRA adapter (BF16)',
    recommended: 'BF16',
    license: 'Apache-2.0',
    href: `${HF}/patent-strategist-v3-nemo`,
  },

  // ── One model per domain ──
  {
    group: 'domain',
    domain: 'Security',
    title: 'SecurityLLM',
    tagline: 'Tuned for cyber security questions, threat write-ups, and security know-how.',
    base: 'ZySec-AI/SecurityLLM',
    format: 'GGUF',
    recommended: 'Q4_K_M',
    license: 'Apache-2.0',
    href: `${HF}/SecurityLLM-GGUF`,
  },
  {
    group: 'domain',
    domain: 'Legal',
    title: 'Saul 7B Instruct',
    tagline: 'Tuned for legal text and built to follow instructions on legal tasks.',
    base: 'Equall/Saul-7B-Instruct-v1',
    format: 'GGUF',
    license: 'MIT',
    href: `${HF}/Saul-7B-Instruct-v1-GGUF`,
  },
  {
    group: 'domain',
    domain: 'Finance',
    title: 'Finance Chat',
    tagline: 'Tuned for finance and money questions in plain chat.',
    base: 'AdaptLLM/finance-chat',
    format: 'GGUF',
    license: 'Free',
    href: `${HF}/finance-chat-GGUF`,
  },
  {
    group: 'domain',
    domain: 'Medical',
    title: 'II-Medical 8B',
    tagline: 'Tuned for medical questions and clinical text.',
    base: 'Intelligent-Internet/II-Medical-8B',
    format: 'GGUF',
    recommended: 'Q5_K_M',
    license: 'Apache-2.0',
    href: `${HF}/II-Medical-8B-GGUF`,
  },

  // ── Benchmark dataset ──
  {
    group: 'dataset',
    domain: 'Dataset',
    title: 'Patent Strategist Bench',
    tagline: 'A 200-question test set that scores how well an AI reasons about patents, across seven kinds of task.',
    format: 'Dataset · 200 questions',
    license: 'CC-BY-4.0',
    href: 'https://huggingface.co/datasets/Orionfold/patent-strategist-bench-v0.1',
    ctaText: 'Get the dataset',
  },
];
