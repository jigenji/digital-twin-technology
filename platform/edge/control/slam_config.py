"""
OpenTwin Edge — SLAM Configuration
Configures Simultaneous Localization and Mapping algorithms.
Aligned with ROS 2 SLAM toolbox / Cartographer / ORB-SLAM3.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class SLAMAlgorithm(Enum):
    """Supported SLAM algorithms."""
    SLAM_TOOLBOX = 'slam_toolbox'         # ROS 2 default 2D SLAM
    CARTOGRAPHER = 'cartographer'         # Google Cartographer (2D/3D)
    ORB_SLAM3 = 'orb_slam3'              # Visual/Visual-Inertial SLAM
    RTAB_MAP = 'rtab_map'                # RGB-D/Stereo/LiDAR SLAM
    CUSTOM = 'custom'


class MapFormat(Enum):
    """Output map formats."""
    OCCUPANCY_GRID = 'occupancy_grid'    # 2D PGM + YAML (ROS standard)
    POINT_CLOUD_MAP = 'point_cloud_map'  # 3D point cloud map
    OCTOMAP = 'octomap'                  # 3D octree map
    POSE_GRAPH = 'pose_graph'            # Graph-based map


@dataclass
class SLAMConfig:
    """
    SLAM algorithm configuration.
    Provides parameters for the selected algorithm + map output format.
    """
    config_id: str
    display_name: str
    algorithm: SLAMAlgorithm
    map_format: MapFormat = MapFormat.OCCUPANCY_GRID
    resolution: float = 0.05  # meters per cell (for occupancy grid)
    max_range: float = 30.0   # max sensor range in meters
    min_range: float = 0.1
    update_interval_ms: float = 100.0
    params: dict[str, Any] = field(default_factory=dict)
    # Algorithm-specific params, e.g.:
    # slam_toolbox: {'mode': 'mapping', 'loop_closure': True}
    # cartographer: {'num_subdivisions_per_laser_scan': 10}

    def to_ros2_params(self) -> dict[str, Any]:
        """Generate ROS 2 parameter dict for the SLAM node."""
        base = {
            'resolution': self.resolution,
            'max_laser_range': self.max_range,
            'min_laser_range': self.min_range,
        }
        base.update(self.params)
        return base
