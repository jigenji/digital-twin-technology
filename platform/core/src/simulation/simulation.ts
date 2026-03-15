// =============================================================================
// OpenTwin Platform — Simulation Layer
// CARLA / Gazebo / NVIDIA Omniverse aligned simulation definitions
// =============================================================================

// ---------------------------------------------------------------------------
// SimulatorType — Supported simulation backends
// ---------------------------------------------------------------------------

export enum SimulatorType {
  GAZEBO = 'gazebo',
  CARLA = 'carla',
  OMNIVERSE = 'omniverse',
  CUSTOM = 'custom',
}

// ---------------------------------------------------------------------------
// SimEnvironment — Simulation world configuration
// ---------------------------------------------------------------------------

export interface SimEnvironment {
  environment_id: string;
  display_name: string;
  simulator: SimulatorType;
  world_config: {
    world_file?: string;       // e.g., .world (Gazebo), .usd (Omniverse), .xodr (CARLA)
    physics_engine?: string;
    time_step_ms?: number;
    gravity?: [number, number, number];
  };
  spawn_points?: Array<{
    name: string;
    position: [number, number, number];
    orientation: [number, number, number, number];
  }>;
  weather?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Sim2RealPipeline — Validates simulation before real-world deployment
// ---------------------------------------------------------------------------

export interface Sim2RealPipeline {
  pipeline_id: string;
  display_name: string;
  sim_environment_id: string;
  validation_criteria: Array<{
    metric_name: string;
    threshold: number;
    comparison: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  }>;
  deploy_on_pass: boolean;
}

// ---------------------------------------------------------------------------
// WhatIfScenario — Parameter sweep for scenario analysis
// ---------------------------------------------------------------------------

export interface WhatIfScenario {
  scenario_id: string;
  display_name: string;
  description?: string;
  base_state: Record<string, unknown>;
  parameter_changes: Array<{
    twin_id: string;
    property_name: string;
    values: unknown[];  // sweep values
  }>;
  evaluation_metrics: string[];
}

// ---------------------------------------------------------------------------
// SimulationManager — Manages simulation environments and scenarios
// ---------------------------------------------------------------------------

export class SimulationManager {
  private environments = new Map<string, SimEnvironment>();
  private pipelines = new Map<string, Sim2RealPipeline>();
  private scenarios = new Map<string, WhatIfScenario>();

  register_environment(env: SimEnvironment): void {
    this.environments.set(env.environment_id, env);
  }

  get_environment(env_id: string): SimEnvironment | undefined {
    return this.environments.get(env_id);
  }

  list_environments(): SimEnvironment[] {
    return Array.from(this.environments.values());
  }

  register_pipeline(pipeline: Sim2RealPipeline): void {
    this.pipelines.set(pipeline.pipeline_id, pipeline);
  }

  register_scenario(scenario: WhatIfScenario): void {
    this.scenarios.set(scenario.scenario_id, scenario);
  }

  list_scenarios(): WhatIfScenario[] {
    return Array.from(this.scenarios.values());
  }
}
