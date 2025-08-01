-- Add new columns to chat_logs table for enhanced tracking
alter table chat_logs 
add column if not exists severity text default 'low',
add column if not exists is_emergency boolean default false,
add column if not exists user_ip text,
add column if not exists response_time timestamp,
add column if not exists context_length integer default 0,
add column if not exists feedback text check (feedback in ('positive', 'negative'));

-- Create indexes for better performance
create index if not exists idx_chat_severity on chat_logs (severity);
create index if not exists idx_chat_emergency on chat_logs (is_emergency);
create index if not exists idx_chat_feedback on chat_logs (feedback);

-- Create user sessions table for tracking
create table if not exists user_sessions (
    id uuid primary key default gen_random_uuid(),
    session_id text unique not null,
    user_ip text,
    first_visit timestamp default now(),
    last_activity timestamp default now(),
    total_messages integer default 0,
    emergency_alerts integer default 0
);

-- Create analytics table for aggregated data
create table if not exists daily_analytics (
    id uuid primary key default gen_random_uuid(),
    date date unique not null,
    total_chats integer default 0,
    emergency_alerts integer default 0,
    unique_users integer default 0,
    avg_response_time float default 0,
    satisfaction_score float default 0,
    created_at timestamp default now()
);

-- Function to update daily analytics
create or replace function update_daily_analytics()
returns trigger as $$
begin
    insert into daily_analytics (date, total_chats, emergency_alerts)
    values (current_date, 1, case when new.is_emergency then 1 else 0 end)
    on conflict (date) do update set
        total_chats = daily_analytics.total_chats + 1,
        emergency_alerts = daily_analytics.emergency_alerts + case when new.is_emergency then 1 else 0 end;
    return new;
end;
$$ language plpgsql;

-- Trigger to automatically update analytics
create trigger if not exists trigger_update_analytics
    after insert on chat_logs
    for each row execute function update_daily_analytics();
