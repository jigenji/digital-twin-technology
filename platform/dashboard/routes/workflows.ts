// =============================================================================
// OpenTwin Dashboard — Workflow API Routes
// =============================================================================

import { Router } from 'express';
import { OpenTwinPlatform } from '../../core/src/platform';
import { WorkflowStatus } from '../../core/src/business-logic/workflow';

export function createWorkflowRoutes(platform: OpenTwinPlatform): Router {
  const router = Router();

  // List workflow definitions
  router.get('/definitions', (_req, res) => {
    res.json(platform.workflows.list_definitions());
  });

  // List workflow instances
  router.get('/instances', (req, res) => {
    const { workflow_id, status, twin_id } = req.query;
    const instances = platform.workflows.list_instances({
      workflow_id: typeof workflow_id === 'string' ? workflow_id : undefined,
      status: status as WorkflowStatus | undefined,
      target_twin_id: typeof twin_id === 'string' ? twin_id : undefined,
    });
    res.json(instances.map((i) => i.to_snapshot()));
  });

  // Start a workflow
  router.post('/start', (req, res) => {
    const { workflow_id, target_twin_id } = req.body;
    try {
      const instance = platform.workflows.start_workflow(workflow_id, target_twin_id);
      res.status(201).json(instance.to_snapshot());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  });

  // Get workflow instance
  router.get('/instances/:id', (req, res) => {
    const instance = platform.workflows.get_instance(req.params.id);
    if (!instance) return res.status(404).json({ error: 'Workflow instance not found' });
    res.json(instance.to_snapshot());
  });

  // Cancel a workflow instance
  router.post('/instances/:id/cancel', (req, res) => {
    const instance = platform.workflows.get_instance(req.params.id);
    if (!instance) return res.status(404).json({ error: 'Workflow instance not found' });
    instance.cancel();
    res.json(instance.to_snapshot());
  });

  return router;
}
