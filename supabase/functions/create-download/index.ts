import { withSupabase } from "npm:@supabase/server@1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

const authenticatedHandler = withSupabase({ auth: "user" }, async (_request, ctx) => {
  try {
    const userId = (ctx.userClaims?.id ?? ctx.userClaims?.sub) as string | undefined;
    if (!userId) return json({ error: "Sign in required" }, 401);

    const { data: license, error: licenseError } = await ctx.supabaseAdmin
      .from("launcher_keys")
      .select("is_active")
      .eq("user_id", userId)
      .maybeSingle();
    if (licenseError) throw licenseError;
    if (!license?.is_active) return json({ error: "Active account license required" }, 403);

    const { data, error } = await ctx.supabaseAdmin.storage
      .from("launcher-downloads")
      .createSignedUrl("maxalbe23-launcher-setup.exe", 120, { download: true });
    if (error) throw error;
    return json({ signedUrl: data.signedUrl });
  } catch (error) {
    console.error("create-download failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "Installer download failed" }, 500);
  }
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  return authenticatedHandler(request);
});
