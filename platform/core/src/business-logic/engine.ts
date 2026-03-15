// =============================================================================
// OpenTwin Platform — Business Logic: RuleEngine
// Listens to twin state changes and evaluates rules automatically
// =============================================================================

import { Rule, RuleAction, RuleActionType, evaluate_condition } from './rule';
import { AlertManager, AlertSeverity } from './alert';
import { TwinRegistry, TwinChangeEvent, TwinInstance } from '../ontology/twin';
import { OntologyRegistry } from '../ontology/registry';

// ---------------------------------------------------------------------------
// RuleEngine — Evaluates rules against twin state changes
// ---------------------------------------------------------------------------

export class RuleEngine {
  private rules: Rule[] = [];
  private last_fired = new Map<string, number>(); // "rule_id:instance_id" → timestamp
  private twin_registry: TwinRegistry;
  private ontology_registry: OntologyRegistry;
  private alert_manager: AlertManager;

  constructor(
    twin_registry: TwinRegistry,
    ontology_registry: OntologyRegistry,
    alert_manager: AlertManager,
  ) {
    this.twin_registry = twin_registry;
    this.ontology_registry = ontology_registry;
    this.alert_manager = alert_manager;

    // Auto-evaluate on twin changes
    this.twin_registry.on_change((event) => this.on_twin_change(event));
  }

  register_rule(rule: Rule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  remove_rule(rule_id: string): boolean {
    const idx = this.rules.findIndex((r) => r.rule_id === rule_id);
    if (idx >= 0) {
      this.rules.splice(idx, 1);
      return true;
    }
    return false;
  }

  list_rules(): Rule[] {
    return [...this.rules];
  }

  // Evaluate all rules against a specific twin
  evaluate_for_twin(twin: TwinInstance): RuleAction[] {
    const fired_actions: RuleAction[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      if (rule.target_type_id !== twin.type_id) continue;

      // Check cooldown
      const cooldown_key = `${rule.rule_id}:${twin.instance_id}`;
      const last = this.last_fired.get(cooldown_key) ?? 0;
      if (Date.now() - last < rule.cooldown_ms) continue;

      // Evaluate all conditions (AND)
      const all_met = rule.conditions.every((condition) => {
        const value = twin.get_property(condition.property_name);
        return evaluate_condition(condition, value);
      });

      if (all_met) {
        this.last_fired.set(cooldown_key, Date.now());
        for (const action of rule.actions) {
          this.execute_action(action, twin, rule);
          fired_actions.push(action);
        }
      }
    }

    return fired_actions;
  }

  private on_twin_change(event: TwinChangeEvent): void {
    const twin = this.twin_registry.get_twin(event.instance_id);
    if (twin) {
      this.evaluate_for_twin(twin);
    }
  }

  private execute_action(action: RuleAction, twin: TwinInstance, rule: Rule): void {
    switch (action.type) {
      case RuleActionType.UPDATE_PROPERTY: {
        const { property_name, value } = action.params as { property_name: string; value: unknown };
        this.twin_registry.update_property(twin.instance_id, property_name, value);
        break;
      }
      case RuleActionType.EMIT_ALERT: {
        const { severity, title, message } = action.params as {
          severity: string;
          title: string;
          message: string;
        };
        this.alert_manager.create(severity as AlertSeverity, title, message, {
          source_twin_id: twin.instance_id,
          source_type_id: twin.type_id,
          rule_id: rule.rule_id,
        });
        break;
      }
      case RuleActionType.LOG: {
        const { message } = action.params as { message: string };
        console.log(`[RuleEngine] ${rule.rule_id} → ${twin.instance_id}: ${message}`);
        break;
      }
      case RuleActionType.TRIGGER_ACTION:
      case RuleActionType.EXECUTE_WEBHOOK:
        // These would be handled by external systems
        break;
    }
  }
}
