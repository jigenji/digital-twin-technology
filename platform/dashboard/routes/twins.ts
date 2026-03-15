// =============================================================================
// OpenTwin Dashboard — Twin CRUD API Routes
// =============================================================================

import { Router } from 'express';
import { OpenTwinPlatform } from '../../core/src/platform';

export function createTwinRoutes(platform: OpenTwinPlatform): Router {
  const router = Router();

  // List all twins (optionally filter by type)
  router.get('/', (req, res) => {
    const { type_id } = req.query;
    let twins;
    if (type_id && typeof type_id === 'string') {
      twins = platform.twins.find_by_type(type_id);
    } else {
      twins = platform.twins.find_all();
    }
    res.json(twins.map((t) => t.to_snapshot()));
  });

  // Get a specific twin
  router.get('/:id', (req, res) => {
    const twin = platform.twins.get_twin(req.params.id);
    if (!twin) return res.status(404).json({ error: 'Twin not found' });
    res.json(twin.to_snapshot());
  });

  // Create a twin
  router.post('/', (req, res) => {
    const { instance_id, type_id, properties } = req.body;
    try {
      const twin = platform.twins.create_twin(instance_id, type_id, properties);
      res.status(201).json(twin.to_snapshot());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  });

  // Update twin properties
  router.patch('/:id', (req, res) => {
    const { properties } = req.body;
    const twin = platform.twins.get_twin(req.params.id);
    if (!twin) return res.status(404).json({ error: 'Twin not found' });

    try {
      for (const [key, value] of Object.entries(properties ?? {})) {
        platform.twins.update_property(req.params.id, key, value);
      }
      res.json(twin.to_snapshot());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  });

  // Delete a twin
  router.delete('/:id', (req, res) => {
    const removed = platform.twins.remove_twin(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Twin not found' });
    res.status(204).send();
  });

  // Get twin timeline
  router.get('/:id/timeline', (req, res) => {
    const twin = platform.twins.get_twin(req.params.id);
    if (!twin) return res.status(404).json({ error: 'Twin not found' });
    const { property } = req.query;
    const timeline = twin.get_timeline(typeof property === 'string' ? property : undefined);
    res.json(timeline);
  });

  // Get twin links
  router.get('/:id/links', (req, res) => {
    const twin = platform.twins.get_twin(req.params.id);
    if (!twin) return res.status(404).json({ error: 'Twin not found' });
    const links = platform.twins.get_links(req.params.id);
    res.json(links);
  });

  // Create a link
  router.post('/:id/links', (req, res) => {
    const { link_type_id, target_id, properties } = req.body;
    try {
      const link = platform.twins.create_link(link_type_id, req.params.id, target_id, properties);
      res.status(201).json(link);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  });

  // Find twins in a spatial context
  router.get('/spatial/:context_id', (req, res) => {
    const twins = platform.twins.find_by_spatial_context(req.params.context_id);
    res.json(twins.map((t) => t.to_snapshot()));
  });

  return router;
}
