// =============================================================================
// OpenTwin Platform — TwinInstance & TwinRegistry (Foundry OSS equivalent)
// Object Set Service: manages concrete instances of ObjectTypes
// =============================================================================

import { ObjectType, PropertyType, PropertyDef, LinkType, Cardinality } from './types';
import { OntologyRegistry } from './registry';

// ---------------------------------------------------------------------------
// TimelineEntry — A timestamped property value
// ---------------------------------------------------------------------------

export interface TimelineEntry {
  timestamp: Date;
  property_name: string;
  value: unknown;
}

// ---------------------------------------------------------------------------
// SpatialState — Runtime spatial data for a twin (pose, geometry refs)
// ---------------------------------------------------------------------------

export interface SpatialState {
  pose?: {
    position: [number, number, number];       // [x, y, z]
    orientation: [number, number, number, number]; // quaternion [x, y, z, w]
  };
  spatial_context_id?: string;  // which SpatialContext this twin exists in
  mesh_uri?: string;            // reference to 3D mesh asset
  pointcloud_uri?: string;      // reference to point cloud
}

// ---------------------------------------------------------------------------
// TwinInstance — A concrete instance of an ObjectType
// Carries both scalar properties AND spatial state (USD Prim-inspired)
// ---------------------------------------------------------------------------

export class TwinInstance {
  readonly instance_id: string;
  readonly type_id: string;
  private properties: Map<string, unknown> = new Map();
  private timeline: TimelineEntry[] = [];
  spatial: SpatialState = {};
  private metadata: Record<string, unknown> = {};

  constructor(instance_id: string, type_id: string) {
    this.instance_id = instance_id;
    this.type_id = type_id;
  }

  get_property(name: string): unknown {
    return this.properties.get(name);
  }

  set_property(name: string, value: unknown, record_timeline = true): void {
    this.properties.set(name, value);
    if (record_timeline) {
      this.timeline.push({ timestamp: new Date(), property_name: name, value });
    }
  }

  get_all_properties(): Record<string, unknown> {
    return Object.fromEntries(this.properties);
  }

  get_timeline(property_name?: string): TimelineEntry[] {
    if (property_name) {
      return this.timeline.filter((e) => e.property_name === property_name);
    }
    return [...this.timeline];
  }

  set_metadata(key: string, value: unknown): void {
    this.metadata[key] = value;
  }

  get_metadata(key: string): unknown {
    return this.metadata[key];
  }

  to_snapshot(): object {
    return {
      instance_id: this.instance_id,
      type_id: this.type_id,
      properties: this.get_all_properties(),
      spatial: this.spatial,
      metadata: { ...this.metadata },
    };
  }
}

// ---------------------------------------------------------------------------
// TwinLink — A concrete link between two twin instances
// ---------------------------------------------------------------------------

export interface TwinLink {
  link_type_id: string;
  source_id: string;
  target_id: string;
  properties?: Record<string, unknown>;
  created_at: Date;
}

// ---------------------------------------------------------------------------
// TwinChangeEvent — Emitted when a twin's state changes
// ---------------------------------------------------------------------------

export interface TwinChangeEvent {
  instance_id: string;
  type_id: string;
  property_name: string;
  old_value: unknown;
  new_value: unknown;
  timestamp: Date;
}

export type TwinChangeListener = (event: TwinChangeEvent) => void;

// ---------------------------------------------------------------------------
// TwinRegistry — Central registry for all twin instances (OSS equivalent)
// ---------------------------------------------------------------------------

export class TwinRegistry {
  private instances = new Map<string, TwinInstance>();
  private links: TwinLink[] = [];
  private change_listeners: TwinChangeListener[] = [];
  private registry: OntologyRegistry;

  constructor(registry: OntologyRegistry) {
    this.registry = registry;
  }

  // --- Instance management ---

  create_twin(instance_id: string, type_id: string, initial_properties?: Record<string, unknown>): TwinInstance {
    const obj_type = this.registry.get_object_type(type_id);
    if (!obj_type) {
      throw new Error(`ObjectType '${type_id}' not registered in ontology`);
    }

    const twin = new TwinInstance(instance_id, type_id);

    // Apply defaults from type definition
    for (const prop_def of obj_type.properties) {
      if (prop_def.default_value !== undefined) {
        twin.set_property(prop_def.name, prop_def.default_value, false);
      }
    }

    // Apply initial properties
    if (initial_properties) {
      for (const [key, value] of Object.entries(initial_properties)) {
        twin.set_property(key, value, false);
      }
    }

    this.instances.set(instance_id, twin);
    return twin;
  }

