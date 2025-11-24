// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  query: string;
  limit?: number;
  level?: string;
  element?: string;
}

interface Rule {
  id: string;
  section: string;
  title: string;
  content: string;
  categories: {
    level?: string;
    element?: string;
  };
  keywords: string[];
  measurements: Record<string, any>;
}

interface QueryAnalysis {
  searchTerms: string;
  filters: {
    level?: string;
    element?: string;
  };
  intent: string;
}

/**
 * Use Claude Haiku to analyze the natural language query
 */
async function analyzeQuery(query: string, anthropicKey: string): Promise<QueryAnalysis> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are analyzing a query about AKC Scent Work rules. Extract:
1. Search terms: The SPECIFIC TOPIC being asked about (e.g., "area size", "time limit", "number of hides", "leash requirements")
2. Level filter: Extract if mentioned (Novice, Advanced, Excellent, or Master)
3. Element filter: Extract if mentioned (Container, Interior, Exterior, or Buried)
4. Intent: What the user wants to know

Query: "${query}"

Respond ONLY with valid JSON (no markdown):
{
  "searchTerms": "specific keywords for the topic",
  "filters": {
    "level": null,
    "element": null
  },
  "intent": "brief description"
}

Rules:
- searchTerms should be the SPECIFIC TOPIC, not generic phrases like "AKC rules"
- Extract level/element and set to the exact name (e.g., "Advanced", "Exterior")
- If not mentioned, leave as null
- Use exact capitalization: Novice, Advanced, Excellent, Master, Container, Interior, Exterior, Buried

Examples:
- "what is the area size for exterior advanced?" → searchTerms: "area size"
- "how many hides in master buried?" → searchTerms: "hides"
- "time limit for novice" → searchTerms: "time limit"`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Anthropic API error:", errorBody);
    throw new Error(`Claude API error: ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  console.log("Claude response:", content);

  // Extract JSON from response (Claude may wrap it in markdown)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  console.log("Parsed analysis:", JSON.stringify(parsed, null, 2));
  return parsed;
}

/**
 * Extract a concise answer from the found rules using Claude
 */
async function extractAnswer(
  query: string,
  rules: Rule[],
  anthropicKey: string
): Promise<string> {
  if (rules.length === 0) {
    return "No relevant rules found to answer this question.";
  }

  // Prepare rule context for Claude (include measurements if available)
  const ruleContext = rules.map((rule, idx) => {
    let context = `Rule ${idx + 1}: ${rule.title}\n${rule.content}`;

    // Add measurements if present
    if (rule.measurements && Object.keys(rule.measurements).length > 0) {
      context += "\n\nKey measurements:";
      Object.entries(rule.measurements).forEach(([key, value]) => {
        const labels: Record<string, string> = {
          min_area_sq_ft: 'Min Area',
          max_area_sq_ft: 'Max Area',
          time_limit_minutes: 'Time Limit',
          min_height_inches: 'Min Height',
          max_height_inches: 'Max Height',
          min_hides: 'Min Hides',
          max_hides: 'Max Hides',
          num_containers: 'Containers',
          max_leash_length_feet: 'Max Leash',
          warning_seconds: 'Warning Time',
        };
        const units: Record<string, string> = {
          min_area_sq_ft: ' sq ft',
          max_area_sq_ft: ' sq ft',
          time_limit_minutes: ' minutes',
          min_height_inches: ' inches',
          max_height_inches: ' inches',
          max_leash_length_feet: ' feet',
          warning_seconds: ' seconds',
        };
        const label = labels[key] || key;
        const unit = units[key] || '';
        context += `\n- ${label}: ${value}${unit}`;
      });
    }

    return context;
  }).join("\n\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are an AKC Scent Work rules expert. Answer this question concisely based on the provided rules.

Question: "${query}"

Rules:
${ruleContext}

Instructions:
1. Provide a DIRECT, SPECIFIC answer to the question (1-3 sentences max)
2. Include specific numbers, measurements, or requirements mentioned in the rules
3. Be concise but complete - give the exact information requested
4. If the question asks about multiple things, address each briefly
5. Do NOT just summarize the rules - extract the SPECIFIC answer to the question

Examples of good answers:
- "The time limit for Container Novice is 2 minutes."
- "Exterior Advanced has a search area between 400 and 1200 square feet, with 2 hides and one distraction."
- "Master level allows 1-4 hides, and the exact number is unknown to the handler."

Answer:`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("Failed to extract answer from Claude");
    return "Found relevant rules but couldn't extract a specific answer.";
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

/**
 * Search rules using PostgreSQL full-text search with filters
 */
async function searchRules(
  supabase: any,
  analysis: QueryAnalysis,
  limit: number = 5
): Promise<Rule[]> {
  // Build query with filters
  let query = supabase
    .from("rules")
    .select("id, section, title, content, categories, keywords, measurements");

  // Apply level filter if specified (use ->> for text comparison)
  if (analysis.filters.level) {
    query = query.eq("categories->>level", analysis.filters.level);
  }

  // Apply element filter if specified (use ->> for text comparison)
  if (analysis.filters.element) {
    query = query.eq("categories->>element", analysis.filters.element);
  }

  // Perform full-text search using PostgreSQL's websearch syntax
  if (analysis.searchTerms && analysis.searchTerms.trim().length > 0) {
    query = query.textSearch("search_vector", analysis.searchTerms, {
      type: "websearch",
      config: "english",
    });
  }

  // Limit results
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  // If no results with search terms, try again with just filters
  if ((!data || data.length === 0) && analysis.searchTerms && (analysis.filters.level || analysis.filters.element)) {
    console.log("No results with search terms, retrying with filters only");
    let fallbackQuery = supabase
      .from("rules")
      .select("id, section, title, content, categories, keywords, measurements");

    if (analysis.filters.level) {
      fallbackQuery = fallbackQuery.eq("categories->>level", analysis.filters.level);
    }
    if (analysis.filters.element) {
      fallbackQuery = fallbackQuery.eq("categories->>element", analysis.filters.element);
    }

    fallbackQuery = fallbackQuery.limit(limit);
    const fallbackResult = await fallbackQuery;

    if (!fallbackResult.error) {
      return fallbackResult.data || [];
    }
  }

  return data || [];
}

/**
 * Main Edge Function handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { query, limit = 5, level, element }: SearchRequest = await req.json();

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Analyze query with Claude Haiku
    console.log("Analyzing query:", query);
    const analysis = await analyzeQuery(query, anthropicKey);
    console.log("Query analysis:", JSON.stringify(analysis, null, 2));

    // Override filters if explicitly provided
    if (level) analysis.filters.level = level;
    if (element) analysis.filters.element = element;

    // Search rules in database
    console.log("Searching rules with filters:", analysis.filters);
    const rules = await searchRules(supabase, analysis, limit);
    console.log(`Found ${rules.length} rules`);

    // Extract specific answer from the found rules
    console.log("Extracting answer from rules...");
    const answer = await extractAnswer(query, rules, anthropicKey);
    console.log("Extracted answer:", answer);

    // Return results
    return new Response(
      JSON.stringify({
        query,
        analysis,
        answer,
        results: rules,
        count: rules.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in search-rules function:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
