// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// CONFIGURATION
// =============================================================================

const ALLOWED_ORIGINS = [
  "https://app.myk9q.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
];

const CLAUDE_MODEL = "claude-3-5-haiku-20241022";
const MAX_TOKENS = 1024;

// =============================================================================
// TYPES
// =============================================================================

interface ChatRequest {
  message: string;
  licenseKey: string;
  organizationCode?: string;
  sportCode?: string;
}

interface ChatResponse {
  answer: string;
  toolsUsed: string[];
  sources?: {
    rules?: Rule[];
    classes?: ClassSummary[];
    entries?: EntryResult[];
    trials?: TrialSummary[];
  };
}

interface Rule {
  id: string;
  section: string;
  title: string;
  content: string;
  categories: { level?: string; element?: string };
  keywords: string[];
  measurements: Record<string, unknown>;
}

interface ClassSummary {
  class_id: number;
  element: string;
  level: string;
  section: string | null;
  judge_name: string | null;
  class_status: string;
  total_entries: number;
  scored_entries: number;
  checked_in_count: number;
  qualified_count: number;
  nq_count: number;
  trial_date: string;
  trial_name: string;
  briefing_time: string | null;
  start_time: string | null;
}

interface EntryResult {
  armband_number: string;
  call_name: string;
  handler: string;
  entry_status: string;
  result_status: string | null;
  time: number | null;
  faults: number | null;
  placement: number | null;
  is_scored: boolean;
  element: string;
  level: string;
}

interface TrialSummary {
  trial_id: string;
  trial_number: number;
  trial_date: string;
  trial_name: string;
  competition_type: string;
  show_name: string;
}

// Claude tool definitions
interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

// =============================================================================
// CORS HANDLING
// =============================================================================

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin =
    requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

