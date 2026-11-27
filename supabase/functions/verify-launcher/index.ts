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

async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const authenticatedHandler = withSupabase({ auth: "user" }, async (request, ctx) => {
  try {
    const userId = (ctx.userClaims?.id ?? ctx.userClaims?.sub) as string | undefined;
    if (!userId) return json({ error: "Sign in required" }, 401);

    const body = await request.json();
    const licenseKey = typeof body.licenseKey === "string" ? body.licenseKey.trim().toUpperCase() : "";
    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
    if (!licenseKey || !deviceId || deviceId.length > 128) {
      return json({ error: "License key and device ID are required" }, 400);
    }

    const admin = ctx.supabaseAdmin;
    const { data: license, error: readError } = await admin
      .from("launcher_keys")
      .select("license_key_hash, is_active, device_hash")
      .eq("user_id", userId)
      .maybeSingle();
    if (readError) throw readError;
    if (!license?.is_active || license.license_key_hash !== await hash(licenseKey)) {
      return json({ error: "Account or license key is not active" }, 403);
    }

    const deviceHash = await hash(deviceId);
    if (license.device_hash && license.device_hash !== deviceHash) {
      return json({ error: "This license is already linked to another installation. Reset the device link from your account page." }, 403);
    }
    if (!license.device_hash) {
      const { error } = await admin
        .from("launcher_keys")
        .update({ device_hash: deviceHash, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (error) throw error;
    }

    return json({ allowed: true });
  } catch (error) {
    console.error("verify-launcher failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "Launcher verification failed" }, 500);
  }
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  return authenticatedHandler(request);
});
