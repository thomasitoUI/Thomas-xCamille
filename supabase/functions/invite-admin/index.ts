import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ success: false, error: "Méthode non autorisée." }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return respond({ success: false, error: "Authentification requise." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return respond({ success: false, error: "Configuration serveur incomplète." }, 500);
  }

  const token = authorization.slice("Bearer ".length);
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user: caller }, error: authError } = await callerClient.auth.getUser(token);
  if (authError || !caller || caller.app_metadata?.role !== "admin") {
    return respond({ success: false, error: "Droits administrateur requis." }, 403);
  }

  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return respond({ success: false, error: "Corps de requête invalide." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return respond({ success: false, error: "Adresse e-mail invalide." }, 400);
  }
  if (email === caller.email?.toLowerCase()) {
    return respond({ success: false, error: "Cette adresse correspond déjà à votre compte." }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const siteUrl = Deno.env.get("SITE_URL");
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    ...(siteUrl ? { redirectTo: siteUrl } : {}),
    data: { invited_as: "admin" },
  });
  if (error || !data.user) {
    return respond({ success: false, error: error?.message ?? "Invitation non créée." }, 400);
  }

  const existingMetadata = data.user.app_metadata ?? {};
  const { error: roleError } = await adminClient.auth.admin.updateUserById(data.user.id, {
    app_metadata: { ...existingMetadata, role: "admin" },
  });
  if (roleError) {
    await adminClient.auth.admin.deleteUser(data.user.id);
    return respond({ success: false, error: "Le rôle administrateur n’a pas pu être attribué. L’invitation a été annulée." }, 500);
  }

  return respond({ success: true });
});
