// =============================================================================
// OpenTwin Platform — Integrated Facade
// Single entry point to all platform layers
// =============================================================================

import { OntologyRegistry } from './ontology/registry';
import { TwinRegistry } from './ontology/twin';
import { DataFunnel } from './ontology/funnel';
import { OntologyBinder } from './ontology/binder';
import { RuleEngine } from './business-logic/engine';
import { AlertManager } from './business-logic/alert';
import { WorkflowManager } from './business-logic/workflow';
import { PipelineManager } from './data-integration/pipeline';
import { DataLineage } from './data-integration/lineage';
import { SimulationManager } from './simulation/simulation';
import { IntelligenceManager } from './intelligence/intelligence';
import { DeployManager } from './deploy/deploy';

// ---------------------------------------------------------------------------
// OpenTwinPlatform — The unified platform facade
// ---------------------------------------------------------------------------

export class OpenTwinPlatform {
  // Layer 5: Ontology (Foundry OMS + OSS + Object Data Funnel)
  readonly ontology: OntologyRegistry;
  readonly twins: TwinRegistry;
  readonly funnel: DataFunnel;
  readonly binder: OntologyBinder;

  // Layer 5.5: Business Logic
  readonly alerts: AlertManager;
  readonly rules: RuleEngine;
  readonly workflows: WorkflowManager;

  // Layer 0: Data Integration
  readonly pipelines: PipelineManager;
  readonly lineage: DataLineage;

  // Layer 3: Simulation
  readonly simulation: SimulationManager;

  // Layer 6: Intelligence
  readonly intelligence: IntelligenceManager;

  // Layer -1: Deploy
  readonly deploy: DeployManager;

  constructor() {
    // Initialize in dependency order
    this.ontology = new OntologyRegistry();
    this.twins = new TwinRegistry(this.ontology);
    this.funnel = new DataFunnel(this.twins, this.ontology);
    this.binder = new OntologyBinder(this.ontology);

    this.alerts = new AlertManager();
    this.rules = new RuleEngine(this.twins, this.ontology, this.alerts);
    this.workflows = new WorkflowManager();

    this.pipelines = new PipelineManager();
    this.lineage = new DataLineage();

    this.simulation = new SimulationManager();
    this.intelligence = new IntelligenceManager();
    this.deploy = new DeployManager();
  }

  // --- Convenience: Platform status summary ---

  status(): object {
    return {
      ontology: {
        object_types: this.ontology.list_object_types().length,
        link_types: this.ontology.list_link_types().length,
        actions: this.ontology.list_actions().length,
        functions: this.ontology.list_functions().length,
        spatial_contexts: this.ontology.list_spatial_contexts().length,
      },
      twins: {
        total: this.twins.count(),
      },
      business_logic: {
        rules: this.rules.list_rules().length,
        active_alerts: this.alerts.get_active_count(),
        workflow_definitions: this.workflows.list_definitions().length,
      },
      data_integration: {
        connectors: this.pipelines.list_connectors().length,
        pipelines: this.pipelines.list_pipelines().length,
        funnel_routes: this.funnel.list_routes().length,
      },
      bindings: this.binder.get_all_bindings().length,
    };
  }
}
