"""
OpenTwin Edge — Navigation Configuration
Aligned with ROS 2 Navigation2 (Nav2) stack.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class PlannerType(Enum):
    """Global path planners (Nav2 aligned)."""
    NAVFN = 'NavfnPlanner'
    SMAC_2D = 'SmacPlanner2D'
    SMAC_HYBRID = 'SmacHybridPlanner'
    SMAC_LATTICE = 'SmacLatticePlanner'
    THETA_STAR = 'ThetaStarPlanner'
    CUSTOM = 'custom'


class ControllerType(Enum):
    """Local controllers / trajectory followers (Nav2 aligned)."""
    DWB = 'DWBLocalPlanner'
    TEB = 'TEBLocalPlanner'
    REGULATED_PP = 'RegulatedPurePursuitController'
    MPPI = 'MPPIController'
    CUSTOM = 'custom'


@dataclass
class CostmapConfig:
    """Costmap layer configuration."""
    resolution: float = 0.05          # m/cell
    width: float = 10.0               # meters
    height: float = 10.0
    inflation_radius: float = 0.55    # meters
    cost_scaling_factor: float = 3.0
    plugins: list[str] = field(default_factory=lambda: [
        'static_layer', 'obstacle_layer', 'inflation_layer',
    ])
    params: dict[str, Any] = field(default_factory=dict)


@dataclass
class NavigationConfig:
    """
    Complete navigation configuration for a mobile robot.
    Wraps Nav2 planner + controller + costmap settings.
    """
    config_id: str
    display_name: str
    planner: PlannerType = PlannerType.SMAC_2D
    controller: ControllerType = ControllerType.REGULATED_PP
    global_costmap: CostmapConfig = field(default_factory=CostmapConfig)
    local_costmap: CostmapConfig = field(default_factory=lambda: CostmapConfig(
        width=3.0, height=3.0,
    ))
    max_velocity: float = 0.5         # m/s
    max_angular_velocity: float = 1.0  # rad/s
    goal_tolerance_xy: float = 0.25   # meters
    goal_tolerance_yaw: float = 0.25  # radians
    recovery_behaviors: list[str] = field(default_factory=lambda: [
        'spin', 'backup', 'wait',
    ])
    params: dict[str, Any] = field(default_factory=dict)

    def to_ros2_params(self) -> dict[str, Any]:
        """Generate Nav2 parameter dict."""
        return {
            'planner_server': {
                'planner_plugin': self.planner.value,
            },
            'controller_server': {
                'controller_plugin': self.controller.value,
                'max_vel_x': self.max_velocity,
                'max_vel_theta': self.max_angular_velocity,
                'xy_goal_tolerance': self.goal_tolerance_xy,
                'yaw_goal_tolerance': self.goal_tolerance_yaw,
            },
            'recoveries_server': {
                'recovery_plugins': self.recovery_behaviors,
            },
            **self.params,
        }
