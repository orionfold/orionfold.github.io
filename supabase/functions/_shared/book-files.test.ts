// Unit lock for the shared book-file seam. signBookFiles is exercised against a
// fake supabase Storage client (no network); bookEmailText/brandedUrl are pure.
// Run: deno test --allow-env supabase/functions/_shared/book-files.test.ts
// (--allow-env: brandedUrl reads SUPABASE_URL to swap in the branded host.)
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { bookEmailText, signBookFiles } from "./book-files.ts";

// Fake Storage client: .from(bucket).list(prefix) and .createSignedUrl(path, ttl).
function fakeSupabase(files: Array<{ name: string }>) {
  return {
    storage: {
      from(_bucket: string) {
        return {
          list(_prefix: string) {
            return Promise.resolve({ data: files, error: null });
          },
          createSignedUrl(path: string, _ttl: number) {
            return Promise.resolve({
              data: { signedUrl: `https://orionfold.supabase.co/storage/v1/object/sign/${path}?token=x` },
              error: null,
            });
          },
        };
      },
    },
  };
}

Deno.test("signBookFiles signs only pdf/epub, labels formats", async () => {
  const sb = fakeSupabase([
    { name: "AI-Native-Business.pdf" },
    { name: "AI-Native-Business.epub" },
    { name: "cover.png" },
  ]);
  const links = await signBookFiles(sb, "book_ai_native_business");
  assertEquals(links.length, 2);
  assertEquals(links.map((l) => l.format).sort(), ["EPUB", "PDF"]);
  assert(links.every((l) => l.url.includes("book_ai_native_business/")));
});

Deno.test("signBookFiles returns [] on list error", async () => {
  const sb = {
    storage: {
      from() {
        return { list() { return Promise.resolve({ data: null, error: { message: "boom" } }); } };
      },
    },
  };
  const links = await signBookFiles(sb, "book_ai_native_business");
  assertEquals(links, []);
});

Deno.test("bookEmailText includes both links and is em-dash free", () => {
  const text = bookEmailText("AI Native Business", [
    { format: "PDF", url: "https://x/p.pdf" },
    { format: "EPUB", url: "https://x/e.epub" },
  ], "FIXTURE-FOOTER");
  assert(text.includes("AI Native Business"));
  assert(text.includes("https://x/p.pdf"));
  assert(text.includes("https://x/e.epub"));
  assert(text.includes("FIXTURE-FOOTER"));
  assert(!text.includes("—"));
});
