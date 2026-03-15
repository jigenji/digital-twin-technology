// =============================================================================
// OpenTwin Platform — Business Logic: Rules
// Domain-agnostic condition→action rules evaluated against twin state
// =============================================================================

// ---------------------------------------------------------------------------
// RuleOperator — Comparison operators for conditions
// ---------------------------------------------------------------------------

export enum RuleOperator {
  EQ = 'eq',
  NEQ = 'neq',
  LT = 'lt',
  LTE = 'lte',
  GT = 'gt',
  GTE = 'gte',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  MATCHES = 'matches',
}

// ---------------------------------------------------------------------------
// RuleCondition — A single condition checked against a twin property
// ---------------------------------------------------------------------------

export interface RuleCondition {
  property_name: string;
  operator: RuleOperator;
  threshold: unknown;
}

// ---------------------------------------------------------------------------
// RuleActionType — What happens when a rule fires
// ---------------------------------------------------------------------------

export enum RuleActionType {
  UPDATE_PROPERTY = 'update_property',
  TRIGGER_ACTION = 'trigger_action',
  EMIT_ALERT = 'emit_alert',
  LOG = 'log',
  EXECUTE_WEBHOOK = 'execute_webhook',
}

// ---------------------------------------------------------------------------
// RuleAction — An action to perform when all conditions are met
// ---------------------------------------------------------------------------

export interface RuleAction {
  type: RuleActionType;
  params: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Rule — A complete condition→action rule
// ---------------------------------------------------------------------------

export interface Rule {
  rule_id: string;
  display_name: string;
  description?: string;
  target_type_id: string;        // which ObjectType this rule applies to
  conditions: RuleCondition[];   // AND-combined
  actions: RuleAction[];
  priority: number;              // higher = evaluated first
  cooldown_ms: number;           // minimum ms between firings per instance
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Condition evaluation
// ---------------------------------------------------------------------------

export function evaluate_condition(condition: RuleCondition, value: unknown): boolean {
  const { operator, threshold } = condition;

  switch (operator) {
    case RuleOperator.EQ:
      return value === threshold;
    case RuleOperator.NEQ:
      return value !== threshold;
    case RuleOperator.LT:
      return (value as number) < (threshold as number);
    case RuleOperator.LTE:
      return (value as number) <= (threshold as number);
    case RuleOperator.GT:
      return (value as number) > (threshold as number);
    case RuleOperator.GTE:
      return (value as number) >= (threshold as number);
    case RuleOperator.IN:
      return Array.isArray(threshold) && threshold.includes(value);
    case RuleOperator.NOT_IN:
      return Array.isArray(threshold) && !threshold.includes(value);
    case RuleOperator.CONTAINS:
      return typeof value === 'string' && value.includes(threshold as string);
    case RuleOperator.MATCHES:
      return typeof value === 'string' && new RegExp(threshold as string).test(value);
    default:
      return false;
  }
}
