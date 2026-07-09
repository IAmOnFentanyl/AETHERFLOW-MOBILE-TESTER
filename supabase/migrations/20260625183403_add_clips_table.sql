/*
# Add clips table

Converts timeline clips from ephemeral UI state into persisted project objects.

## New Table: clips
Each row represents one audio clip placed on a track's timeline.

Columns:
- id            uuid PK — stable identifier referenced by UI state
- track_id      uuid FK → tracks(id)  — which track this clip belongs to
- project_id    uuid FK → projects(id) — denormalised for efficient per-project queries
- user_id       uuid FK → auth.users, DEFAULT auth.uid()
- label         text — display name shown inside the clip
- file_path     text nullable — local file URI or remote URL of the audio file
- start_bar     numeric — start position in bars (fractional allowed, e.g. 2.5)
- duration_bars numeric — length in bars
- duration_ms   integer — actual audio duration in milliseconds
- waveform_data float[] — array of normalised amplitude values (0–1) sampled across the clip, used to render the waveform thumbnail
- color         text nullable — override the track colour for this clip
- source_type   text — 'audio' | 'vocal' | 'midi' | 'loop'
- created_at    timestamptz

## Security
- RLS enabled, owner-scoped CRUD (auth.uid() = user_id).

## Notes
1. waveform_data is stored as a float array so no secondary table is needed.
2. file_path is nullable to support placeholder/MIDI clips with no audio file.
3. start_bar uses numeric to allow sub-bar precision without floating-point drift.
*/

CREATE TABLE IF NOT EXISTS clips (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id      uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label         text NOT NULL DEFAULT '',
  file_path     text,
  start_bar     numeric NOT NULL DEFAULT 0,
  duration_bars numeric NOT NULL DEFAULT 2,
  duration_ms   integer NOT NULL DEFAULT 0,
  waveform_data float[] NOT NULL DEFAULT '{}',
  color         text,
  source_type   text NOT NULL DEFAULT 'audio',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clips_track_id_idx     ON clips(track_id);
CREATE INDEX IF NOT EXISTS clips_project_id_idx   ON clips(project_id);
CREATE INDEX IF NOT EXISTS clips_user_id_idx      ON clips(user_id);

ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_clips" ON clips;
CREATE POLICY "select_own_clips" ON clips FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_clips" ON clips;
CREATE POLICY "insert_own_clips" ON clips FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_clips" ON clips;
CREATE POLICY "update_own_clips" ON clips FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_clips" ON clips;
CREATE POLICY "delete_own_clips" ON clips FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
