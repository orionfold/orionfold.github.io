import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBookEmail, signBookFiles } from "../_shared/book-files.ts";

const SITE = "https://orionfold.com";

function redirect(query: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: `${SITE}/?${query}` },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return redirect("confirmed=error&error=Method+not+allowed");
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect("confirmed=error&error=Invalid+confirmation+link");
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error: selectError } = await supabase
      .from("waitlist")
      .select("id, email, confirmed, offer")
      .eq("confirm_token", token)
      .maybeSingle();

    if (selectError) {
      console.error("Select error:", selectError);
      return redirect("confirmed=error&error=Something+went+wrong");
    }

    if (!row) {
      return redirect(
        "confirmed=error&error=This+link+has+expired+or+was+already+used",
      );
    }

    if (row.confirmed) {
      return redirect("confirmed=already");
    }

    const { error: updateError } = await supabase
      .from("waitlist")
      .update({
        confirmed: true,
        confirm_token: null,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return redirect("confirmed=error&error=Something+went+wrong");
    }

    // Magnet delivery: the become-ai-native-business opt-in gates the free book.
    // On confirm, sign the already-uploaded PDF+EPUB and email them, then land
    // the subscriber on the magnet thank-you page. Delivery never blocks the
    // confirm: a signing/email failure is logged, the subscriber stays
    // confirmed, and they still reach the thanks page (the email is the channel;
    // a missing file is an operator bucket fix). All other offers are unchanged.
    if (row.offer === "become-ai-native-business") {
      try {
        const links = await signBookFiles(supabase, "book_ai_native_business");
        if (links.length > 0) {
          await sendBookEmail(row.email, "AI Native Business", links);
        } else {
          console.error("Magnet confirm: no files in book-files/book_ai_native_business");
        }
      } catch (deliverErr) {
        console.error("Magnet confirm: book delivery failed:", deliverErr);
      }
      return new Response(null, {
        status: 302,
        headers: { Location: `${SITE}/become-ai-native-business/thanks/` },
      });
    }

    return redirect("confirmed=1");
  } catch (err) {
    console.error("Unhandled error:", err);
    return redirect("confirmed=error&error=Something+went+wrong");
  }
});
