// =============================================================================
// OpenTwin Platform — Business Logic: Workflows
// Domain-agnostic sequential workflow execution
// =============================================================================

// ---------------------------------------------------------------------------
// WorkflowStep — A single step in a workflow
// ---------------------------------------------------------------------------

export interface WorkflowStep {
  step_id: string;
  display_name: string;
  action_type: string;    // reference to an OntologyAction or RuleAction type
  params: Record<string, unknown>;
  proceed_condition?: {    // condition to auto-advance to next step
    property_name: string;
    expected_value: unknown;
    timeout_ms?: number;
  };
}

// ---------------------------------------------------------------------------
// WorkflowDefinition — A reusable workflow template
// ---------------------------------------------------------------------------

export interface WorkflowDefinition {
  workflow_id: string;
  display_name: string;
  description?: string;
  target_type_id: string;
  steps: WorkflowStep[];
}

// ---------------------------------------------------------------------------
// WorkflowStatus — Runtime state of a workflow instance
// ---------------------------------------------------------------------------

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// ---------------------------------------------------------------------------
// WorkflowInstance — A running instance of a workflow
// ---------------------------------------------------------------------------

export class WorkflowInstance {
  readonly instance_id: string;
  readonly workflow_id: string;
  readonly target_twin_id: string;
  status: WorkflowStatus = WorkflowStatus.PENDING;
  current_step_index = 0;
  started_at?: Date;
  completed_at?: Date;
  step_results: Map<string, unknown> = new Map();

  constructor(instance_id: string, workflow_id: string, target_twin_id: string) {
    this.instance_id = instance_id;
    this.workflow_id = workflow_id;
    this.target_twin_id = target_twin_id;
  }

  start(): void {
    this.status = WorkflowStatus.RUNNING;
    this.started_at = new Date();
    this.current_step_index = 0;
  }

  advance(): boolean {
    this.current_step_index++;
    return true;
  }

  complete(): void {
    this.status = WorkflowStatus.COMPLETED;
    this.completed_at = new Date();
  }

  fail(reason?: string): void {
    this.status = WorkflowStatus.FAILED;
    this.completed_at = new Date();
    this.step_results.set('_failure_reason', reason);
  }

  pause(): void {
    this.status = WorkflowStatus.PAUSED;
  }

  resume(): void {
    this.status = WorkflowStatus.RUNNING;
  }

  cancel(): void {
    this.status = WorkflowStatus.CANCELLED;
    this.completed_at = new Date();
  }

  to_snapshot(): object {
    return {
      instance_id: this.instance_id,
      workflow_id: this.workflow_id,
      target_twin_id: this.target_twin_id,
      status: this.status,
      current_step_index: this.current_step_index,
      started_at: this.started_at,
      completed_at: this.completed_at,
    };
  }
}

// ---------------------------------------------------------------------------
// WorkflowManager — Manages workflow definitions and instances
// ---------------------------------------------------------------------------

export class WorkflowManager {
  private definitions = new Map<string, WorkflowDefinition>();
  private instances = new Map<string, WorkflowInstance>();
  private counter = 0;

  register_workflow(definition: WorkflowDefinition): void {
    this.definitions.set(definition.workflow_id, definition);
  }

  get_definition(workflow_id: string): WorkflowDefinition | undefined {
    return this.definitions.get(workflow_id);
  }

  list_definitions(): WorkflowDefinition[] {
    return Array.from(this.definitions.values());
  }

  start_workflow(workflow_id: string, target_twin_id: string): WorkflowInstance {
    const definition = this.definitions.get(workflow_id);
    if (!definition) throw new Error(`Workflow '${workflow_id}' not found`);

    const instance = new WorkflowInstance(
      `wf-instance-${++this.counter}`,
      workflow_id,
      target_twin_id,
    );
    instance.start();
    this.instances.set(instance.instance_id, instance);
    return instance;
  }

  get_instance(instance_id: string): WorkflowInstance | undefined {
    return this.instances.get(instance_id);
  }

  list_instances(filter?: { workflow_id?: string; status?: WorkflowStatus; target_twin_id?: string }): WorkflowInstance[] {
    let instances = Array.from(this.instances.values());
    if (filter?.workflow_id) instances = instances.filter((i) => i.workflow_id === filter.workflow_id);
    if (filter?.status) instances = instances.filter((i) => i.status === filter.status);
    if (filter?.target_twin_id) instances = instances.filter((i) => i.target_twin_id === filter.target_twin_id);
    return instances;
  }
}
