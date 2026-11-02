import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const reply=(body:Record<string,unknown>,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply({success:false,error:"Méthode non autorisée."},405);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),auth=req.headers.get("Authorization")||"";
 if(!url||!anon||!service||!auth.startsWith("Bearer "))return reply({success:false,error:"Authentification ou configuration serveur manquante."},401);
 const token=auth.slice(7),client=createClient(url,anon,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await client.auth.getUser(token);
 if(error||!user||user.app_metadata?.role!=="admin")return reply({success:false,error:"Session administrateur requise."},403);
 if(user.app_metadata?.must_change_password!==true)return reply({success:true});
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error:updateError}=await admin.auth.admin.updateUserById(user.id,{app_metadata:{...user.app_metadata,must_change_password:false}});
 if(updateError)return reply({success:false,error:"Mise à jour du compte impossible : "+updateError.message},500);
 return reply({success:true});
});