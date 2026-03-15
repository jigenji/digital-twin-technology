// =============================================================================
// OpenTwin Platform — Ontology Type Definitions
// Foundry-faithful universal primitives with spatial data integration
// =============================================================================

// ---------------------------------------------------------------------------
// PropertyType — All possible data types a Property can hold
// Extends Foundry's scalar types with 3D spatial types (USD Prim-inspired)
// ---------------------------------------------------------------------------

export enum PropertyType {
  // Scalar types (Foundry standard)
  STRING = 'string',
  INT = 'int',
  FLOAT = 'float',
  BOOL = 'bool',
  DATETIME = 'datetime',

  // Spatial types (3D digital twin extension)
  GEO_POINT = 'geo_point',       // [lat, lon, alt] — geographic coordinate
  GEO_POSE = 'geo_pose',         // position + orientation (6DoF)
  TRANSFORM3D = 'transform3d',   // 4x4 homogeneous transform matrix
  MESH = 'mesh',                 // 3D mesh reference (glTF/USD/OBJ)
  POINTCLOUD = 'pointcloud',     // Point cloud reference (PCD/LAS/E57)
  OCCUPANCY_GRID = 'occupancy_grid', // 2D/3D occupancy grid (SLAM map)
  IMAGE = 'image',               // Image/texture reference

  // Composite types
  TIMESERIES = 'timeseries',     // Time-indexed value stream
  JSON = 'json',                 // Arbitrary structured data
  REFERENCE = 'reference',       // Reference to another TwinInstance
}

// ---------------------------------------------------------------------------
// PropertyConstraint — Validation rules for property values
// ---------------------------------------------------------------------------

export interface PropertyConstraint {
  min?: number;
  max?: number;
  enum_values?: string[];
  pattern?: string;        // regex for string validation
  required?: boolean;
  readonly?: boolean;
}

// ---------------------------------------------------------------------------
// SpatialFormat — Supported formats for spatial property types
// ---------------------------------------------------------------------------

export interface SpatialMeta {
  format?: string;           // e.g., 'gltf', 'usd', 'pcd', 'las', 'e57', 'pgm'
  coordinate_frame?: string; // e.g., 'world', 'base_link', 'map', 'utm'
  resolution?: number;       // spatial resolution in meters (for grids/pointclouds)
  storage?: 'inline' | 'ref'; // data embedded or external reference
}

// ---------------------------------------------------------------------------
// PropertyDef — Definition of a single property on an ObjectType
// ---------------------------------------------------------------------------

export interface PropertyDef {
  name: string;
  type: PropertyType;
  display_name?: string;
  description?: string;
  unit?: string;           // e.g., '°C', 'm/s', 'rad', '%'
  default_value?: unknown;
  constraint?: PropertyConstraint;
  spatial?: SpatialMeta;   // additional metadata for spatial types
}

// ---------------------------------------------------------------------------
// ObjectType — Universal entity type definition (Foundry ObjectType)
// Any entity in the world: robot, factory, sensor, order, zone, etc.
// ---------------------------------------------------------------------------

export interface ObjectType {
  type_id: string;
  display_name: string;
  description?: string;
  properties: PropertyDef[];
  primary_key: string;     // which property is the unique identifier
  tags?: string[];         // classification tags (not domain-specific)
  icon?: string;           // display icon identifier
}

// ---------------------------------------------------------------------------
// Cardinality — Relationship cardinality between ObjectTypes
// ---------------------------------------------------------------------------

export enum Cardinality {
  ONE_TO_ONE = '1:1',
  ONE_TO_MANY = '1:N',
  MANY_TO_MANY = 'N:N',
}

// ---------------------------------------------------------------------------
// LinkType — Relationship between two ObjectTypes (Foundry LinkType)
// Any relationship: "belongs_to", "operates_in", "supplies", etc.
// ---------------------------------------------------------------------------

export interface LinkType {
  link_type_id: string;
  display_name: string;
  description?: string;
  source_type_id: string;
  target_type_id: string;
  cardinality: Cardinality;
  properties?: PropertyDef[]; // link can carry its own properties
  inverse_name?: string;      // e.g., "contains" is inverse of "belongs_to"
}

// ---------------------------------------------------------------------------
// SpatialContext — A 3D space that contains twins (USD Stage equivalent)
// This is itself an ObjectType instance, but with spatial semantics
// ---------------------------------------------------------------------------

export interface SpatialContextDef {
  context_id: string;
  display_name: string;
  coordinate_frame: string;          // 'enu' | 'ned' | 'utm' | 'custom'
  bounds?: {
    min: [number, number, number];   // [x, y, z]
    max: [number, number, number];
  };
  representations: SpatialLayerDef[];
}

export interface SpatialLayerDef {
  layer_id: string;
  type: PropertyType.MESH | PropertyType.POINTCLOUD | PropertyType.OCCUPANCY_GRID | PropertyType.IMAGE;
  source?: string;                   // file path or URI
  spatial?: SpatialMeta;
  description?: string;
}
