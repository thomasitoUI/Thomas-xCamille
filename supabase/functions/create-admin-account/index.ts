import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const reply=(body:Record<string,unknown>,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply({success:false,error:"Méthode non autorisée."},405);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 const auth=req.headers.get("Authorization")||"";
 if(!url||!anon||!service||!auth.startsWith("Bearer "))return reply({success:false,error:"Authentification ou configuration serveur manquante."},401);
 const token=auth.slice(7),callerClient=createClient(url,anon,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user:caller},error:authError}=await callerClient.auth.getUser(token);
 if(authError||!caller||caller.app_metadata?.role!=="admin")return reply({success:false,error:"Droits administrateur requis."},403);
 let body:any;try{body=await req.json()}catch{return reply({success:false,error:"Requête invalide."},400)}
 const email=String(body?.email||"").trim().toLowerCase(),password=String(body?.password||"");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply({success:false,error:"Adresse e-mail invalide."},400);
 if(password.length<16)return reply({success:false,error:"Le mot de passe temporaire doit contenir au moins 16 caractères."},400);
 if(email===caller.email?.toLowerCase())return reply({success:false,error:"Cette adresse correspond déjà à votre compte."},400);
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,app_metadata:{role:"admin",must_change_password:true}});
 if(error||!data.user)return reply({success:false,error:error?.message||"Création du compte impossible."},409);
 const {error:memberError}=await admin.from("team_members").upsert({user_id:data.user.id,email,role:"admin",status:"active",invited_by:caller.id,updated_at:new Date().toISOString()},{onConflict:"user_id"});
 if(memberError){await admin.auth.admin.deleteUser(data.user.id);return reply({success:false,error:"Ajout à l’équipe impossible : "+memberError.message},500)}
 return reply({success:true,user_id:data.user.id});
});