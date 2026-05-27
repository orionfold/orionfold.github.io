// Build-time trust dataset (P3, spec §5.6). One top-level await resolves the live
// HuggingFace download/like counts + local book stats once per build (snapshot
// fallback), exactly like src/data/roadmap.ts. The product-detail routes import
// `trust` + `buildTrustStats` to populate each page's TrustBlock.
import { loadTrust, buildTrustStats } from '../lib/trust/source';

export const trust = await loadTrust();
export { buildTrustStats };
