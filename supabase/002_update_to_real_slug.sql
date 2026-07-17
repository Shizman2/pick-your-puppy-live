-- Run this once in the Supabase SQL Editor.
-- Replaces the placeholder "sample-show" slug with a real, hard-to-guess
-- random one. This is the actual private URL you'll send to attendees.

update events
set slug = 'nr7jvrjhbk5c2rxihqswwu'
where slug = 'sample-show';