  get_twin(instance_id: string): TwinInstance | undefined {
    return this.instances.get(instance_id);
  }

  remove_twin(instance_id: string): boolean {
    // Also remove links involving this twin
    this.links = this.links.filter(
      (l) => l.source_id !== instance_id && l.target_id !== instance_id,
    );
    return this.instances.delete(instance_id);
  }

  // --- Update with change tracking ---

  update_property(instance_id: string, property_name: string, value: unknown): void {
    const twin = this.instances.get(instance_id);
    if (!twin) throw new Error(`Twin '${instance_id}' not found`);

    const old_value = twin.get_property(property_name);
    twin.set_property(property_name, value);

    const event: TwinChangeEvent = {
      instance_id,
      type_id: twin.type_id,
      property_name,
      old_value,
      new_value: value,
      timestamp: new Date(),
    };
    for (const listener of this.change_listeners) {
      listener(event);
    }
  }

  // --- Link management ---

  create_link(link_type_id: string, source_id: string, target_id: string, properties?: Record<string, unknown>): TwinLink {
    const link_type = this.registry.get_link_type(link_type_id);
    if (!link_type) throw new Error(`LinkType '${link_type_id}' not registered`);

    const source = this.instances.get(source_id);
    const target = this.instances.get(target_id);
    if (!source) throw new Error(`Source twin '${source_id}' not found`);
    if (!target) throw new Error(`Target twin '${target_id}' not found`);

    if (source.type_id !== link_type.source_type_id) {
      throw new Error(`Source twin type '${source.type_id}' does not match link source type '${link_type.source_type_id}'`);
    }
    if (target.type_id !== link_type.target_type_id) {
      throw new Error(`Target twin type '${target.type_id}' does not match link target type '${link_type.target_type_id}'`);
    }

    // Enforce cardinality
    if (link_type.cardinality === Cardinality.ONE_TO_ONE) {
      const existing = this.links.find(
        (l) => l.link_type_id === link_type_id && l.source_id === source_id,
      );
      if (existing) throw new Error(`1:1 link already exists from '${source_id}' via '${link_type_id}'`);
    }

    const link: TwinLink = {
      link_type_id,
      source_id,
      target_id,
      properties,
      created_at: new Date(),
    };
    this.links.push(link);
    return link;
  }

  get_links(instance_id: string, link_type_id?: string): TwinLink[] {
    return this.links.filter((l) => {
      const matches_instance = l.source_id === instance_id || l.target_id === instance_id;
      if (link_type_id) return matches_instance && l.link_type_id === link_type_id;
      return matches_instance;
    });
  }

  get_linked_twins(instance_id: string, link_type_id: string, direction: 'outgoing' | 'incoming' = 'outgoing'): TwinInstance[] {
    return this.links
      .filter((l) => {
        if (direction === 'outgoing') return l.link_type_id === link_type_id && l.source_id === instance_id;
        return l.link_type_id === link_type_id && l.target_id === instance_id;
      })
      .map((l) => this.instances.get(direction === 'outgoing' ? l.target_id : l.source_id))
      .filter((t): t is TwinInstance => t !== undefined);
  }

  // --- Queries (OSS equivalent) ---

  find_by_type(type_id: string): TwinInstance[] {
    return Array.from(this.instances.values()).filter((t) => t.type_id === type_id);
  }

  find_by_property(property_name: string, value: unknown): TwinInstance[] {
    return Array.from(this.instances.values()).filter(
      (t) => t.get_property(property_name) === value,
    );
  }

  find_by_spatial_context(context_id: string): TwinInstance[] {
    return Array.from(this.instances.values()).filter(
      (t) => t.spatial.spatial_context_id === context_id,
    );
  }

  find_all(): TwinInstance[] {
    return Array.from(this.instances.values());
  }

  count(): number {
    return this.instances.size;
  }

  // --- Event system ---

  on_change(listener: TwinChangeListener): void {
    this.change_listeners.push(listener);
  }

  off_change(listener: TwinChangeListener): void {
    this.change_listeners = this.change_listeners.filter((l) => l !== listener);
  }
}
