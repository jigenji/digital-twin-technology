"""
OpenTwin Edge — ROS 2 Bridge
Bridges ROS 2 topics/services/actions to/from the Core platform.
Maps ROS 2 messages to ontology property updates and vice versa.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable
import logging

logger = logging.getLogger(__name__)


class ROS2InterfaceType(Enum):
    """ROS 2 communication primitives."""
    TOPIC = 'topic'
    SERVICE = 'service'
    ACTION = 'action'


@dataclass
class ROS2TopicMapping:
    """Maps a ROS 2 topic to ontology property updates."""
    topic_name: str
    message_type: str          # e.g., 'sensor_msgs/msg/LaserScan'
    target_type_id: str
    instance_id_source: str    # how to determine instance ID
    # 'header.frame_id', 'static:<id>', 'field:<field_name>'
    field_mappings: dict[str, str]  # ros_field → ontology_property
    qos_profile: str = 'sensor_data'


@dataclass
class ROS2ServiceMapping:
    """Maps an ontology Action to a ROS 2 service call."""
    action_id: str             # ontology action ID
    service_name: str          # ROS 2 service name
    service_type: str          # e.g., 'std_srvs/srv/SetBool'
    request_mapping: dict[str, str]  # action_param → service_request_field


@dataclass
class ROS2ActionMapping:
    """Maps an ontology Action to a ROS 2 action (long-running task)."""
    action_id: str
    action_name: str           # ROS 2 action name
    action_type: str           # e.g., 'nav2_msgs/action/NavigateToPose'
    goal_mapping: dict[str, str]     # action_param → goal_field
    feedback_mapping: dict[str, str]  # feedback_field → ontology_property


@dataclass
class ROS2Bridge:
    """
    Bridges ROS 2 ↔ Core ontology.
    - Subscribes to ROS 2 topics → updates twin properties
    - Receives ontology Actions → calls ROS 2 services/actions
    - Publishes twin state changes → ROS 2 topics
    """
    namespace: str = ''
    domain_id: int = 0
    topic_mappings: list[ROS2TopicMapping] = field(default_factory=list)
    service_mappings: list[ROS2ServiceMapping] = field(default_factory=list)
    action_mappings: list[ROS2ActionMapping] = field(default_factory=list)
    _on_data: Callable[[str, str, dict[str, Any]], None] | None = None

    def add_topic_mapping(self, mapping: ROS2TopicMapping) -> None:
        self.topic_mappings.append(mapping)

    def add_service_mapping(self, mapping: ROS2ServiceMapping) -> None:
        self.service_mappings.append(mapping)

    def add_action_mapping(self, mapping: ROS2ActionMapping) -> None:
        self.action_mappings.append(mapping)

    def set_data_handler(
        self, handler: Callable[[str, str, dict[str, Any]], None]
    ) -> None:
        """Set callback: handler(type_id, instance_id, properties)."""
        self._on_data = handler

    def on_ros2_message(
        self, topic_name: str, msg_data: dict[str, Any]
    ) -> None:
        """
        Process an incoming ROS 2 message.
        Extracts fields based on topic mapping and forwards to core.
        """
        mapping = next(
            (m for m in self.topic_mappings if m.topic_name == topic_name),
            None,
        )
        if not mapping:
            return

        # Resolve instance ID
        instance_id = self._resolve_instance_id(
            mapping.instance_id_source, msg_data
        )
        if not instance_id:
            logger.warning(f'Cannot resolve instance ID for topic {topic_name}')
            return

        # Extract mapped fields
        props: dict[str, Any] = {}
        for ros_field, onto_prop in mapping.field_mappings.items():
            value = self._extract_field(msg_data, ros_field)
            if value is not None:
                props[onto_prop] = value

        if self._on_data and props:
            self._on_data(mapping.target_type_id, instance_id, props)

    def get_service_for_action(self, action_id: str) -> ROS2ServiceMapping | None:
        return next(
            (m for m in self.service_mappings if m.action_id == action_id),
            None,
        )

    def get_action_for_action(self, action_id: str) -> ROS2ActionMapping | None:
        return next(
            (m for m in self.action_mappings if m.action_id == action_id),
            None,
        )

    @staticmethod
    def _resolve_instance_id(
        source: str, msg_data: dict[str, Any]
    ) -> str | None:
        if source.startswith('static:'):
            return source[7:]
        if source.startswith('field:'):
            field_name = source[6:]
            return str(msg_data.get(field_name, '')) or None
        if source == 'header.frame_id':
            header = msg_data.get('header', {})
            return header.get('frame_id') or None
        return None

    @staticmethod
    def _extract_field(data: dict[str, Any], field_path: str) -> Any:
        """Extract a nested field using dot notation."""
        parts = field_path.split('.')
        current: Any = data
        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
            else:
                return None
            if current is None:
                return None
        return current
