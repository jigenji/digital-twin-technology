"""
OpenTwin Edge — Sensor Specifications & Fusion Pipeline
Defines sensor types, connection parameters, and multi-sensor fusion.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class SensorType(Enum):
    """Supported sensor modalities."""
    LIDAR = 'lidar'
    CAMERA = 'camera'
    DEPTH_CAMERA = 'depth_camera'
    IMU = 'imu'
    GPS = 'gps'
    OPC_UA = 'opc_ua'
    MQTT = 'mqtt'
    MODBUS = 'modbus'
    ENCODER = 'encoder'
    FORCE_TORQUE = 'force_torque'
    TEMPERATURE = 'temperature'
    CUSTOM = 'custom'


@dataclass
class ConnectionConfig:
    """Protocol-specific connection parameters."""
    protocol: str  # 'ros2_topic', 'opc_ua', 'mqtt', 'modbus_tcp', etc.
    endpoint: str  # topic name, OPC-UA node ID, MQTT topic, etc.
    qos: dict[str, Any] = field(default_factory=dict)
    auth: dict[str, str] = field(default_factory=dict)


@dataclass
class DataSchema:
    """Schema of data produced by a sensor."""
    fields: dict[str, str]  # field_name → type ('float32', 'uint8[]', etc.)
    frame_id: str = ''       # ROS 2 TF frame
    frequency_hz: float = 0  # expected publish rate


@dataclass
class SensorSpec:
    """
    Universal sensor definition.
    Maps a physical sensor to its data schema and connection.
    """
    sensor_id: str
    sensor_type: SensorType
    display_name: str
    connection: ConnectionConfig
    data_schema: DataSchema
    coordinate_frame: str = 'base_link'  # TF2 frame for spatial alignment
    transform_to_base: list[float] = field(default_factory=lambda: [0, 0, 0, 0, 0, 0, 1])
    # [x, y, z, qx, qy, qz, qw] — pose relative to base_link
    enabled: bool = True
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_ros2_params(self) -> dict[str, Any]:
        """Generate ROS 2 node parameters for this sensor."""
        return {
            'sensor_id': self.sensor_id,
            'sensor_type': self.sensor_type.value,
            'frame_id': self.data_schema.frame_id or self.sensor_id,
            'frequency_hz': self.data_schema.frequency_hz,
            'topic': self.connection.endpoint,
        }


class FusionType(Enum):
    """Sensor fusion strategies."""
    EARLY = 'early'    # fuse raw data before processing
    LATE = 'late'      # process individually, fuse results
    HYBRID = 'hybrid'  # combination


@dataclass
class FusionPipeline:
    """
    Multi-sensor fusion pipeline definition.
    Combines multiple SensorSpecs into a unified output.
    """
    pipeline_id: str
    display_name: str
    sensors: list[SensorSpec]
    fusion_type: FusionType = FusionType.LATE
    output_frame: str = 'base_link'
    time_sync_tolerance_ms: float = 50.0  # max time difference for sync
    output_schema: DataSchema | None = None
    enabled: bool = True

    def sensor_ids(self) -> list[str]:
        return [s.sensor_id for s in self.sensors]
