// =============================================================================
// OpenTwin Platform — Business Logic: Alerts
// Universal alert system — severity-based notifications
// =============================================================================

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

export interface Alert {
  alert_id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  source_twin_id?: string;
  source_type_id?: string;
  rule_id?: string;
  created_at: Date;
  acknowledged_at?: Date;
  resolved_at?: Date;
  metadata?: Record<string, unknown>;
}

export class AlertManager {
  private alerts = new Map<string, Alert>();
  private counter = 0;

  create(
    severity: AlertSeverity,
    title: string,
    message: string,
    options?: {
      source_twin_id?: string;
      source_type_id?: string;
      rule_id?: string;
      metadata?: Record<string, unknown>;
    },
  ): Alert {
    const alert: Alert = {
      alert_id: `alert-${++this.counter}`,
      severity,
      status: AlertStatus.ACTIVE,
      title,
      message,
      source_twin_id: options?.source_twin_id,
      source_type_id: options?.source_type_id,
      rule_id: options?.rule_id,
      created_at: new Date(),
      metadata: options?.metadata,
    };
    this.alerts.set(alert.alert_id, alert);
    return alert;
  }

  acknowledge(alert_id: string): void {
    const alert = this.alerts.get(alert_id);
    if (alert && alert.status === AlertStatus.ACTIVE) {
      alert.status = AlertStatus.ACKNOWLEDGED;
      alert.acknowledged_at = new Date();
    }
  }

  resolve(alert_id: string): void {
    const alert = this.alerts.get(alert_id);
    if (alert && alert.status !== AlertStatus.RESOLVED) {
      alert.status = AlertStatus.RESOLVED;
      alert.resolved_at = new Date();
    }
  }

  get(alert_id: string): Alert | undefined {
    return this.alerts.get(alert_id);
  }

  list(filter?: { severity?: AlertSeverity; status?: AlertStatus; source_twin_id?: string }): Alert[] {
    let alerts = Array.from(this.alerts.values());
    if (filter?.severity) alerts = alerts.filter((a) => a.severity === filter.severity);
    if (filter?.status) alerts = alerts.filter((a) => a.status === filter.status);
    if (filter?.source_twin_id) alerts = alerts.filter((a) => a.source_twin_id === filter.source_twin_id);
    return alerts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  get_active_count(): number {
    return Array.from(this.alerts.values()).filter((a) => a.status === AlertStatus.ACTIVE).length;
  }
}
