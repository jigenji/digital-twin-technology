// =============================================================================
// OpenTwin Dashboard — Alert API Routes
// =============================================================================

import { Router } from 'express';
import { OpenTwinPlatform } from '../../core/src/platform';
import { AlertSeverity, AlertStatus } from '../../core/src/business-logic/alert';

export function createAlertRoutes(platform: OpenTwinPlatform): Router {
  const router = Router();

  // List alerts (with optional filters)
  router.get('/', (req, res) => {
    const { severity, status, twin_id } = req.query;
    const alerts = platform.alerts.list({
      severity: severity as AlertSeverity | undefined,
      status: status as AlertStatus | undefined,
      source_twin_id: typeof twin_id === 'string' ? twin_id : undefined,
    });
    res.json(alerts);
  });

  // Get a specific alert
  router.get('/:id', (req, res) => {
    const alert = platform.alerts.get(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  });

  // Acknowledge an alert
  router.post('/:id/acknowledge', (req, res) => {
    platform.alerts.acknowledge(req.params.id);
    const alert = platform.alerts.get(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  });

  // Resolve an alert
  router.post('/:id/resolve', (req, res) => {
    platform.alerts.resolve(req.params.id);
    const alert = platform.alerts.get(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  });

  return router;
}
