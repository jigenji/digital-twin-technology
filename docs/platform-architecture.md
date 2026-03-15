# OpenTwin Platform — アーキテクチャドキュメント

## 概要

OpenTwinは、Palantir Foundryのオントロジー設計に忠実な、ベンダー非依存のデジタルツイン統合基盤です。
企業レベルのセマンティックモデリング（オントロジー）と物理世界のデジタルツイン技術（ROS 2、SLAM、OPC-UA等）を融合し、
少数の**普遍的プリミティブ**の組み合わせであらゆるドメインのシナリオを表現できます。

## 設計原則

### Foundryの普遍的プリミティブ

| プリミティブ | 意味 | 実装 |
|------------|------|------|
| **ObjectType** | エンティティの型定義 | `platform/core/src/ontology/types.ts` |
| **Property** | 型に属する属性（スカラー＋空間） | `PropertyDef` in `types.ts` |
| **LinkType** | 2つの型の関係 | `LinkType` in `types.ts` |
| **Action** | 外部への書き込み操作 | `OntologyAction` in `actions.ts` |
| **Function** | 読み取り専用の計算 | `OntologyFunction` in `actions.ts` |

ドメイン固有のクラスは存在しません。「ロボット」も「工場」も「注文」も、同じObjectTypeとして定義されます。

### 3D空間×オントロジー統合

PropertyTypeを拡張し、スカラー値と3D空間表現を同じオントロジー内で扱います:

```
PropertyType:
  ├── スカラー: string, int, float, bool, datetime
  ├── 空間:     geo_point, geo_pose, transform3d, mesh, pointcloud, occupancy_grid, image
  └── 複合:     timeseries, json, reference
```

USDのPrimモデルに倣い、TwinInstanceは同時にスカラープロパティと空間状態を持ちます:

```
TwinInstance
├── scalar properties  : { battery: 80, temperature: 42.3 }
├── spatial properties : { pose, mesh_uri, pointcloud_uri }
├── spatial_context_id : どの3D空間に存在するか
├── timeline           : プロパティ変更履歴
└── links              : 他のツインとの関係
```

**SpatialContext**（USD Stageに相当）が3D空間そのものを表現し、
その中に存在するツインが`pose`プロパティで位置・姿勢を持ちます。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 6: Intelligence         (Palantir AIP)                   │
│  AIFunction, AgentDefinition                                    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 5.5: Business Logic                                      │
│  Rule, Workflow, Alert, RuleEngine                              │
├─────────────────────────────────────────────────────────────────┤
│  Layer 5: Ontology             (Palantir Foundry Ontology)      │
│  OntologyRegistry (OMS) / TwinRegistry (OSS) / DataFunnel      │
│  OntologyBinder → 各レイヤー自動連動                              │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: Application          (Workshop / Vertex)              │
│  Dashboard Web UI (Express + WebSocket)                         │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Simulation           (CARLA / Gazebo / Omniverse)     │
│  SimEnvironment, Sim2RealPipeline, WhatIfScenario               │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Edge Control         (ROS 2 / Nav2 / Autoware)        │
│  SLAMConfig, NavigationConfig, ControlLoop, EdgeNode            │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Sensing              (LiDAR / Camera / IMU / OPC-UA)  │
│  SensorSpec, FusionPipeline, DeviceProfile                      │
├─────────────────────────────────────────────────────────────────┤
│  Layer 0: Data Integration     (Foundry Data Connection)        │
│  ConnectorDef, StreamPipeline, DataLineage                      │
│  Bridge: MQTT / OPC-UA / ROS 2                                  │
├─────────────────────────────────────────────────────────────────┤
│  Layer -1: Deploy              (Palantir Apollo)                │
│  DeployManifest, EdgeProfile                                    │
└─────────────────────────────────────────────────────────────────┘
```

## オントロジーバインダー（核心メカニズム）

`OntologyBinder`はオントロジー定義の変更を監視し、各レイヤーへのバインディングを自動生成します:

```
ObjectType登録
  ├── → Layer 0: Kafkaトピック定義自動生成
  ├── → Layer 1: センサマッピング自動生成（空間/時系列プロパティから）
  └── (カスタムジェネレータで任意のレイヤーに拡張可能)

Action登録
  └── → Layer 2: ROS 2サービス定義自動生成

Function登録
  └── → Layer 6: AIエージェントツール定義自動生成
```

## マルチ言語構成

| コンポーネント | 言語 | ディレクトリ |
|-------------|------|------------|
| Core基盤 | TypeScript | `platform/core/` |
| Edge連携 | Python | `platform/edge/` |
| Dashboard | TypeScript + HTML/JS | `platform/dashboard/` |
| シナリオ定義 | YAML | `platform/scenarios/` |

## Foundryバックエンド3サービスの対応

| Foundryサービス | 役割 | OpenTwin実装 |
|---------------|------|-------------|
| **OMS** (Ontology Metadata Service) | 型定義の管理 | `OntologyRegistry` |
| **OSS** (Object Set Service) | インスタンスの読み取り/クエリ | `TwinRegistry` |
| **Object Data Funnel** | データ書き込みオーケストレーション | `DataFunnel` |

## 準拠技術一覧

| レイヤー | 準拠技術 |
|---------|---------|
| Sensing | ROS 2 sensor_msgs, TF2, URDF/xacro |
| Edge Control | ROS 2, Navigation2, SLAM Toolbox, Cartographer |
| Simulation | CARLA, Gazebo, NVIDIA Omniverse |
| Data Integration | Kafka, MQTT (paho), OPC-UA (asyncua) |
| Ontology | Palantir Foundry Ontology設計 |
| Application | Foundry Workshop / Vertex |
| Intelligence | Palantir AIP |
| Deploy | Palantir Apollo (プル型デプロイ) |
| 3D空間表現 | USD (概念), glTF, PCD, LAS, PGM |

## シナリオ例

`platform/scenarios/` に2つの例を用意:

1. **retail_robot.yaml** — 小売店舗ロボット: 自律走行、在庫チェック、棚管理
2. **factory_equipment.yaml** — 工場設備監視: CNC機械、AGV、環境センサ

どちらも**完全に同じ普遍的プリミティブ**だけで定義されています。

## API一覧

Dashboard REST API:

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/status` | プラットフォーム状態 |
| GET | `/api/ontology` | オントロジースキーマ |
| GET | `/api/bindings` | 自動生成バインディング一覧 |
| GET | `/api/twins` | ツイン一覧 |
| POST | `/api/twins` | ツイン作成 |
| GET | `/api/twins/:id` | ツイン詳細 |
| PATCH | `/api/twins/:id` | プロパティ更新 |
| DELETE | `/api/twins/:id` | ツイン削除 |
| GET | `/api/twins/:id/timeline` | プロパティ変更履歴 |
| GET | `/api/twins/:id/links` | リンク一覧 |
| POST | `/api/twins/:id/links` | リンク作成 |
| GET | `/api/alerts` | アラート一覧 |
| POST | `/api/alerts/:id/acknowledge` | アラート承認 |
| POST | `/api/alerts/:id/resolve` | アラート解決 |
| GET | `/api/workflows/definitions` | ワークフロー定義一覧 |
| GET | `/api/workflows/instances` | ワークフローインスタンス一覧 |
| POST | `/api/workflows/start` | ワークフロー開始 |
| WebSocket | `/ws` | リアルタイムツイン更新 |
