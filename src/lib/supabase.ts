import { createClient } from '@supabase/supabase-js'

// Ganti string kosong ini dengan credentials dari dashboard Supabase kamu
const supabaseUrl = 'https://knbadocvjtkbnrmrngjg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuYmFkb2N2anRrYm5ybXJuZ2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MjE3NzQsImV4cCI6MjA3NzE5Nzc3NH0.F8xv7IDV0zQh3W7OC1YFXZFYZov431bZM3v87Yi_D8Q'

export const supabase = createClient(supabaseUrl, supabaseKey)