// =============================================================================
// OpenTwin Platform — Data Integration: Stream Pipeline
// connector → transform → ontology update
// =============================================================================

import { ConnectorDef } from './connector';
import { TransformSpec, FieldMapping } from './connector';

// ---------------------------------------------------------------------------
// StreamPipeline — End-to-end data flow definition
// ---------------------------------------------------------------------------

export interface StreamPipeline {
  pipeline_id: string;
  display_name: string;
  connector_id: string;
  transform: TransformSpec;
  target_type_id: string;
  instance_key_field: string; // which field identifies the twin instance
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// PipelineManager — Manages data pipelines
// ---------------------------------------------------------------------------

export class PipelineManager {
  private pipelines = new Map<string, StreamPipeline>();
  private connectors = new Map<string, ConnectorDef>();

  register_connector(connector: ConnectorDef): void {
    this.connectors.set(connector.connector_id, connector);
  }

  get_connector(connector_id: string): ConnectorDef | undefined {
    return this.connectors.get(connector_id);
  }

  list_connectors(): ConnectorDef[] {
    return Array.from(this.connectors.values());
  }

  register_pipeline(pipeline: StreamPipeline): void {
    if (!this.connectors.has(pipeline.connector_id)) {
      throw new Error(`Connector '${pipeline.connector_id}' not registered`);
    }
    this.pipelines.set(pipeline.pipeline_id, pipeline);
  }

  get_pipeline(pipeline_id: string): StreamPipeline | undefined {
    return this.pipelines.get(pipeline_id);
  }

  list_pipelines(): StreamPipeline[] {
    return Array.from(this.pipelines.values());
  }

  // Apply transform to incoming data
  apply_transform(transform: TransformSpec, data: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const mapping of transform.field_mappings) {
      let value = data[mapping.source_field];
      if (value === undefined) continue;

      if (mapping.unit_conversion) {
        const { factor, offset } = mapping.unit_conversion;
        if (typeof value === 'number') {
          value = value * (factor ?? 1) + (offset ?? 0);
        }
      }

      result[mapping.target_field] = value;
    }

    return result;
  }
}
