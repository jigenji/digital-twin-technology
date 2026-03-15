"""
OpenTwin Edge — MQTT Bridge
Bridges MQTT messages to/from the Core platform.
Translates between MQTT topics and ontology property updates.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Callable
import json
import logging

logger = logging.getLogger(__name__)


@dataclass
class MQTTTopicMapping:
    """Maps an MQTT topic to an ontology property update."""
    mqtt_topic: str
    target_type_id: str
    instance_key_field: str  # JSON field that identifies the twin instance
    field_mappings: dict[str, str]  # mqtt_field → ontology_property


@dataclass
class MQTTBridge:
    """
    Bridges MQTT ↔ Core ontology.
    Subscribes to MQTT topics and forwards data to the platform core
    via a callback. Also publishes ontology actions as MQTT messages.
    """
    broker_host: str = 'localhost'
    broker_port: int = 1883
    client_id: str = 'opentwin-mqtt-bridge'
    username: str | None = None
    password: str | None = None
    mappings: list[MQTTTopicMapping] = field(default_factory=list)
    _on_data: Callable[[str, str, dict[str, Any]], None] | None = None
    # callback(type_id, instance_id, properties)

    def add_mapping(self, mapping: MQTTTopicMapping) -> None:
        self.mappings.append(mapping)

    def set_data_handler(
        self, handler: Callable[[str, str, dict[str, Any]], None]
    ) -> None:
        """Set callback for incoming data: handler(type_id, instance_id, props)."""
        self._on_data = handler

    def on_message(self, topic: str, payload: bytes) -> None:
        """
        Process an incoming MQTT message.
        Called by the MQTT client's on_message callback.
        """
        mapping = next(
            (m for m in self.mappings if self._topic_matches(topic, m.mqtt_topic)),
            None,
        )
        if not mapping:
            logger.debug(f'No mapping for topic: {topic}')
            return

        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            logger.warning(f'Invalid JSON on topic {topic}')
            return

        instance_id = data.get(mapping.instance_key_field)
        if not instance_id:
            logger.warning(f'Missing instance key field: {mapping.instance_key_field}')
            return

        props: dict[str, Any] = {}
        for mqtt_field, onto_prop in mapping.field_mappings.items():
            if mqtt_field in data:
                props[onto_prop] = data[mqtt_field]

        if self._on_data and props:
            self._on_data(mapping.target_type_id, str(instance_id), props)

    def publish_action(self, topic: str, payload: dict[str, Any]) -> bytes:
        """Serialize an action command for MQTT publishing."""
        return json.dumps(payload).encode('utf-8')

    @staticmethod
    def _topic_matches(topic: str, pattern: str) -> bool:
        """Simple MQTT topic matching with + and # wildcards."""
        topic_parts = topic.split('/')
        pattern_parts = pattern.split('/')

        for i, pp in enumerate(pattern_parts):
            if pp == '#':
                return True
            if i >= len(topic_parts):
                return False
            if pp != '+' and pp != topic_parts[i]:
                return False

        return len(topic_parts) == len(pattern_parts)
