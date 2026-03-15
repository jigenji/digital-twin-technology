"""
OpenTwin Edge — Sensor Fusion Implementation
Time-synchronized multi-sensor data alignment and fusion.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any
import time


@dataclass
class TimestampedData:
    """A single timestamped data sample from a sensor."""
    sensor_id: str
    timestamp: float  # epoch seconds
    data: dict[str, Any] = field(default_factory=dict)
    frame_id: str = ''


class TimeSynchronizer:
    """
    Approximate time synchronizer for multiple sensor streams.
    Buffers data per sensor and emits synchronized bundles
    when all sensors have data within the tolerance window.
    """

    def __init__(self, sensor_ids: list[str], tolerance_ms: float = 50.0):
        self.sensor_ids = sensor_ids
        self.tolerance_s = tolerance_ms / 1000.0
        self.buffers: dict[str, list[TimestampedData]] = {
            sid: [] for sid in sensor_ids
        }
        self.max_buffer_size = 100

    def add(self, data: TimestampedData) -> list[dict[str, TimestampedData]] | None:
        """
        Add a data sample. Returns a synchronized bundle if all sensors
        have data within the tolerance window, otherwise None.
        """
        if data.sensor_id not in self.buffers:
            return None

        buf = self.buffers[data.sensor_id]
        buf.append(data)

        # Trim old data
        if len(buf) > self.max_buffer_size:
            self.buffers[data.sensor_id] = buf[-self.max_buffer_size:]

        return self._try_sync()

    def _try_sync(self) -> list[dict[str, TimestampedData]] | None:
        # Check if all sensors have at least one sample
        if not all(len(buf) > 0 for buf in self.buffers.values()):
            return None

        # Find the latest earliest timestamp across all buffers
        latest_earliest = max(buf[0].timestamp for buf in self.buffers.values())

        # Try to find matching samples within tolerance
        bundle: dict[str, TimestampedData] = {}
        for sid, buf in self.buffers.items():
            match = None
            for sample in buf:
                if abs(sample.timestamp - latest_earliest) <= self.tolerance_s:
                    match = sample
                    break
            if match is None:
                return None
            bundle[sid] = match

        # Remove used samples from buffers
        for sid, sample in bundle.items():
            self.buffers[sid] = [
                s for s in self.buffers[sid] if s.timestamp > sample.timestamp
            ]

        return [bundle]


class CoordinateTransformer:
    """
    Simple static coordinate frame transformer.
    For full TF2 support, use the ROS 2 tf2 library.
    """

    def __init__(self) -> None:
        # frame_id → (parent_frame, [x, y, z, qx, qy, qz, qw])
        self.transforms: dict[str, tuple[str, list[float]]] = {}

    def set_transform(self, frame_id: str, parent_frame: str, pose: list[float]) -> None:
        """Register a static transform: child_frame relative to parent_frame."""
        self.transforms[frame_id] = (parent_frame, pose)

    def get_transform(self, frame_id: str) -> tuple[str, list[float]] | None:
        return self.transforms.get(frame_id)

    def list_frames(self) -> list[str]:
        return list(self.transforms.keys())
