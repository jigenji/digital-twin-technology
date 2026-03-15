// =============================================================================
// OpenTwin Platform — Ontology Actions & Functions
// Foundry Action = write operation, Function = read-only computation
// =============================================================================

import { PropertyType } from './types';

// ---------------------------------------------------------------------------
// ParameterDef — Input parameter for Actions and Functions
// ---------------------------------------------------------------------------

export interface ParameterDef {
  name: string;
  type: PropertyType;
  description?: string;
  required?: boolean;
  default_value?: unknown;
}

// ---------------------------------------------------------------------------
// OntologyAction — Write operation on a twin (Foundry Action)
// "Move robot", "Stop machine", "Place order" — any command
// ---------------------------------------------------------------------------

export interface OntologyAction {
  action_id: string;
  display_name: string;
  description?: string;
  target_type_id: string;   // which ObjectType this action targets
  parameters: ParameterDef[];
  handler?: ActionHandler;
}

export type ActionHandler = (
  target_id: string,
  params: Record<string, unknown>,
) => Promise<ActionResult>;

export interface ActionResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

// ---------------------------------------------------------------------------
// OntologyFunction — Read-only computation (Foundry Function)
// "Calculate utilization", "Compute anomaly score" — any derived value
// ---------------------------------------------------------------------------

export interface OntologyFunction {
  function_id: string;
  display_name: string;
  description?: string;
  inputs: ParameterDef[];
  output_type: PropertyType;
  output_description?: string;
  compute?: FunctionCompute;
}

export type FunctionCompute = (
  inputs: Record<string, unknown>,
) => Promise<unknown>;
