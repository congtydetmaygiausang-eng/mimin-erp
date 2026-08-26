create table if not exists public.mau_da_thich (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    ma_sp text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, ma_sp)
);

-- Set up Row Level Security (RLS)
alter table public.mau_da_thich enable row level security;

-- Policies
create policy "Users can view their own liked samples"
    on public.mau_da_thich for select
    using (auth.uid() = user_id);

create policy "Users can insert their own liked samples"
    on public.mau_da_thich for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own liked samples"
    on public.mau_da_thich for delete
    using (auth.uid() = user_id);

-- Grants
grant select, insert, update, delete on public.mau_da_thich to authenticated;
grant select, insert, update, delete on public.mau_da_thich to service_role;
