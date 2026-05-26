// Models showcase data (spec §6). A small typed array feeding /models/. Six
// open-weight models plus one benchmark dataset, all live under
// huggingface.co/Orionfold. Facts (base model, format, recommended build,
// license) come from the donor artifact YAMLs; the plain taglines read grade
// 3–5 with inline glosses, and the deeper detail lives in the page's
// BehindTheScenes reveal (memory `website-copy-style`, spec §7).
export interface Model {
  group: 'patent' | 'domain' | 'dataset';
  domain: string; // eyebrow label
  title: string;
  variant?: string; // build differentiator, e.g. "nemo · GGUF"
  tagline: string;
  base?: string; // base model id (mono spec row)
  format: string;
  recommended?: string; // recommended variant/quant
  license: string;
  href: string; // real HuggingFace repo
  ctaText?: string;
  // Curated comic cover (featured-imagery skill). A filename under
  // src/assets/models/<slug>/, resolved to ImageMetadata by a glob in
  // models.astro. When absent the card falls back to the constellation motif.
  cover?: string;
  coverAlt?: string; // grade 3-5, no em-dashes (website-copy-style)
}

const HF = 'https://huggingface.co/Orionfold';

export const models: Model[] = [
  // ── Patent Strategist: one model, two NeMo builds (two formats) ──
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
    cover: 'patent-strategist/cover.png',
    coverAlt: 'A movie-poster style picture. A Victorian inventor workshop full of brass gears and blueprints, with a small gold AI computer on the desk. The title reads Prior Art.',
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
    cover: 'patent-strategist-adapter/cover.png',
    coverAlt: 'A movie-poster style picture. A robot arm clicks a small glowing blue add-on into a little gold AI computer on a workbench, with patent drawings all around. The title reads The Upgrade.',
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
    cover: 'securityllm/cover.png',
    coverAlt: 'A movie-poster style picture. A 1940s code room with old cipher machines, where a small gold AI computer turns secret code into a glowing shield. The title reads Zero Day.',
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
    cover: 'saul-7b-instruct/cover.png',
    coverAlt: 'A movie-poster style picture. A grand courtroom with a gavel, where a small gold AI computer glows beside the case files. The title reads The Verdict.',
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
    cover: 'finance-chat/cover.png',
    coverAlt: 'A movie-poster style picture. A 1980s trading floor with a golden bull and rising green charts, with a small gold AI computer on the desk. The title reads The Bull Run.',
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
    cover: 'ii-medical-8b/cover.png',
    coverAlt: 'A movie-poster style picture. An old medical room with an anatomy chart, where a small gold AI computer shows a calm health read-out. The title reads The Diagnosis.',
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
    cover: 'patent-strategist-bench/cover.png',
    coverAlt: 'A movie-poster style picture. An exam hall with a big score gauge and a chalkboard of grades, where a small gold AI computer marks the test papers. The title reads The Final Exam.',
  },
];
