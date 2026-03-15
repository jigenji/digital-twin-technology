// =============================================================================
// OpenTwin Platform — DataFunnel (Foundry Object Data Funnel equivalent)
// Orchestrates data writes from external sources into the ontology
// =============================================================================

import { TwinRegistry } from './twin';
import { OntologyRegistry } from './registry';

// ---------------------------------------------------------------------------
// FunnelMapping — Maps an external data field to an ontology property
// ---------------------------------------------------------------------------

export interface FunnelMapping {
  source_field: string;       // field name in incoming data
  target_property: string;    // property name on the ObjectType
  transform?: (value: unknown) => unknown; // optional value transformation
}

// ---------------------------------------------------------------------------
// FunnelRoute — Defines how data flows from a source to twin instances
// ---------------------------------------------------------------------------

export interface FunnelRoute {
  route_id: string;
  source_topic: string;       // e.g., Kafka topic, MQTT topic, OPC-UA node
  target_type_id: string;     // which ObjectType to update
  instance_key_field: string; // field in incoming data that identifies the twin
  mappings: FunnelMapping[];
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// FunnelStats — Metrics for a funnel route
// ---------------------------------------------------------------------------

export interface FunnelStats {
  route_id: string;
  messages_received: number;
  messages_processed: number;
  messages_failed: number;
  last_received_at?: Date;
}

// ---------------------------------------------------------------------------
// DataFunnel — Orchestrates data ingestion into the ontology
// ---------------------------------------------------------------------------

export class DataFunnel {
  private routes = new Map<string, FunnelRoute>();
  private stats = new Map<string, FunnelStats>();
  private twin_registry: TwinRegistry;
  private ontology_registry: OntologyRegistry;

  constructor(twin_registry: TwinRegistry, ontology_registry: OntologyRegistry) {
    this.twin_registry = twin_registry;
    this.ontology_registry = ontology_registry;
  }

  register_route(route: FunnelRoute): void {
    if (!this.ontology_registry.get_object_type(route.target_type_id)) {
      throw new Error(`Target type '${route.target_type_id}' not registered`);
    }
    this.routes.set(route.route_id, route);
    this.stats.set(route.route_id, {
      route_id: route.route_id,
      messages_received: 0,
      messages_processed: 0,
      messages_failed: 0,
    });
  }

  get_route(route_id: string): FunnelRoute | undefined {
    return this.routes.get(route_id);
  }

  list_routes(): FunnelRoute[] {
    return Array.from(this.routes.values());
  }

  remove_route(route_id: string): boolean {
    this.stats.delete(route_id);
    return this.routes.delete(route_id);
  }

  // Process incoming data message through the appropriate route
  ingest(route_id: string, data: Record<string, unknown>): void {
    const route = this.routes.get(route_id);
    if (!route || !route.enabled) return;

    const stats = this.stats.get(route_id)!;
    stats.messages_received++;
    stats.last_received_at = new Date();

    try {
      const instance_key = data[route.instance_key_field] as string;
      if (!instance_key) {
        throw new Error(`Instance key field '${route.instance_key_field}' not found in data`);
      }

      // Get or create twin instance
      let twin = this.twin_registry.get_twin(instance_key);
      if (!twin) {
        twin = this.twin_registry.create_twin(instance_key, route.target_type_id);
      }

      // Apply mappings
      for (const mapping of route.mappings) {
        let value = data[mapping.source_field];
        if (value === undefined) continue;

        if (mapping.transform) {
          value = mapping.transform(value);
        }

        this.twin_registry.update_property(instance_key, mapping.target_property, value);
      }

      stats.messages_processed++;
    } catch {
      stats.messages_failed++;
    }
  }

  // Batch ingest
  ingest_batch(route_id: string, data_batch: Record<string, unknown>[]): void {
    for (const data of data_batch) {
      this.ingest(route_id, data);
    }
  }

  get_stats(route_id: string): FunnelStats | undefined {
    return this.stats.get(route_id);
  }

  get_all_stats(): FunnelStats[] {
    return Array.from(this.stats.values());
  }
}
