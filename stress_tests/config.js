// ============================================
// CONFIGURATION - myK9Qv3 Stress Tests
// ============================================

export const CONFIG = {
  // Supabase project URL
  SUPABASE_URL: 'https://yyzgjyiqgmjzyhzkqdfx.supabase.co',

  // Supabase anon/public key
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5emdqeWlxZ21qenloemtxZGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjYzMzIsImV4cCI6MjA3MDYwMjMzMn0.vXgwI9HyBMiH-t6WP13unRgFVc9rg3khDRNdhIedWqs',

  // Table names for myK9Qv3 (entries table contains scores - merged schema)
  TABLES: {
    shows: 'shows',
    trials: 'trials',
    classes: 'classes',
    entries: 'entries',  // Contains both entry data AND scoring data
  },

  // Test data - use a real license_key from your shows table
  // IMPORTANT: Create a dedicated test show to avoid polluting real data
  TEST_LICENSE_KEY: 'myK9Q1-a260f472-e0d76a33-4b6c264c',

  // A valid class ID for testing (from a test show)
  TEST_CLASS_ID: 254,

  // Entry IDs in class 254 for cycling through during score submission tests
  // This simulates multiple judges scoring different dogs concurrently
  TEST_ENTRY_IDS: [
    11419, // Daisy (106)
    739,   // Laila (107)
    740,   // Rolo (110)
    741,   // Stormy (126)
    742,   // Bourbon (141)
    743,   // Allen (143)
    744,   // Ellie (145)
    11549, // River (151)
    745,   // Reveille (155)
    746,   // Poppy (157)
    752,   // Annie Oakley (159)
    747,   // Scooter (166)
    748,   // Stryker (168)
    750,   // Gabby (177)
    749,   // Stella (186)
    751,   // Marlee (192)
  ],
};

// ============================================
// Load test scenarios - adjust as needed
// ============================================

export const SCENARIOS = {
  // Light load - normal usage
  light: {
    vus: 10,
    duration: '1m',
  },
  
  // Medium load - busy trial
  medium: {
    vus: 50,
    duration: '3m',
  },
  
  // Heavy load - national championship "results posted" moment
  heavy: {
    vus: 200,
    duration: '5m',
  },
  
  // Spike test - sudden surge
  spike: {
    stages: [
      { duration: '30s', target: 10 },   // Warm up
      { duration: '10s', target: 200 },  // Spike!
      { duration: '1m', target: 200 },   // Hold
      { duration: '30s', target: 10 },   // Cool down
    ],
  },
  
  // Soak test - extended duration (find memory leaks)
  soak: {
    vus: 20,
    duration: '30m',
  },
};
