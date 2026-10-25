ALTER TABLE "Content" ADD COLUMN visibility TEXT NOT NULL DEFAULT 'PUBLIC', ADD COLUMN instructor TEXT NOT NULL DEFAULT '', ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'BASIC';
ALTER TABLE "Content" ADD CONSTRAINT content_visibility_check CHECK (visibility IN ('PUBLIC','PRIVATE'));
CREATE INDEX content_public_index ON "Content" (status,visibility,kind);
