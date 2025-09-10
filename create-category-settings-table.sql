-- Create category_settings table
CREATE TABLE IF NOT EXISTS public.category_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('habits', 'goals')),
    category_name VARCHAR(100) NOT NULL,
    category_order INTEGER DEFAULT 0,
    is_collapsed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, type, category_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_category_settings_user_type ON public.category_settings(user_id, type);
CREATE INDEX IF NOT EXISTS idx_category_settings_user_category ON public.category_settings(user_id, type, category_name);

-- Enable RLS (Row Level Security)
ALTER TABLE public.category_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own category settings" ON public.category_settings
    FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_category_settings_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_category_settings_updated_at 
    BEFORE UPDATE ON public.category_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_category_settings_updated_at_column();
