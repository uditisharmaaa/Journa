import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://alacpsyfthxjxvkguvcx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsYWNwc3lmdGh4anh2a2d1dmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDgxMTEsImV4cCI6MjA2Njc4NDExMX0.8-Q4qKwkzkvupJbvHQLvkqgOlZ3YfJPtxrQNuc4pAbo'

export const supabase = createClient(supabaseUrl, supabaseKey)
