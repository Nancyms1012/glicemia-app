-- =====================================================================
-- SugarTrack - Esquema y seguridad (Supabase)
-- Ejecutar en: Supabase > SQL Editor > New query > Run
--
-- Es SEGURO de ejecutar varias veces:
--   * No borra tablas ni datos.
--   * Si la tabla "registros" ya existe, no se modifica (solo se asegura RLS).
--   * Reemplaza las políticas por reglas "cada usuario solo ve lo suyo".
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) DIAGNÓSTICO (opcional, solo lectura): ver el estado ANTES de aplicar
-- ---------------------------------------------------------------------
-- select tablename, rowsecurity as rls_activado
--   from pg_tables where schemaname = 'public' and tablename in ('registros','recordatorios');
-- select tablename, policyname, cmd, roles, qual
--   from pg_policies where schemaname = 'public' and tablename in ('registros','recordatorios');

-- ---------------------------------------------------------------------
-- 1) Tabla registros (solo se crea si NO existe; la actual no se toca)
-- ---------------------------------------------------------------------
create table if not exists public.registros (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  fecha          date not null,
  hora           time not null,
  valor          numeric,
  momento        text,
  insulina       text,
  dosis_insulina numeric,
  notas          text,
  creado_en      timestamptz not null default now()
);

create index if not exists registros_user_fecha_idx
  on public.registros (user_id, fecha desc, hora desc);

-- ---------------------------------------------------------------------
-- 2) Tabla recordatorios (NUEVA: hoy no existe y por eso no se guardan)
--    La app hace upsert por user_id, por eso user_id es la llave primaria.
-- ---------------------------------------------------------------------
create table if not exists public.recordatorios (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  horarios       jsonb not null default '[]'::jsonb,
  activados      boolean not null default false,
  actualizado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3) Seguridad: RLS activado + políticas "solo el dueño"
-- ---------------------------------------------------------------------
alter table public.registros     enable row level security;
alter table public.recordatorios enable row level security;

-- Quitar TODAS las políticas anteriores de estas dos tablas (por si alguna era
-- demasiado abierta) y dejar solo las del dueño.
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('registros','recordatorios')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy "registros_select_propios" on public.registros
  for select to authenticated using (auth.uid() = user_id);
create policy "registros_insert_propios" on public.registros
  for insert to authenticated with check (auth.uid() = user_id);
create policy "registros_update_propios" on public.registros
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "registros_delete_propios" on public.registros
  for delete to authenticated using (auth.uid() = user_id);

create policy "recordatorios_select_propios" on public.recordatorios
  for select to authenticated using (auth.uid() = user_id);
create policy "recordatorios_insert_propios" on public.recordatorios
  for insert to authenticated with check (auth.uid() = user_id);
create policy "recordatorios_update_propios" on public.recordatorios
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recordatorios_delete_propios" on public.recordatorios
  for delete to authenticated using (auth.uid() = user_id);

-- Sin sesión (rol anon) no se otorga ningún acceso a estas tablas.
revoke all on public.registros     from anon;
revoke all on public.recordatorios from anon;

-- ---------------------------------------------------------------------
-- 4) VERIFICACIÓN (debe mostrar rls_activado = true en ambas)
-- ---------------------------------------------------------------------
select tablename, rowsecurity as rls_activado
  from pg_tables
 where schemaname = 'public' and tablename in ('registros','recordatorios');