const TOOLS: ToolDefinition[] = [
  {
    name: "search_rules",
    description:
      "Search the rulebook for regulations, requirements, time limits, area sizes, hide counts, or procedures. Use for ANY question about rules or regulations.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query for finding rules",
        },
        level: {
          type: "string",
          enum: ["Novice", "Advanced", "Excellent", "Master"],
          description: "Filter by competition level if mentioned",
        },
        element: {
          type: "string",
          enum: ["Container", "Interior", "Exterior", "Buried"],
          description: "Filter by element type if mentioned",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_class_summary",
    description:
      "Get summary of classes including entry counts, status, judges, and scoring progress. Use for questions about class schedules, how many dogs are entered, which classes are running, judges, etc.",
    input_schema: {
      type: "object",
      properties: {
        trial_date: {
          type: "string",
          description: "Filter by trial date (YYYY-MM-DD format)",
        },
        element: {
          type: "string",
          description: "Filter by element (e.g., Interior, Exterior, Container, Buried)",
        },
        level: {
          type: "string",
          description: "Filter by level (e.g., Novice, Advanced, Excellent, Master)",
        },
        class_status: {
          type: "string",
          enum: ["no-status", "setup", "briefing", "break", "in_progress", "completed"],
          description: "Filter by class status",
        },
      },
      required: [],
    },
  },
  {
    name: "get_entry_results",
    description:
      "Get entry results including placements, times, faults, and qualification status. Use for questions about results, placements, times, scores, who qualified, or specific dog/handler performance.",
    input_schema: {
      type: "object",
      properties: {
        element: {
          type: "string",
          description: "Filter by element (e.g., Interior, Exterior)",
        },
        level: {
          type: "string",
          description: "Filter by level (e.g., Novice, Master)",
        },
        armband_number: {
          type: "string",
          description: "Filter by armband number",
        },
        handler_name: {
          type: "string",
          description: "Filter by handler name (partial match)",
        },
        dog_name: {
          type: "string",
          description: "Filter by dog call name (partial match)",
        },
        result_status: {
          type: "string",
          enum: ["qualified", "nq", "absent", "excused"],
          description: "Filter by result status",
        },
        top_n: {
          type: "number",
          description: "Get top N placements (e.g., 3 for top 3)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_trial_overview",
    description:
      "Get overview of trials including dates, names, and competition types. Use for questions about trial schedule, what trials are happening, or general event info.",
    input_schema: {
      type: "object",
      properties: {
        trial_date: {
          type: "string",
          description: "Filter by specific date (YYYY-MM-DD)",
        },
      },
      required: [],
    },
  },
  {
    name: "search_entries",
    description:
      "Search for entries across all classes by dog name or handler name. Use when user asks about a specific dog or handler's entries or performance across multiple classes.",
    input_schema: {
      type: "object",
      properties: {
        dog_name: {
          type: "string",
          description: "Dog call name to search (partial match)",
        },
        handler_name: {
          type: "string",
          description: "Handler name to search (partial match)",
        },
      },
      required: [],
    },
  },
];

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

/**
 * Search rules using PostgreSQL full-text search (ported from search-rules-v2)
 */
async function executeSearchRules(
  params: { query: string; level?: string; element?: string },
  supabase: ReturnType<typeof createClient>,
  organizationCode?: string,
  sportCode?: string
): Promise<{ data: Rule[]; error?: string }> {
  try {
    let query = supabase
      .from("rules")
      .select(`
        id,
        section,
        title,
        content,
        categories,
        keywords,
        measurements,
        rulebooks!inner(
          id,
          active,
          rule_organizations!inner(code),
          rule_sports!inner(code)
        )
      `);

    // Filter by active rulebook
    query = query.eq("rulebooks.active", true);

    // Filter by organization and sport
    if (organizationCode) {
      query = query.eq("rulebooks.rule_organizations.code", organizationCode);
    }
    if (sportCode) {
      query = query.eq("rulebooks.rule_sports.code", sportCode);
    }

    // Apply level/element filters
    if (params.level) {
      query = query.eq("categories->>level", params.level);
    }
    if (params.element) {
      query = query.eq("categories->>element", params.element);
    }

    // Full-text search
    if (params.query && params.query.trim().length > 0) {
      query = query.textSearch("search_vector", params.query, {
        type: "websearch",
        config: "english",
      });
    }

    query = query.limit(5);

    const { data, error } = await query;

    if (error) {
      console.error("Rules search error:", error);
      return { data: [], error: error.message };
    }

    return { data: data || [] };
  } catch (err) {
    console.error("Rules search exception:", err);
    return { data: [], error: String(err) };
  }
}

/**
 * Get class summary data
 */
async function executeGetClassSummary(
  params: {
    trial_date?: string;
    element?: string;
    level?: string;
    class_status?: string;
  },
  supabase: ReturnType<typeof createClient>,
  licenseKey: string
): Promise<{ data: ClassSummary[]; error?: string }> {
  try {
    let query = supabase
      .from("view_class_summary")
      .select(`
        class_id,
        element,
        level,
        section,
        judge_name,
        class_status,
        total_entries,
        scored_entries,
        checked_in_count,
        qualified_count,
        nq_count,
        trial_date,
        trial_name,
        briefing_time,
        start_time
      `)
      .eq("license_key", licenseKey);

    if (params.trial_date) {
      query = query.eq("trial_date", params.trial_date);
    }
    if (params.element) {
      query = query.ilike("element", `%${params.element}%`);
    }
    if (params.level) {
      query = query.ilike("level", `%${params.level}%`);
    }
    if (params.class_status) {
      query = query.eq("class_status", params.class_status);
    }

    query = query.order("trial_date").order("class_order").limit(50);

    const { data, error } = await query;

    if (error) {
      console.error("Class summary error:", error);
      return { data: [], error: error.message };
    }

    return { data: data || [] };
  } catch (err) {
    console.error("Class summary exception:", err);
    return { data: [], error: String(err) };
  }
}

/**
 * Get entry results
 */
async function executeGetEntryResults(
  params: {
    element?: string;
    level?: string;
    armband_number?: string;
    handler_name?: string;
    dog_name?: string;
    result_status?: string;
    top_n?: number;
  },
  supabase: ReturnType<typeof createClient>,
  licenseKey: string
): Promise<{ data: EntryResult[]; error?: string }> {
  try {
    let query = supabase
      .from("view_entry_with_results")
      .select(`
        armband_number,
        call_name,
        handler,
        entry_status,
        result_status,
        time,
        faults,
        placement,
        is_scored,
        element,
        level
      `)
      .eq("license_key", licenseKey);

    if (params.element) {
      query = query.ilike("element", `%${params.element}%`);
    }
    if (params.level) {
      query = query.ilike("level", `%${params.level}%`);
    }
    if (params.armband_number) {
      query = query.eq("armband_number", params.armband_number);
    }
    if (params.handler_name) {
      query = query.ilike("handler", `%${params.handler_name}%`);
    }
    if (params.dog_name) {
      query = query.ilike("call_name", `%${params.dog_name}%`);
    }
    if (params.result_status) {
      query = query.eq("result_status", params.result_status);
    }
    if (params.top_n) {
      query = query.not("placement", "is", null).lte("placement", params.top_n);
    }

    // Order by placement (nulls last), then by time
    query = query
      .order("placement", { ascending: true, nullsFirst: false })
      .order("time", { ascending: true, nullsFirst: false })
      .limit(30);

    const { data, error } = await query;

    if (error) {
      console.error("Entry results error:", error);
      return { data: [], error: error.message };
    }

    return { data: data || [] };
  } catch (err) {
    console.error("Entry results exception:", err);
    return { data: [], error: String(err) };
  }
}

/**
 * Get trial overview
 */
async function executeGetTrialOverview(
  params: { trial_date?: string },
  supabase: ReturnType<typeof createClient>,
  licenseKey: string
): Promise<{ data: TrialSummary[]; error?: string }> {
  try {
    let query = supabase
      .from("view_trial_summary_normalized")
      .select(`
        trial_id,
        trial_number,
        trial_date,
        trial_name,
        competition_type,
        show_name
      `)
      .eq("license_key", licenseKey);

    if (params.trial_date) {
      query = query.eq("trial_date", params.trial_date);
    }

    query = query.order("trial_date").order("trial_number").limit(20);

    const { data, error } = await query;

    if (error) {
      console.error("Trial overview error:", error);
      return { data: [], error: error.message };
    }

    return { data: data || [] };
  } catch (err) {
    console.error("Trial overview exception:", err);
    return { data: [], error: String(err) };
  }
}

/**
 * Search entries by dog or handler name across all classes
 */
async function executeSearchEntries(
  params: { dog_name?: string; handler_name?: string },
  supabase: ReturnType<typeof createClient>,
  licenseKey: string
): Promise<{ data: EntryResult[]; error?: string }> {
  try {
    if (!params.dog_name && !params.handler_name) {
      return { data: [], error: "Must provide dog_name or handler_name" };
    }

    let query = supabase
      .from("view_entry_with_results")
      .select(`
        armband_number,
        call_name,
        handler,
        entry_status,
        result_status,
        time,
        faults,
        placement,
        is_scored,
        element,
        level
      `)
      .eq("license_key", licenseKey);

    if (params.dog_name) {
      query = query.ilike("call_name", `%${params.dog_name}%`);
    }
    if (params.handler_name) {
      query = query.ilike("handler", `%${params.handler_name}%`);
    }

    query = query.order("element").order("level").limit(30);

    const { data, error } = await query;

    if (error) {
      console.error("Search entries error:", error);
      return { data: [], error: error.message };
    }

    return { data: data || [] };
  } catch (err) {
    console.error("Search entries exception:", err);
    return { data: [], error: String(err) };
  }
}

// =============================================================================
// TOOL EXECUTION DISPATCHER
// =============================================================================

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  licenseKey: string,
  organizationCode?: string,
  sportCode?: string
): Promise<{ result: unknown; error?: string }> {
  console.log(`Executing tool: ${toolName}`, JSON.stringify(toolInput));

  switch (toolName) {
    case "search_rules":
      return executeSearchRules(
        toolInput as { query: string; level?: string; element?: string },
        supabase,
        organizationCode,
        sportCode
      ).then((r) => ({ result: r.data, error: r.error }));

    case "get_class_summary":
      return executeGetClassSummary(
        toolInput as {
          trial_date?: string;
          element?: string;
          level?: string;
          class_status?: string;
        },
        supabase,
        licenseKey
      ).then((r) => ({ result: r.data, error: r.error }));

    case "get_entry_results":
      return executeGetEntryResults(
        toolInput as {
          element?: string;
          level?: string;
          armband_number?: string;
          handler_name?: string;
          dog_name?: string;
          result_status?: string;
          top_n?: number;
        },
        supabase,
        licenseKey
      ).then((r) => ({ result: r.data, error: r.error }));

    case "get_trial_overview":
      return executeGetTrialOverview(
        toolInput as { trial_date?: string },
        supabase,
        licenseKey
      ).then((r) => ({ result: r.data, error: r.error }));

    case "search_entries":
      return executeSearchEntries(
        toolInput as { dog_name?: string; handler_name?: string },
        supabase,
        licenseKey
      ).then((r) => ({ result: r.data, error: r.error }));

    default:
      return { result: null, error: `Unknown tool: ${toolName}` };
  }
}

// =============================================================================
// CLAUDE API INTEGRATION
// =============================================================================

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | ClaudeContentBlock[];
}

interface ClaudeContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

async function callClaude(
  messages: ClaudeMessage[],
  anthropicKey: string,
  tools: ToolDefinition[]
): Promise<{
  content: ClaudeContentBlock[];
  stop_reason: string;
}> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      tools,
      messages,
      system: `You are myK9Q Assistant, a helpful AI that answers questions about dog show events and competition rules.

IMPORTANT GUIDELINES:
1. Use the available tools to find accurate information before answering.
2. For questions about rules, time limits, area sizes, or regulations - use search_rules.
3. For questions about classes, entry counts, or class status - use get_class_summary.
4. For questions about results, placements, or scores - use get_entry_results.
5. For questions about trial schedule - use get_trial_overview.
6. For questions about specific dogs or handlers - use search_entries.

RESPONSE STYLE:
- Be concise and direct (1-3 sentences for simple questions)
- Include specific numbers and data from the tools
- If data shows no results, say so clearly
- Don't make up information not in the tool results

For numerical data from rules (time limits, area sizes, hide counts), ALWAYS use the "measurements" field from the rules data, not numbers mentioned in the descriptive text.`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Claude API error:", errorText);
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

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

    // Parse request
    const {
      message,
      licenseKey,
      organizationCode,
      sportCode,
    }: ChatRequest = await req.json();

    // Validate required fields
    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!licenseKey) {
      return new Response(
        JSON.stringify({ error: "License key is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize conversation with user message
    const messages: ClaudeMessage[] = [{ role: "user", content: message }];

    const toolsUsed: string[] = [];
    const sources: ChatResponse["sources"] = {};

    // Call Claude with tools
    console.log("Calling Claude with message:", message);
    let response = await callClaude(messages, anthropicKey, TOOLS);
    console.log("Claude response:", JSON.stringify(response, null, 2));

    // Process tool calls in a loop (Claude may call multiple tools)
    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (block) => block.type === "tool_use"
      );

      // Add assistant's response (with tool calls) to messages
      messages.push({ role: "assistant", content: response.content });

      // Execute each tool and collect results
      const toolResults: ClaudeContentBlock[] = [];

      for (const toolUse of toolUseBlocks) {
        if (toolUse.type !== "tool_use" || !toolUse.name || !toolUse.id) {
          continue;
        }

        toolsUsed.push(toolUse.name);

        const { result, error } = await executeTool(
          toolUse.name,
          toolUse.input || {},
          supabase,
          licenseKey,
          organizationCode,
          sportCode
        );

        // Store sources for response
        if (!error && result) {
          switch (toolUse.name) {
            case "search_rules":
              sources.rules = result as Rule[];
              break;
            case "get_class_summary":
              sources.classes = result as ClassSummary[];
              break;
            case "get_entry_results":
            case "search_entries":
              sources.entries = result as EntryResult[];
              break;
            case "get_trial_overview":
              sources.trials = result as TrialSummary[];
              break;
          }
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: error
            ? JSON.stringify({ error })
            : JSON.stringify(result),
        });
      }

      // Add tool results to messages
      messages.push({ role: "user", content: toolResults });

      // Call Claude again with tool results
      console.log("Calling Claude with tool results...");
      response = await callClaude(messages, anthropicKey, TOOLS);
      console.log("Claude response:", JSON.stringify(response, null, 2));
    }

    // Extract final text answer
    const textBlock = response.content.find((block) => block.type === "text");
    const answer = textBlock?.text || "I couldn't generate a response.";

    // Log query for analytics (fire-and-forget)
    supabase
      .from("chatbot_query_log")
      .insert({
        query: message,
        tools_used: toolsUsed,
        license_key: licenseKey,
        organization_code: organizationCode || null,
        sport_code: sportCode || null,
      })
      .then(() => console.log("Query logged"))
      .catch((err: Error) => console.log("Query log skipped:", err.message));

    // Return response
    const chatResponse: ChatResponse = {
      answer,
      toolsUsed: [...new Set(toolsUsed)], // Dedupe
      sources:
        Object.keys(sources).length > 0 ? sources : undefined,
    };

    return new Response(JSON.stringify(chatResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ask-myk9q function:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
