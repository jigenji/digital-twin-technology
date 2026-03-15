"""
OpenTwin Edge — Device Profile & Actuator Specifications
A DeviceProfile bundles sensors, actuators, and fusion pipelines for a device.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from .sensor_spec import SensorSpec, FusionPipeline


class ActuatorType(Enum):
    """Supported actuator types."""
    MOTOR = 'motor'
    SERVO = 'servo'
    LINEAR_ACTUATOR = 'linear_actuator'
    GRIPPER = 'gripper'
    VALVE = 'valve'
    RELAY = 'relay'
    CUSTOM = 'custom'


@dataclass
class ActuatorSpec:
    """
    Universal actuator definition.
    Maps a physical actuator to its command interface.
    """
    actuator_id: str
    actuator_type: ActuatorType
    display_name: str
    command_interface: str  # ROS 2 topic, OPC-UA node, etc.
    command_type: str       # e.g., 'std_msgs/Float64', 'geometry_msgs/Twist'
    limits: dict[str, float] = field(default_factory=dict)  # min/max values
    coordinate_frame: str = 'base_link'
    enabled: bool = True
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class DeviceProfile:
    """
    Complete device profile — bundles all sensors, actuators, and fusion
    pipelines for a physical device (robot, machine, vehicle, etc.).
    """
    profile_id: str
    display_name: str
    device_type: str  # e.g., 'mobile_robot', 'industrial_arm', 'agv'
    sensors: list[SensorSpec] = field(default_factory=list)
    actuators: list[ActuatorSpec] = field(default_factory=list)
    fusion_pipelines: list[FusionPipeline] = field(default_factory=list)
    urdf_path: str | None = None     # URDF/xacro model path
    namespace: str = ''               # ROS 2 namespace
    metadata: dict[str, Any] = field(default_factory=dict)

    def get_sensor(self, sensor_id: str) -> SensorSpec | None:
        return next((s for s in self.sensors if s.sensor_id == sensor_id), None)

    def get_actuator(self, actuator_id: str) -> ActuatorSpec | None:
        return next((a for a in self.actuators if a.actuator_id == actuator_id), None)

    def all_frames(self) -> list[str]:
        """List all coordinate frames referenced by this device."""
        frames = set()
        for s in self.sensors:
            frames.add(s.coordinate_frame)
            if s.data_schema.frame_id:
                frames.add(s.data_schema.frame_id)
        for a in self.actuators:
            frames.add(a.coordinate_frame)
        return sorted(frames)
