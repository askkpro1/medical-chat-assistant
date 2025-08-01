-- Enable pgvector extension (for semantic search support)
create extension if not exists vector;

-- ========================================
-- TABLE 1: Chat Logs (user ↔ assistant)
-- ========================================
create table if not exists chat_logs (
    id uuid primary key default gen_random_uuid(),
    question text not null,
    answer text not null,
    created_at timestamp default now()
);

-- ========================================
-- TABLE 2: Symptom Knowledge Base (Optional)
-- For storing pre-curated symptom-response entries
-- + vector embeddings for semantic search
-- ========================================
create table if not exists symptom_knowledge (
    id uuid primary key default gen_random_uuid(),
    symptom text not null,
    response text not null,
    embedding vector(1536)  -- match OpenAI embedding dimension
);

-- ========================================
-- Indexes (Recommended)
-- ========================================
-- Fast similarity search on symptom embeddings
create index if not exists idx_symptom_embedding 
on symptom_knowledge using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Fast sorting/searching of chat logs
create index if not exists idx_chat_created_at 
on chat_logs (created_at desc);
