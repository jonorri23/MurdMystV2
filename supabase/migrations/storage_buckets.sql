-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue_images', 'venue_images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('portraits', 'portraits', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to venue_images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'venue_images' );

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'venue_images' );

-- Policy to allow public access to portraits (if not already there)
CREATE POLICY "Public Access Portraits"
ON storage.objects FOR SELECT
USING ( bucket_id = 'portraits' );

CREATE POLICY "Public Upload Portraits"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'portraits' );
