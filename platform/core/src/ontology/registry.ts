// =============================================================================
// OpenTwin Platform — OntologyRegistry (Foundry OMS equivalent)
// Ontology Metadata Service: manages all type definitions
// =============================================================================

import { ObjectType, LinkType, SpatialContextDef } from './types';
import { OntologyAction, OntologyFunction } from './actions';

// ---------------------------------------------------------------------------
// Event types for ontology changes (used by OntologyBinder)
// ---------------------------------------------------------------------------

export type OntologyEventType =
  | 'object_type_registered'
  | 'object_type_removed'
  | 'link_type_registered'
  | 'link_type_removed'
  | 'action_registered'
  | 'function_registered'
  | 'spatial_context_registered';

export interface OntologyEvent {
  type: OntologyEventType;
  payload: unknown;
  timestamp: Date;
}

export type OntologyEventListener = (event: OntologyEvent) => void;

// ---------------------------------------------------------------------------
// OntologyRegistry — Central registry for all ontology definitions
// ---------------------------------------------------------------------------

export class OntologyRegistry {
  private object_types = new Map<string, ObjectType>();
  private link_types = new Map<string, LinkType>();
  private actions = new Map<string, OntologyAction>();
  private functions = new Map<string, OntologyFunction>();
  private spatial_contexts = new Map<string, SpatialContextDef>();
  private listeners: OntologyEventListener[] = [];

  // --- ObjectType management ---

  register_object_type(obj_type: ObjectType): void {
    this.object_types.set(obj_type.type_id, obj_type);
    this.emit({ type: 'object_type_registered', payload: obj_type, timestamp: new Date() });
  }

  get_object_type(type_id: string): ObjectType | undefined {
    return this.object_types.get(type_id);
  }

  list_object_types(): ObjectType[] {
    return Array.from(this.object_types.values());
  }

  remove_object_type(type_id: string): boolean {
    const removed = this.object_types.delete(type_id);
    if (removed) {
      this.emit({ type: 'object_type_removed', payload: { type_id }, timestamp: new Date() });
    }
    return removed;
  }

  // --- LinkType management ---

  register_link_type(link_type: LinkType): void {
    // Validate that source and target types exist
    if (!this.object_types.has(link_type.source_type_id)) {
      throw new Error(`Source type '${link_type.source_type_id}' not registered`);
    }
    if (!this.object_types.has(link_type.target_type_id)) {
      throw new Error(`Target type '${link_type.target_type_id}' not registered`);
    }
    this.link_types.set(link_type.link_type_id, link_type);
    this.emit({ type: 'link_type_registered', payload: link_type, timestamp: new Date() });
  }

  get_link_type(link_type_id: string): LinkType | undefined {
    return this.link_types.get(link_type_id);
  }

  list_link_types(): LinkType[] {
    return Array.from(this.link_types.values());
  }

  find_links_for_type(type_id: string): LinkType[] {
    return this.list_link_types().filter(
      (lt) => lt.source_type_id === type_id || lt.target_type_id === type_id,
    );
  }

  // --- Action management ---

  register_action(action: OntologyAction): void {
    if (!this.object_types.has(action.target_type_id)) {
      throw new Error(`Target type '${action.target_type_id}' not registered`);
    }
    this.actions.set(action.action_id, action);
    this.emit({ type: 'action_registered', payload: action, timestamp: new Date() });
  }

  get_action(action_id: string): OntologyAction | undefined {
    return this.actions.get(action_id);
  }

  list_actions(): OntologyAction[] {
    return Array.from(this.actions.values());
  }

  find_actions_for_type(type_id: string): OntologyAction[] {
    return this.list_actions().filter((a) => a.target_type_id === type_id);
  }

  // --- Function management ---

  register_function(fn: OntologyFunction): void {
    this.functions.set(fn.function_id, fn);
    this.emit({ type: 'function_registered', payload: fn, timestamp: new Date() });
  }

  get_function(function_id: string): OntologyFunction | undefined {
    return this.functions.get(function_id);
  }

  list_functions(): OntologyFunction[] {
    return Array.from(this.functions.values());
  }

  // --- SpatialContext management ---

  register_spatial_context(ctx: SpatialContextDef): void {
    this.spatial_contexts.set(ctx.context_id, ctx);
    this.emit({ type: 'spatial_context_registered', payload: ctx, timestamp: new Date() });
  }

  get_spatial_context(context_id: string): SpatialContextDef | undefined {
    return this.spatial_contexts.get(context_id);
  }

  list_spatial_contexts(): SpatialContextDef[] {
    return Array.from(this.spatial_contexts.values());
  }

  // --- Event system ---

  on(listener: OntologyEventListener): void {
    this.listeners.push(listener);
  }

  off(listener: OntologyEventListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private emit(event: OntologyEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  // --- Serialization ---

  export_schema(): object {
    return {
      object_types: Array.from(this.object_types.entries()),
      link_types: Array.from(this.link_types.entries()),
      actions: Array.from(this.actions.entries()).map(([id, a]) => [
        id,
        { ...a, handler: undefined },
      ]),
      functions: Array.from(this.functions.entries()).map(([id, f]) => [
        id,
        { ...f, compute: undefined },
      ]),
      spatial_contexts: Array.from(this.spatial_contexts.entries()),
    };
  }
}
