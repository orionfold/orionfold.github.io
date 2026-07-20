import type { APIRoute } from "astro";
import { buildTrainingPricing } from "../../data/training-pricing";

export const prerender = true;

export const GET: APIRoute = () => new Response(
  `${JSON.stringify(buildTrainingPricing(), null, 2)}\n`,
  { headers: { "Content-Type": "application/json; charset=utf-8" } },
);
