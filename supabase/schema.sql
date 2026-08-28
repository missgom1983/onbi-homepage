-- ============================================================
-- On:Vi — Supabase 스키마 v1.0
-- 인증: 카카오 OAuth 단일 / 결제 테이블은 이번 범위 제외
-- 실행 순서: 이 파일을 SQL Editor에 그대로 붙여 실행
-- ============================================================

create extension if not exists "pgcrypto";

-- ── ENUM ────────────────────────────────────────────────────
create type onvi_relation as enum ('딸','아들','며느리','사위','손주','기타');
create type onvi_member_role as enum ('owner','member');
create type onvi_living as enum ('alone','couple','with_family','unknown');
create type onvi_parent_consent as enum ('pending','granted','declined','withdrawn');
create type onvi_mode as enum ('이음','새김','undecided');
create type onvi_consult_status as enum ('new','contacted','scheduled','converted','closed');
create type onvi_app_status as enum ('draft','submitted','greeting_kit_sent','first_call_done','active','paused','ended');
create type onvi_consent_kind as enum ('privacy_required','marketing','parent_recording','third_party');

-- ── 1. profiles : auth.users 1:1 ────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  phone         text,                       -- 폼에서 직접 입력 (카카오 전화번호는 비즈앱 심사 후 자동 취득)
  email         text,                       -- 카카오 계정 이메일
  kakao_id      text unique,
  region        text,                       -- 시/군/구 단위까지만
  relation      onvi_relation,
  marketing_opt_in boolean not null default false,
  last_seen_at  timestamptz,                -- 휴면 정책 기준
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on column public.profiles.region is '상세주소 저장 금지 — 담당자 배정과 통계 목적';

-- 카카오 로그인 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, kakao_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'nickname', '온비 가족'),
    new.email,
    new.raw_user_meta_data->>'provider_id'
  ) on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. households : 가족 공간 (가입자 = 가구 대표) ──────────
