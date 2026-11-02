import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

  let userId = "";
  try {
    const body = await req.json();
    userId = String(body?.user_id ?? "").trim();
  } catch {
    return respond({ success: false, error: "Corps de requête invalide." }, 400);
  }
  if (!userId) return respond({ success: false, error: "Identifiant administrateur manquant." }, 400);
  if (userId === caller.id) {
    return respond({ success: false, error: "Vous ne pouvez pas supprimer votre propre compte." }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let target = null;
  let adminCount = 0;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return respond({ success: false, error: "Vérification des administrateurs impossible : " + error.message }, 500);
    for (const user of data.users) {
      if (user.app_metadata?.role === "admin") adminCount++;
      if (user.id === userId) target = user;
    }
    if (data.users.length < 1000) break;
  }

  if (!target) return respond({ success: false, error: "Ce compte administrateur n’existe plus." }, 404);
  if (target.app_metadata?.role !== "admin") {
    return respond({ success: false, error: "Ce compte ne possède plus les droits administrateur." }, 409);
  }
  if (adminCount <= 1) {
    return respond({ success: false, error: "Impossible de supprimer le dernier administrateur." }, 409);
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) {
    return respond({ success: false, error: "Suppression du compte impossible : " + deleteError.message }, 500);
  }

  return respond({ success: true, deleted_user_id: userId });
});
