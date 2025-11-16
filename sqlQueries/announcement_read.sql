CREATE TABLE announcement_reads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, announcement_id)
);

-- Add index for faster queries
CREATE INDEX idx_announcement_reads_user ON announcement_reads(user_id);
CREATE INDEX idx_announcement_reads_announcement ON announcement_reads(announcement_id);