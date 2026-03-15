// =============================================================================
// OpenTwin Platform — Data Integration: Connectors & Transforms
// Foundry Data Connection equivalent — protocol-agnostic data source definitions
// =============================================================================

// ---------------------------------------------------------------------------
// ConnectorProtocol — Supported data source protocols
// ---------------------------------------------------------------------------

export enum ConnectorProtocol {
  KAFKA = 'kafka',
  MQTT = 'mqtt',
  OPC_UA = 'opc_ua',
  REST = 'rest',
  WEBSOCKET = 'websocket',
  MODBUS = 'modbus',
  ROS2 = 'ros2',
  FILE = 'file',
}

// ---------------------------------------------------------------------------
// AuthConfig — Authentication for external data sources
// ---------------------------------------------------------------------------

export interface AuthConfig {
  method: 'none' | 'basic' | 'token' | 'certificate' | 'oauth2';
  credentials?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// ConnectorDef — Definition of an external data source connection
// ---------------------------------------------------------------------------

export interface ConnectorDef {
  connector_id: string;
  display_name: string;
  protocol: ConnectorProtocol;
  endpoint: string;
  auth: AuthConfig;
  topic_mapping?: Record<string, string>; // protocol-specific topic → ontology type mapping
  polling_interval_ms?: number;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// TransformSpec — Field mapping and type conversion
// ---------------------------------------------------------------------------

export interface FieldMapping {
  source_field: string;
  target_field: string;
  type_conversion?: string;  // e.g., 'string_to_float', 'epoch_to_datetime'
  unit_conversion?: {
    from: string;
    to: string;
    factor?: number;
    offset?: number;
  };
}

export interface TransformSpec {
  transform_id: string;
  field_mappings: FieldMapping[];
  filter_expression?: string;  // optional: filter records before applying
}
