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

function makeLicenseKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const parts = [0, 4, 8].map((start) =>
    Array.from(bytes.slice(start, start + 4), (value) => alphabet[value % alphabet.length]).join("")
  );
  return `MAX23-${parts.join("-")}`;
}

async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const authenticatedHandler = withSupabase({ auth: "user" }, async (request, ctx) => {
  try {
    const userId = (ctx.userClaims?.id ?? ctx.userClaims?.sub) as string | undefined;
    if (!userId) return json({ error: "Sign in required" }, 401);

    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "";
    const admin = ctx.supabaseAdmin;

    if (action === "status") {
      const { data, error } = await admin
        .from("launcher_keys")
        .select("is_active, device_hash")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return json({
        hasKey: Boolean(data),
        isActive: Boolean(data?.is_active),
        deviceBound: Boolean(data?.device_hash),
      });
    }

    if (action === "issue") {
      const licenseKey = makeLicenseKey();
      const licenseKeyHash = await hash(licenseKey);
      const { data: existing, error: readError } = await admin
        .from("launcher_keys")
        .select("device_hash")
        .eq("user_id", userId)
        .maybeSingle();
      if (readError) throw readError;

      const { error } = await admin.from("launcher_keys").upsert({
        user_id: userId,
        license_key_hash: licenseKeyHash,
        is_active: true,
        device_hash: existing?.device_hash ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw error;
      return json({ licenseKey, isActive: true, deviceBound: Boolean(existing?.device_hash) });
    }

    if (action === "reset-device") {
      const { error } = await admin
        .from("launcher_keys")
        .update({ device_hash: null, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Unknown account action" }, 400);
  } catch (error) {
    console.error("launcher-account failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "Account request failed" }, 500);
  }
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  return authenticatedHandler(request);
});
