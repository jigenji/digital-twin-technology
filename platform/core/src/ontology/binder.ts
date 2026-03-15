// =============================================================================
// OpenTwin Platform — OntologyBinder
// Automatically binds ontology definitions to each platform layer
// When an ObjectType is registered, binder generates:
//   - Sensor mappings (Layer 1)
//   - Kafka/MQTT topic definitions (Layer 0)
//   - ROS 2 service interfaces (Layer 2)
//   - AI agent tools (Layer 6)
// =============================================================================

import { ObjectType, PropertyType, PropertyDef, LinkType } from './types';
import { OntologyAction, OntologyFunction } from './actions';
import { OntologyRegistry, OntologyEvent } from './registry';

// ---------------------------------------------------------------------------
// Binding — A generated connection between ontology and a platform layer
// ---------------------------------------------------------------------------

export interface Binding {
  binding_id: string;
  layer: string;       // e.g., 'sensing', 'data_integration', 'edge_control', 'intelligence'
  source_type: 'object_type' | 'link_type' | 'action' | 'function';
  source_id: string;   // the ontology element that triggered this binding
  config: Record<string, unknown>;  // layer-specific configuration
}

// ---------------------------------------------------------------------------
// BindingGenerator — Generates bindings for a specific layer
// ---------------------------------------------------------------------------

export type BindingGenerator = (event: OntologyEvent) => Binding[];

// ---------------------------------------------------------------------------
// OntologyBinder — Watches ontology changes and generates bindings
// ---------------------------------------------------------------------------

export class OntologyBinder {
  private generators = new Map<string, BindingGenerator>();
  private bindings = new Map<string, Binding>();
  private registry: OntologyRegistry;

  constructor(registry: OntologyRegistry) {
    this.registry = registry;
    this.registry.on((event) => this.handle_event(event));
    this.register_default_generators();
  }

  register_generator(layer: string, generator: BindingGenerator): void {
    this.generators.set(layer, generator);
  }

  get_bindings_for(source_id: string): Binding[] {
    return Array.from(this.bindings.values()).filter((b) => b.source_id === source_id);
  }

  get_bindings_by_layer(layer: string): Binding[] {
    return Array.from(this.bindings.values()).filter((b) => b.layer === layer);
  }

  get_all_bindings(): Binding[] {
    return Array.from(this.bindings.values());
  }

  private handle_event(event: OntologyEvent): void {
    for (const [, generator] of this.generators) {
      const new_bindings = generator(event);
      for (const binding of new_bindings) {
        this.bindings.set(binding.binding_id, binding);
      }
    }
  }

  // --- Default binding generators ---

  private register_default_generators(): void {
    // Layer 0: Data Integration — generate Kafka/MQTT topics for each ObjectType
    this.register_generator('data_integration', (event) => {
      if (event.type !== 'object_type_registered') return [];
      const obj_type = event.payload as ObjectType;
      return [{
        binding_id: `data_integration:topic:${obj_type.type_id}`,
        layer: 'data_integration',
        source_type: 'object_type',
        source_id: obj_type.type_id,
        config: {
          topic: `opentwin.${obj_type.type_id}.updates`,
          schema: obj_type.properties.map((p) => ({ name: p.name, type: p.type })),
        },
      }];
    });

    // Layer 1: Sensing — generate sensor mappings for spatial/timeseries properties
    this.register_generator('sensing', (event) => {
      if (event.type !== 'object_type_registered') return [];
      const obj_type = event.payload as ObjectType;
      const spatial_props = obj_type.properties.filter((p) => is_spatial_type(p.type));
      const timeseries_props = obj_type.properties.filter((p) => p.type === PropertyType.TIMESERIES);
      const sensor_props = [...spatial_props, ...timeseries_props];

      if (sensor_props.length === 0) return [];

      return [{
        binding_id: `sensing:mapping:${obj_type.type_id}`,
        layer: 'sensing',
        source_type: 'object_type',
        source_id: obj_type.type_id,
        config: {
          sensor_properties: sensor_props.map((p) => ({
            name: p.name,
            type: p.type,
            unit: p.unit,
            spatial: p.spatial,
          })),
        },
      }];
    });

    // Layer 2: Edge Control — generate ROS 2 service definitions for Actions
    this.register_generator('edge_control', (event) => {
      if (event.type !== 'action_registered') return [];
      const action = event.payload as OntologyAction;
      return [{
        binding_id: `edge_control:service:${action.action_id}`,
        layer: 'edge_control',
        source_type: 'action',
        source_id: action.action_id,
        config: {
          ros2_service: `/${action.target_type_id}/${action.action_id}`,
          parameters: action.parameters.map((p) => ({
            name: p.name,
            type: property_type_to_ros2(p.type),
          })),
        },
      }];
    });

    // Layer 6: Intelligence — generate AI agent tools for Functions
    this.register_generator('intelligence', (event) => {
      if (event.type !== 'function_registered') return [];
      const fn = event.payload as OntologyFunction;
      return [{
        binding_id: `intelligence:tool:${fn.function_id}`,
        layer: 'intelligence',
        source_type: 'function',
        source_id: fn.function_id,
        config: {
          tool_name: fn.function_id,
          description: fn.description ?? fn.display_name,
          inputs: fn.inputs.map((p) => ({ name: p.name, type: p.type })),
          output_type: fn.output_type,
        },
      }];
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function is_spatial_type(type: PropertyType): boolean {
  return [
    PropertyType.GEO_POINT,
    PropertyType.GEO_POSE,
    PropertyType.TRANSFORM3D,
    PropertyType.MESH,
    PropertyType.POINTCLOUD,
    PropertyType.OCCUPANCY_GRID,
    PropertyType.IMAGE,
  ].includes(type);
}

function property_type_to_ros2(type: PropertyType): string {
  const mapping: Record<string, string> = {
    [PropertyType.STRING]: 'string',
    [PropertyType.INT]: 'int64',
    [PropertyType.FLOAT]: 'float64',
    [PropertyType.BOOL]: 'bool',
    [PropertyType.GEO_POINT]: 'geometry_msgs/msg/Point',
    [PropertyType.GEO_POSE]: 'geometry_msgs/msg/PoseStamped',
    [PropertyType.TRANSFORM3D]: 'geometry_msgs/msg/TransformStamped',
    [PropertyType.POINTCLOUD]: 'sensor_msgs/msg/PointCloud2',
    [PropertyType.OCCUPANCY_GRID]: 'nav_msgs/msg/OccupancyGrid',
    [PropertyType.IMAGE]: 'sensor_msgs/msg/Image',
  };
  return mapping[type] ?? 'std_msgs/msg/String';
}
