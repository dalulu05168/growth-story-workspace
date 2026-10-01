-- Independent application snapshots; only the authenticated edge service can access them.
create table public.workspace_backups (
 id uuid primary key default gen_random_uuid(),
 account_id uuid not null references public.workspace_accounts(id) on delete cascade,
 version bigint not null,
 payload jsonb not null,
 label text not null,
 created_at timestamptz not null default now()
);
create index workspace_backups_account_time on public.workspace_backups(account_id,created_at desc);
alter table public.workspace_backups enable row level security;
revoke all on public.workspace_backups from public,anon,authenticated;
grant all on public.workspace_backups to service_role;

-- Compare-and-swap and the pre-change backup execute in one transaction.
create or replace function public.workspace_save_with_backup(p_account uuid,p_payload jsonb,p_expected bigint,p_label text default null)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare s public.workspace_cloud_state%rowtype; next_version bigint; stamp timestamptz=clock_timestamp();
begin
 select * into s from public.workspace_cloud_state where account_id=p_account for update;
 if s.account_id is null then return jsonb_build_object('ok',false,'code','STATE_MISSING'); end if;
 if p_expected is null or s.version<>p_expected then return jsonb_build_object('ok',false,'code','VERSION_CONFLICT'); end if;
 if p_label is not null or not exists(select 1 from public.workspace_backups where account_id=p_account and created_at>date_trunc('day',stamp at time zone 'UTC') at time zone 'UTC') then
   insert into public.workspace_backups(account_id,version,payload,label) values(p_account,s.version,s.payload,coalesce(left(p_label,80),'每日修改前自动备份'));
 end if;
 next_version=s.version+1;
 update public.workspace_cloud_state set payload=p_payload,version=next_version,updated_at=stamp where account_id=p_account;
 delete from public.workspace_backups where account_id=p_account and id not in(select id from public.workspace_backups where account_id=p_account order by created_at desc limit 30);
 return jsonb_build_object('ok',true,'version',next_version,'updatedAt',stamp);
end $$;
revoke all on function public.workspace_save_with_backup(uuid,jsonb,bigint,text) from public,anon,authenticated;
grant execute on function public.workspace_save_with_backup(uuid,jsonb,bigint,text) to service_role;

-- Snapshot creation uses the same account row lock as writes, preserving a coherent version.
create or replace function public.workspace_create_backup(p_account uuid,p_label text)
returns uuid language plpgsql security invoker set search_path=public as $$
declare s public.workspace_cloud_state%rowtype; backup_id uuid;
begin
 select * into s from public.workspace_cloud_state where account_id=p_account for update;
 if s.account_id is null then return null; end if;
 insert into public.workspace_backups(account_id,version,payload,label) values(p_account,s.version,s.payload,left(p_label,80)) returning id into backup_id;
 delete from public.workspace_backups where account_id=p_account and id not in(select id from public.workspace_backups where account_id=p_account order by created_at desc limit 30);
 return backup_id;
end $$;
revoke all on function public.workspace_create_backup(uuid,text) from public,anon,authenticated;
grant execute on function public.workspace_create_backup(uuid,text) to service_role;

alter table public.workspace_login_challenges drop constraint workspace_login_challenges_purpose_check;
alter table public.workspace_login_challenges add constraint workspace_login_challenges_purpose_check check(purpose in ('enroll','verify','replace'));

-- Authorize replacement atomically. Existing verifier remains active until the new seed is verified.
create or replace function public.workspace_authorize_replacement(p_account uuid,p_step bigint,p_recovery text,p_challenge_hash text,p_seed text)
returns boolean language plpgsql security invoker set search_path=public as $$
declare a public.workspace_accounts%rowtype;
begin
 select * into a from public.workspace_accounts where id=p_account for update;
 if a.id is null or a.disabled or not a.totp_enabled then return false; end if;
 if p_recovery is not null then
   if not(a.recovery_hashes ? p_recovery) then return false; end if;
   update public.workspace_accounts set recovery_hashes=recovery_hashes-p_recovery where id=a.id;
 else
   if p_step is null or p_step<=a.totp_last_step then return false; end if;
   update public.workspace_accounts set totp_last_step=p_step where id=a.id;
 end if;
 delete from public.workspace_login_challenges where account_id=a.id and purpose='replace';
 insert into public.workspace_login_challenges(account_id,challenge_hash,purpose,encrypted_seed,expires_at) values(a.id,p_challenge_hash,'replace',p_seed,now()+interval '10 minutes');
 return true;
end $$;
revoke all on function public.workspace_authorize_replacement(uuid,bigint,text,text,text) from public,anon,authenticated;
grant execute on function public.workspace_authorize_replacement(uuid,bigint,text,text,text) to service_role;

create or replace function public.workspace_complete_mfa(p_challenge_hash text,p_step bigint,p_recovery_hash text,p_token_hash text,p_expires timestamptz,p_recovery_hashes jsonb default null)
returns uuid language plpgsql security invoker set search_path=public as $$
declare c public.workspace_login_challenges%rowtype; a public.workspace_accounts%rowtype; sid uuid;
begin
 select * into c from public.workspace_login_challenges where challenge_hash=p_challenge_hash for update;
 if c.id is null or c.expires_at<=now() or c.failed_count>=5 then return null; end if;
 select * into a from public.workspace_accounts where id=c.account_id for update;
 if a.disabled then return null; end if;
 if c.purpose in ('enroll','replace') then
   if (c.purpose='enroll' and a.totp_enabled) or (c.purpose='replace' and not a.totp_enabled) or c.encrypted_seed is null or p_step is null or p_recovery_hashes is null then return null; end if;
   update public.workspace_accounts set totp_secret=c.encrypted_seed,totp_enabled=true,totp_last_step=p_step,totp_enrolled_at=now(),recovery_hashes=p_recovery_hashes where id=a.id;
   delete from public.workspace_sessions where account_id=a.id;
 else
   if not a.totp_enabled then return null; end if;
   if p_recovery_hash is not null then
     if not (a.recovery_hashes ? p_recovery_hash) then return null; end if;
     update public.workspace_accounts set recovery_hashes=recovery_hashes-p_recovery_hash where id=a.id;
   else
     if p_step is null or p_step<=a.totp_last_step then return null; end if;
     update public.workspace_accounts set totp_last_step=p_step where id=a.id;
   end if;
 end if;
 delete from public.workspace_login_challenges where account_id=a.id;
 insert into public.workspace_sessions(account_id,token_hash,expires_at,mfa_verified) values(a.id,p_token_hash,p_expires,true) returning id into sid;
 return sid;
end $$;
revoke all on function public.workspace_complete_mfa(text,bigint,text,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.workspace_complete_mfa(text,bigint,text,text,timestamptz,jsonb) to service_role;

