-- Create pixelbuddy_state table
CREATE TABLE IF NOT EXISTS public.pixelbuddy_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT,
    head TEXT,
    clothes TEXT,
    accessory TEXT,
    hat TEXT,
    effect TEXT,
    inventory JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pixelbuddy_state_user_id ON public.pixelbuddy_state(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.pixelbuddy_state ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own pixelbuddy state" ON public.pixelbuddy_state
    FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_pixelbuddy_state_updated_at 
    BEFORE UPDATE ON public.pixelbuddy_state 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
