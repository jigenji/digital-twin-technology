// =============================================================================
// OpenTwin Platform — Intelligence Layer (Palantir AIP equivalent)
// LLM-driven functions and AI agents that operate on the ontology
// =============================================================================

import { PropertyType } from '../ontology/types';
import { ParameterDef } from '../ontology/actions';

// ---------------------------------------------------------------------------
// AIFunction — LLM-powered computation over ontology data
// ---------------------------------------------------------------------------

export interface AIFunction {
  function_id: string;
  display_name: string;
  description: string;
  model: string;                  // e.g., 'claude-sonnet-4-20250514', 'gpt-4'
  system_prompt: string;
  inputs: ParameterDef[];
  output_type: PropertyType;
  temperature?: number;
  max_tokens?: number;
}

// ---------------------------------------------------------------------------
// AgentTool — A tool available to an AI agent
// ---------------------------------------------------------------------------

export interface AgentTool {
  tool_id: string;
  display_name: string;
  description: string;
  type: 'read' | 'write';        // read-only query vs write action
  ontology_ref: string;           // reference to OntologyFunction or OntologyAction
}

// ---------------------------------------------------------------------------
// AgentDefinition — An AI agent equipped with ontology-bound tools
// ---------------------------------------------------------------------------

export interface AgentDefinition {
  agent_id: string;
  display_name: string;
  description: string;
  model: string;
  system_prompt: string;
  tools: AgentTool[];
  allowed_object_types?: string[];  // restrict which types the agent can access
  max_iterations?: number;
}

// ---------------------------------------------------------------------------
// IntelligenceManager — Manages AI functions and agents
// ---------------------------------------------------------------------------

export class IntelligenceManager {
  private functions = new Map<string, AIFunction>();
  private agents = new Map<string, AgentDefinition>();

  register_function(fn: AIFunction): void {
    this.functions.set(fn.function_id, fn);
  }

  get_function(function_id: string): AIFunction | undefined {
    return this.functions.get(function_id);
  }

  list_functions(): AIFunction[] {
    return Array.from(this.functions.values());
  }

  register_agent(agent: AgentDefinition): void {
    this.agents.set(agent.agent_id, agent);
  }

  get_agent(agent_id: string): AgentDefinition | undefined {
    return this.agents.get(agent_id);
  }

  list_agents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }
}
