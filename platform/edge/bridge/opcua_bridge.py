"""
OpenTwin Edge — OPC-UA Bridge
Bridges OPC-UA server nodes to/from the Core platform.
Uses asyncua-compatible patterns for industrial device integration.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Callable
import logging

logger = logging.getLogger(__name__)


@dataclass
class OPCUANodeMapping:
    """Maps an OPC-UA node to an ontology property."""
    node_id: str              # OPC-UA NodeId (e.g., 'ns=2;i=1001')
    target_type_id: str
    target_instance_id: str
    target_property: str
    subscribe: bool = True     # whether to subscribe to value changes
    polling_interval_ms: float = 1000.0


@dataclass
class OPCUABridge:
    """
    Bridges OPC-UA ↔ Core ontology.
    Reads OPC-UA node values and maps them to twin properties.
    Writes ontology actions as OPC-UA method calls.
    """
    endpoint_url: str = 'opc.tcp://localhost:4840'
    security_policy: str = 'None'  # 'None', 'Basic256Sha256', etc.
    username: str | None = None
    password: str | None = None
    certificate_path: str | None = None
    mappings: list[OPCUANodeMapping] = field(default_factory=list)
    _on_data: Callable[[str, str, dict[str, Any]], None] | None = None

    def add_mapping(self, mapping: OPCUANodeMapping) -> None:
        self.mappings.append(mapping)

    def set_data_handler(
        self, handler: Callable[[str, str, dict[str, Any]], None]
    ) -> None:
        """Set callback: handler(type_id, instance_id, properties)."""
        self._on_data = handler

    def on_value_change(self, node_id: str, value: Any) -> None:
        """
        Process a value change from OPC-UA subscription.
        Called by the asyncua subscription handler.
        """
        mapping = next(
            (m for m in self.mappings if m.node_id == node_id), None
        )
        if not mapping:
            return

        if self._on_data:
            self._on_data(
                mapping.target_type_id,
                mapping.target_instance_id,
                {mapping.target_property: value},
            )

    def get_subscription_nodes(self) -> list[str]:
        """Get list of OPC-UA node IDs to subscribe to."""
        return [m.node_id for m in self.mappings if m.subscribe]

    def get_polling_nodes(self) -> list[tuple[str, float]]:
        """Get list of (node_id, interval_ms) for polling."""
        return [
            (m.node_id, m.polling_interval_ms)
            for m in self.mappings
            if not m.subscribe
        ]
