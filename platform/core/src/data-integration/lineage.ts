// =============================================================================
// OpenTwin Platform — Data Integration: Data Lineage
// Tracks provenance of data flowing through the platform
// =============================================================================

export interface LineageRecord {
  record_id: string;
  source_connector_id: string;
  pipeline_id: string;
  target_twin_id: string;
  target_property: string;
  timestamp: Date;
  raw_value?: unknown;
  transformed_value?: unknown;
}

export class DataLineage {
  private records: LineageRecord[] = [];
  private counter = 0;

  record(
    source_connector_id: string,
    pipeline_id: string,
    target_twin_id: string,
    target_property: string,
    raw_value?: unknown,
    transformed_value?: unknown,
  ): LineageRecord {
    const entry: LineageRecord = {
      record_id: `lineage-${++this.counter}`,
      source_connector_id,
      pipeline_id,
      target_twin_id,
      target_property,
      timestamp: new Date(),
      raw_value,
      transformed_value,
    };
    this.records.push(entry);
    return entry;
  }

  query(filter: {
    twin_id?: string;
    property?: string;
    connector_id?: string;
    since?: Date;
  }): LineageRecord[] {
    return this.records.filter((r) => {
      if (filter.twin_id && r.target_twin_id !== filter.twin_id) return false;
      if (filter.property && r.target_property !== filter.property) return false;
      if (filter.connector_id && r.source_connector_id !== filter.connector_id) return false;
      if (filter.since && r.timestamp < filter.since) return false;
      return true;
    });
  }

  get_provenance(twin_id: string, property: string): LineageRecord | undefined {
    const records = this.query({ twin_id, property });
    return records[records.length - 1];
  }
}
