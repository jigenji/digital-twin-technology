// =============================================================================
// OpenTwin Platform Core — Public API
// =============================================================================

// Ontology (Layer 5)
export { PropertyType, PropertyDef, ObjectType, LinkType, Cardinality } from './src/ontology/types';
export type { PropertyConstraint, SpatialMeta, SpatialContextDef, SpatialLayerDef } from './src/ontology/types';
export type { OntologyAction, OntologyFunction, ParameterDef, ActionHandler, ActionResult, FunctionCompute } from './src/ontology/actions';
export { OntologyRegistry } from './src/ontology/registry';
export type { OntologyEvent, OntologyEventType, OntologyEventListener } from './src/ontology/registry';
export { TwinInstance, TwinRegistry } from './src/ontology/twin';
export type { TimelineEntry, SpatialState, TwinLink, TwinChangeEvent, TwinChangeListener } from './src/ontology/twin';
export { DataFunnel } from './src/ontology/funnel';
export type { FunnelRoute, FunnelMapping, FunnelStats } from './src/ontology/funnel';
export { OntologyBinder } from './src/ontology/binder';
export type { Binding, BindingGenerator } from './src/ontology/binder';

// Business Logic (Layer 5.5)
export { RuleOperator, RuleActionType, evaluate_condition } from './src/business-logic/rule';
export type { RuleCondition, RuleAction, Rule } from './src/business-logic/rule';
export { AlertSeverity, AlertStatus, AlertManager } from './src/business-logic/alert';
export type { Alert } from './src/business-logic/alert';
export { WorkflowStatus, WorkflowInstance, WorkflowManager } from './src/business-logic/workflow';
export type { WorkflowStep, WorkflowDefinition } from './src/business-logic/workflow';
export { RuleEngine } from './src/business-logic/engine';

// Data Integration (Layer 0)
export { ConnectorProtocol } from './src/data-integration/connector';
export type { ConnectorDef, AuthConfig, TransformSpec, FieldMapping } from './src/data-integration/connector';
export { PipelineManager } from './src/data-integration/pipeline';
export type { StreamPipeline } from './src/data-integration/pipeline';
export { DataLineage } from './src/data-integration/lineage';
export type { LineageRecord } from './src/data-integration/lineage';

// Simulation (Layer 3)
export { SimulatorType, SimulationManager } from './src/simulation/simulation';
export type { SimEnvironment, Sim2RealPipeline, WhatIfScenario } from './src/simulation/simulation';

// Intelligence (Layer 6)
export { IntelligenceManager } from './src/intelligence/intelligence';
export type { AIFunction, AgentDefinition, AgentTool } from './src/intelligence/intelligence';

// Deploy (Layer -1)
export { DeployTarget, DeployManager } from './src/deploy/deploy';
export type { EdgeProfile, ComponentSpec, DeployManifest } from './src/deploy/deploy';

// Platform Facade
export { OpenTwinPlatform } from './src/platform';
