// =============================================================================
// OpenTwin Platform — Deploy Layer (Palantir Apollo equivalent)
// Pull-based deployment manifests for edge/cloud/hybrid targets
// =============================================================================

// ---------------------------------------------------------------------------
// DeployTarget — Where components are deployed
// ---------------------------------------------------------------------------

export enum DeployTarget {
  EDGE = 'edge',
  CLOUD = 'cloud',
  HYBRID = 'hybrid',
  AIRGAPPED = 'airgapped',
}

// ---------------------------------------------------------------------------
// EdgeProfile — Resource constraints of an edge device
// ---------------------------------------------------------------------------

export interface EdgeProfile {
  profile_id: string;
  display_name: string;
  cpu_cores: number;
  memory_mb: number;
  gpu?: string;
  bandwidth_mbps?: number;
  storage_gb?: number;
  os?: string;
  architecture?: string; // 'x86_64' | 'aarch64'
}

// ---------------------------------------------------------------------------
// ComponentSpec — A deployable component
// ---------------------------------------------------------------------------

export interface ComponentSpec {
  component_id: string;
  display_name: string;
  layer: string;              // which platform layer
  container_image?: string;
  resources?: {
    cpu_request?: string;
    memory_request?: string;
    gpu_request?: string;
  };
  environment?: Record<string, string>;
  health_check?: {
    endpoint: string;
    interval_ms: number;
  };
}

// ---------------------------------------------------------------------------
// DeployManifest — Complete deployment specification
// ---------------------------------------------------------------------------

export interface DeployManifest {
  manifest_id: string;
  display_name: string;
  target: DeployTarget;
  edge_profile?: EdgeProfile;
  components: ComponentSpec[];
  version: string;
  rollback_version?: string;
}

// ---------------------------------------------------------------------------
// DeployManager — Manages deployment manifests
// ---------------------------------------------------------------------------

export class DeployManager {
  private manifests = new Map<string, DeployManifest>();
  private edge_profiles = new Map<string, EdgeProfile>();

  register_edge_profile(profile: EdgeProfile): void {
    this.edge_profiles.set(profile.profile_id, profile);
  }

  get_edge_profile(profile_id: string): EdgeProfile | undefined {
    return this.edge_profiles.get(profile_id);
  }

  list_edge_profiles(): EdgeProfile[] {
    return Array.from(this.edge_profiles.values());
  }

  register_manifest(manifest: DeployManifest): void {
    this.manifests.set(manifest.manifest_id, manifest);
  }

  get_manifest(manifest_id: string): DeployManifest | undefined {
    return this.manifests.get(manifest_id);
  }

  list_manifests(): DeployManifest[] {
    return Array.from(this.manifests.values());
  }
}
