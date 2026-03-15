"""
OpenTwin Edge — Control Loop Definition
Defines periodic control loops running on the edge.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ControlLoop:
    """
    A periodic control loop definition.
    Reads input topics, applies control law, writes output topics.
    """
    loop_id: str
    display_name: str
    period_ms: float                     # control period in milliseconds
    input_topics: list[str]              # ROS 2 topics to subscribe
    output_topics: list[str]             # ROS 2 topics to publish
    control_law: str                     # reference to control algorithm
    # e.g., 'pid', 'mpc', 'pure_pursuit', 'custom'
    params: dict[str, Any] = field(default_factory=dict)
    # e.g., {'kp': 1.0, 'ki': 0.1, 'kd': 0.01} for PID
    enabled: bool = True

    @property
    def frequency_hz(self) -> float:
        return 1000.0 / self.period_ms if self.period_ms > 0 else 0.0
