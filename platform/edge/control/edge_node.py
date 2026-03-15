"""
OpenTwin Edge — Edge Node Definition
Defines a ROS 2 node to be deployed on edge devices.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class QoSPreset(Enum):
    """ROS 2 QoS presets."""
    SENSOR_DATA = 'sensor_data'         # best effort, volatile
    SYSTEM_DEFAULT = 'system_default'   # reliable, volatile
    SERVICES = 'services'               # reliable, volatile
    PARAMETERS = 'parameters'           # reliable, transient local
    ACTION_STATUS = 'action_status'     # reliable, transient local


@dataclass
class TopicConfig:
    """ROS 2 topic subscription/publication config."""
    topic_name: str
    message_type: str      # e.g., 'sensor_msgs/msg/LaserScan'
    qos: QoSPreset = QoSPreset.SENSOR_DATA
    direction: str = 'subscribe'  # 'subscribe' or 'publish'


@dataclass
class EdgeNode:
    """
    ROS 2 node definition for edge deployment.
    Specifies package, executable, parameters, and topic bindings.
    """
    node_id: str
    display_name: str
    package: str              # ROS 2 package name
    executable: str           # node executable name
    namespace: str = ''
    topics: list[TopicConfig] = field(default_factory=list)
    parameters: dict[str, Any] = field(default_factory=dict)
    remappings: dict[str, str] = field(default_factory=dict)
    respawn: bool = True
    respawn_delay_s: float = 5.0

    def to_launch_config(self) -> dict[str, Any]:
        """Generate ROS 2 launch configuration."""
        config: dict[str, Any] = {
            'package': self.package,
            'executable': self.executable,
            'name': self.node_id,
            'parameters': [self.parameters],
            'remappings': list(self.remappings.items()),
            'respawn': self.respawn,
            'respawn_delay': self.respawn_delay_s,
        }
        if self.namespace:
            config['namespace'] = self.namespace
        return config
