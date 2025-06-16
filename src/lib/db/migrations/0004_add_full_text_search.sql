-- Add full-text search capabilities to messages table
-- This uses PostgreSQL's built-in full-text search features

-- Add tsvector column for full-text search
ALTER TABLE "messages" ADD COLUMN "search_vector" tsvector;

-- Create function to update search vector automatically
CREATE OR REPLACE FUNCTION update_messages_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
CREATE TRIGGER update_messages_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "messages"
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_search_vector();

-- Create GIN index for fast full-text search
CREATE INDEX "messages_search_vector_idx" ON "messages" USING gin("search_vector");

-- Update existing records to populate search_vector
UPDATE "messages" SET search_vector = to_tsvector('english', COALESCE(content, ''));

-- Add full-text search index for chat titles as well
CREATE INDEX "chats_title_gin_idx" ON "chats" USING gin(to_tsvector('english', title));