create table public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,               -- 예: "김순자 어머니 가족"
  owner_id    uuid not null references public.profiles(id) on delete restrict,
  mode        onvi_mode not null default 'undecided',
  created_at  timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         onvi_member_role not null default 'member',
  relation     onvi_relation,
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- 형제자매 초대 링크
create table public.household_invites (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  token        text not null unique default encode(gen_random_bytes(16), 'hex'),
  invited_by   uuid not null references public.profiles(id) on delete cascade,
  invitee_hint text,                        -- "누나", "막내" 등 표시용 별칭
  expires_at   timestamptz not null default now() + interval '14 days',
  accepted_by  uuid references public.profiles(id),
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ── 3. parents : 부모님 (가입 후 온보딩에서 입력) ───────────
create table public.parents (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  name           text not null,
  birth_year     int check (birth_year between 1900 and 2010),
  gender          text check (gender in ('여','남','미기재')),
  phone          text,
  living          onvi_living not null default 'unknown',
  call_time_pref  text,                     -- "평일 오전", "저녁 7시 이후" 등 자유 표기
  call_weekday    text,                     -- 이야기 통화 고정 요일
  notes           text,                     -- 담당자 참고 (귀가 잘 안 들리심 등)
  consent_status  onvi_parent_consent not null default 'pending',
  consent_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.parents is '통화 기록은 consent_status = granted 이후에만 생성';

-- 첫인사꾸러미 배송 주소 — 부모님 정보와 분리 저장
create table public.parent_addresses (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references public.parents(id) on delete cascade,
  recipient   text not null,
  phone       text,
  postcode    text not null,
  address1    text not null,
  address2    text,
  delivery_note text,                       -- "경비실에 맡겨주세요" 등
  created_at  timestamptz not null default now()
);

-- ── 4. applications : 가족 공간에서의 참여 신청 ─────────────
create table public.applications (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  parent_id     uuid references public.parents(id) on delete set null,
  mode          onvi_mode not null default 'undecided',
  status        onvi_app_status not null default 'draft',
  wanted_start  date,
  sibling_count int,
  message       text,
  submitted_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 5. consult_requests : 상담신청 (비로그인 허용) ──────────
create table public.consult_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles(id) on delete set null,
  name           text not null,
  phone          text not null,
  email          text,
  relation       onvi_relation,
  region         text,
  parent_age_band text check (parent_age_band in ('60대','70대','80대','90대 이상','잘 모르겠어요')),
  parent_living   onvi_living not null default 'unknown',
  sibling_count   int,
  method_pref     onvi_mode not null default 'undecided',
  source          text,                    -- 알게 된 경로
  message         text,
  status          onvi_consult_status not null default 'new',
  assigned_to     uuid references public.profiles(id) on delete set null,
  admin_memo      text,
  contacted_at    timestamptz,
  purge_after     date not null default (current_date + interval '6 months'),
  created_at      timestamptz not null default now()
);
comment on column public.consult_requests.purge_after is '미전환 상담신청 보관 만료일 — 배치로 파기';

-- ── 6. consents : 동의 이력 (필수/마케팅 분리 기록) ─────────
create table public.consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  consult_id  uuid references public.consult_requests(id) on delete cascade,
  parent_id   uuid references public.parents(id) on delete cascade,
  kind        onvi_consent_kind not null,
  version     text not null,               -- 약관 버전 (예: 'privacy-2026-08')
  granted     boolean not null,
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  channel     text,                        -- 'web' | 'phone' | 'paper'
  ip          inet,
  user_agent  text,
  constraint consent_subject_present check (
    user_id is not null or consult_id is not null or parent_id is not null
  )
);

-- ── 7. retention_notices : 연 1회 보관 안내 발송 이력 ───────
create table public.retention_notices (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null default 'annual_keep_notice',
  sent_at    timestamptz not null default now(),
  channel    text not null default 'email'
);

-- ── 8. admin_users : 관리 화면 접근 ─────────────────────────
create table public.admin_users (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  role       text not null default 'staff' check (role in ('staff','lead','owner')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.in_household(h uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members
    where household_id = h and user_id = auth.uid()
  );
$$;

-- ── RLS ─────────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.parents           enable row level security;
alter table public.parent_addresses  enable row level security;
alter table public.applications      enable row level security;
alter table public.consult_requests  enable row level security;
alter table public.consents          enable row level security;
alter table public.retention_notices enable row level security;
alter table public.admin_users        enable row level security;

create policy profiles_self on public.profiles
  for all using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy households_member on public.households
  for select using (public.in_household(id) or public.is_admin());
create policy households_insert on public.households
  for insert with check (owner_id = auth.uid());
create policy households_owner_update on public.households
  for update using (owner_id = auth.uid() or public.is_admin());

create policy members_read on public.household_members
  for select using (public.in_household(household_id) or public.is_admin());
create policy members_join on public.household_members
  for insert with check (user_id = auth.uid());

create policy invites_household on public.household_invites
  for all using (public.in_household(household_id) or public.is_admin())
  with check (public.in_household(household_id));

create policy parents_household on public.parents
  for all using (public.in_household(household_id) or public.is_admin())
  with check (public.in_household(household_id));

create policy addresses_household on public.parent_addresses
  for all using (
    public.is_admin() or exists (
      select 1 from public.parents p where p.id = parent_id and public.in_household(p.household_id)
    )
  ) with check (
    exists (select 1 from public.parents p where p.id = parent_id and public.in_household(p.household_id))
  );

create policy applications_household on public.applications
  for all using (public.in_household(household_id) or public.is_admin())
  with check (public.in_household(household_id));

-- 상담신청: 누구나 넣을 수 있고, 읽는 건 관리자(또는 본인)만
create policy consult_insert_anon on public.consult_requests
  for insert to anon, authenticated with check (true);
create policy consult_read_admin on public.consult_requests
  for select using (public.is_admin() or user_id = auth.uid());
create policy consult_update_admin on public.consult_requests
  for update using (public.is_admin());

create policy consents_insert_open on public.consents
  for insert to anon, authenticated with check (true);
create policy consents_read on public.consents
  for select using (public.is_admin() or user_id = auth.uid());

create policy notices_read on public.retention_notices
  for select using (public.is_admin() or user_id = auth.uid());

create policy admin_self_read on public.admin_users
  for select using (user_id = auth.uid() or public.is_admin());

-- ── 인덱스 ──────────────────────────────────────────────────
create index on public.household_members (user_id);
create index on public.parents (household_id);
create index on public.applications (household_id, status);
create index on public.consult_requests (status, created_at desc);
create index on public.consult_requests (purge_after);
create index on public.consents (user_id, kind);
create index on public.profiles (last_seen_at);

-- ── 보관 정책 배치 (pg_cron 사용 시) ────────────────────────
-- 1) 미전환 상담신청 파기
--   delete from public.consult_requests
--   where status in ('new','contacted','closed') and purge_after < current_date;
-- 2) 연 1회 간직 안내 대상 조회 (메일 발송은 Edge Function에서)
--   select p.id, p.email from public.profiles p
--   left join public.retention_notices n
--     on n.user_id = p.id and n.sent_at > now() - interval '1 year'
--   where p.last_seen_at < now() - interval '1 year' and n.id is null and p.email is not null;
