#!/usr/bin/env python3
"""デジタルツイン3Dモデリング技術 教科書 PDF生成スクリプト"""

from fpdf import FPDF

FONT_PATH = "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf"
FONT_PATH_P = "/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf"


class TextbookPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.add_font("IPAGothic", "", FONT_PATH, uni=True)
        self.add_font("IPAPGothic", "", FONT_PATH_P, uni=True)
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        if self.page_no() > 1:
            self.set_font("IPAGothic", "", 8)
            self.set_text_color(128, 128, 128)
            self.cell(0, 8, "デジタルツイン3Dモデリング技術 教科書", align="C")
            self.ln(10)
            self.set_draw_color(200, 200, 200)
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(2)

    def footer(self):
        self.set_y(-15)
        self.set_font("IPAGothic", "", 8)
        self.set_text_color(128, 128, 128)
        if self.page_no() > 1:
            self.cell(0, 10, f"- {self.page_no() - 1} -", align="C")

    def title_page(self):
        self.add_page()
        self.ln(60)
        self.set_font("IPAGothic", "", 28)
        self.set_text_color(20, 60, 120)
        self.cell(0, 15, "デジタルツイン", align="C")
        self.ln(18)
        self.cell(0, 15, "3Dモデリング技術", align="C")
        self.ln(25)
        self.set_font("IPAPGothic", "", 14)
        self.set_text_color(80, 80, 80)
        self.cell(0, 10, "現実世界を3Dデジタルモデルとして再構築する技術の包括的ガイド", align="C")
        self.ln(50)
        self.set_font("IPAGothic", "", 11)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "工場・都市・インフラなど現実世界の環境を", align="C")
        self.ln(8)
        self.cell(0, 8, "デジタルな3Dモデルとして構築する技術を網羅的に解説", align="C")

    def chapter_title(self, title):
        self.add_page()
        self.set_font("IPAGothic", "", 22)
        self.set_text_color(20, 60, 120)
        self.cell(0, 15, title)
        self.ln(8)
        self.set_draw_color(20, 60, 120)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(10)

    def section_title(self, title):
        self.ln(6)
        self.set_font("IPAGothic", "", 15)
        self.set_text_color(40, 80, 140)
        self.cell(0, 10, title)
        self.ln(10)

    def subsection_title(self, title):
        self.ln(3)
        self.set_font("IPAGothic", "", 12)
        self.set_text_color(60, 60, 60)
        self.cell(0, 8, title)
        self.ln(8)

    def body_text(self, text):
        self.set_font("IPAPGothic", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 6, text)
        self.ln(2)

    def bullet(self, text, indent=15):
        x = self.get_x()
        self.set_font("IPAPGothic", "", 10)
        self.set_text_color(30, 30, 30)
        self.set_x(x + indent)
        self.cell(5, 6, "・")
        self.multi_cell(0, 6, text)
        self.ln(1)

    def table_row(self, cells, widths, header=False):
        self.set_font("IPAGothic" if header else "IPAPGothic", "", 9)
        if header:
            self.set_fill_color(20, 60, 120)
            self.set_text_color(255, 255, 255)
        else:
            self.set_fill_color(245, 245, 250)
            self.set_text_color(30, 30, 30)
        h = 7
        for i, (cell, w) in enumerate(zip(cells, widths)):
            self.cell(w, h, cell, border=1, fill=True)
        self.ln(h)


def build_textbook():
    pdf = TextbookPDF()

    # ===== 表紙 =====
    pdf.title_page()

    # ===== 目次 =====
    pdf.add_page()
    pdf.set_font("IPAGothic", "", 20)
    pdf.set_text_color(20, 60, 120)
    pdf.cell(0, 15, "目次")
    pdf.ln(15)

    toc = [
        ("第1章", "デジタルツインの概要"),
        ("第2章", "3Dモデリングの基盤技術"),
        ("第3章", "データ取得技術"),
        ("第4章", "3Dモデル構築パイプライン"),
        ("第5章", "主要プラットフォームとツール"),
        ("第6章", "産業別応用事例"),
        ("第7章", "先端技術トレンド"),
        ("第8章", "導入ガイドと今後の展望"),
    ]
    for num, title in toc:
        pdf.set_font("IPAGothic", "", 12)
        pdf.set_text_color(40, 80, 140)
        pdf.cell(25, 9, num)
        pdf.set_font("IPAPGothic", "", 12)
        pdf.set_text_color(30, 30, 30)
        pdf.cell(0, 9, title)
        pdf.ln(9)

    # ===== 第1章 =====
    pdf.chapter_title("第1章  デジタルツインの概要")

    pdf.section_title("1.1 デジタルツインとは")
    pdf.body_text(
        "デジタルツイン（Digital Twin）とは、現実世界に存在する物理的な対象物——建物、工場、都市、インフラ、"
        "さらには人体——をセンサーデータや3Dスキャン技術によって仮想空間上に忠実に再現したデジタルモデルである。"
        "単なる3D形状の複製にとどまらず、リアルタイムのセンサーデータと連携し、物理世界の状態を継続的に"
        "反映・シミュレーションできる点が最大の特徴である。"
    )
    pdf.body_text(
        "この概念は2002年にMichael Grieves教授がミシガン大学でProduct Lifecycle Management（PLM）の"
        "文脈で初めて提唱した。その後、NASAが宇宙機の運用監視に適用したことで注目を集め、"
        "Industry 4.0の進展とIoT技術の普及により、製造業・建設・都市計画など幅広い分野で"
        "急速に導入が進んでいる。"
    )

    pdf.section_title("1.2 デジタルツインの構成要素")
    pdf.body_text("デジタルツインは以下の主要な構成要素から成り立つ:")
    pdf.bullet("物理空間（Physical Space）: 現実世界の対象物。建物、設備、都市インフラなど。")
    pdf.bullet("仮想空間（Virtual Space）: 3Dモデル、シミュレーション環境、データ可視化レイヤー。")
    pdf.bullet("データ接続（Data Connection）: IoTセンサー、LiDAR、カメラなどによるリアルタイムデータ連携。")
    pdf.bullet("分析・AI層: 機械学習や物理シミュレーションによる予測・最適化エンジン。")
    pdf.bullet("ユーザーインターフェース: ダッシュボード、AR/VR、Webビューアなどの操作・閲覧手段。")

    pdf.section_title("1.3 デジタルツインの成熟度モデル")
    pdf.body_text("デジタルツインの発展段階は一般的に以下の5レベルに分類される:")
    pdf.bullet("Level 1 — 3Dビジュアライゼーション: 静的な3Dモデルによる現実の可視化。")
    pdf.bullet("Level 2 — データ統合: IoTセンサーデータとモデルの連携。リアルタイム状態監視。")
    pdf.bullet("Level 3 — シミュレーション: What-if分析やシナリオシミュレーションの実行。")
    pdf.bullet("Level 4 — 予測分析: AIによる故障予測、性能最適化、異常検知。")
    pdf.bullet("Level 5 — 自律最適化: デジタルツインが自律的に判断し物理世界にフィードバック。")

    # ===== 第2章 =====
    pdf.chapter_title("第2章  3Dモデリングの基盤技術")

    pdf.section_title("2.1 3Dデータの表現形式")

    pdf.subsection_title("2.1.1 点群（Point Cloud）")
    pdf.body_text(
        "LiDARや写真測量で取得される最も基本的な3Dデータ形式。各点は(x, y, z)座標と"
        "オプションで色情報（RGB）、反射強度（Intensity）を持つ。数百万〜数十億点で"
        "構成される大規模データであり、ファイル形式としてはLAS/LAZ、PLY、E57などが標準的に使用される。"
    )

    pdf.subsection_title("2.1.2 メッシュ（Mesh）")
    pdf.body_text(
        "点群を三角形や四角形のポリゴンで接続し、連続的な表面を構成したもの。"
        "OBJ、FBX、glTF/GLBなどの形式で保存される。ゲームエンジンやCADソフトウェアとの"
        "互換性が高く、レンダリングや物理シミュレーションに適している。"
    )

    pdf.subsection_title("2.1.3 BIM（Building Information Modeling）")
    pdf.body_text(
        "建築・建設分野に特化したパラメトリックな3Dモデル形式。幾何学的情報に加え、"
        "材質・コスト・施工スケジュールなどの属性情報を包含する。IFC（Industry Foundation "
        "Classes）が国際標準フォーマットであり、Autodesk Revit、ArchiCADなどが主要ツールとなる。"
    )

    pdf.subsection_title("2.1.4 ボクセル（Voxel）")
    pdf.body_text(
        "3D空間をグリッド状に区切った立方体（ボクセル）の集合で表現する形式。"
        "医療画像（CT/MRI）や地質モデルで広く使用される。体積情報を自然に表現でき、"
        "Boolean演算が容易だが、高解像度ではデータ量が膨大になる。"
    )

    pdf.subsection_title("2.1.5 NeRF / 3D Gaussian Splatting")
    pdf.body_text(
        "近年急速に発展した暗黙的な3D表現手法。NeRF（Neural Radiance Fields）は"
        "ニューラルネットワークで3Dシーンの放射輝度場を学習し、任意視点からの画像を生成する。"
        "3D Gaussian Splattingは、3D空間にガウス分布を配置して高速かつ高品質な"
        "リアルタイムレンダリングを実現する最新技術である。"
    )

    pdf.section_title("2.2 座標系と測地系")
    pdf.body_text(
        "3Dモデルの精度と互換性を確保するために、適切な座標系の選択と管理が不可欠である。"
        "ローカル座標系（プロジェクト固有）、国家座標系（日本測地系2011等）、"
        "グローバル座標系（WGS84、ECEF）を目的に応じて使い分ける必要がある。"
        "EPSG コードによる座標参照系の管理と、座標変換の精度管理が実務上重要である。"
    )

    # ===== 第3章 =====
    pdf.chapter_title("第3章  データ取得技術")

    pdf.section_title("3.1 LiDAR（Light Detection and Ranging）")
    pdf.body_text(
        "レーザー光を照射し、反射光が戻るまでの時間差から距離を計測する技術。"
        "地上型（TLS）、車載型（MLS）、航空型（ALS）、そしてiPhoneのLiDARセンサーのような"
        "モバイル型に分類される。測定精度はmm〜cm級で、建築物・プラント・地形の"
        "高精度な3D計測に広く活用されている。"
    )

    widths = [40, 35, 35, 40, 40]
    pdf.table_row(["種類", "精度", "計測範囲", "主な用途", "代表製品"], widths, header=True)
    pdf.table_row(["地上型(TLS)", "1-3mm", "数百m", "建築/プラント", "Leica RTC360"], widths)
    pdf.table_row(["車載型(MLS)", "5-10mm", "数十m", "道路/都市計測", "RIEGL VMX-2HA"], widths)
    pdf.table_row(["航空型(ALS)", "数cm", "数km", "地形/森林", "Leica SPL100"], widths)
    pdf.table_row(["モバイル型", "1-3cm", "5m", "室内/小規模", "iPhone Pro"], widths)

    pdf.section_title("3.2 フォトグラメトリ（写真測量法）")
    pdf.body_text(
        "複数の写真から3Dモデルを生成する技術。SfM（Structure from Motion）アルゴリズムにより"
        "カメラ位置と3D構造を同時推定し、MVS（Multi-View Stereo）で密な点群を生成する。"
        "ドローン搭載カメラとの組み合わせで、広範囲の地形・建物の3Dモデル化が可能。"
        "代表的なソフトウェアとして、Agisoft Metashape、RealityCapture、"
        "OpenDroneMapなどがある。"
    )

    pdf.section_title("3.3 SLAM（Simultaneous Localization and Mapping）")
    pdf.body_text(
        "自己位置推定と環境地図構築を同時に行う技術。ロボットやドローンに搭載し、"
        "移動しながらリアルタイムで3Dマップを構築する。Visual SLAM（カメラベース）と"
        "LiDAR SLAMがあり、NavVis、GeoSLAM、Matterportなどの製品が"
        "屋内環境の3Dキャプチャに広く使われている。"
    )

    pdf.section_title("3.4 IoTセンサーデータ")
    pdf.body_text(
        "温度、湿度、振動、電力消費、稼働状態などの動的データをリアルタイムに収集し、"
        "3Dモデルと統合する。MQTT、OPC UA、Modbusなどの通信プロトコルが使われ、"
        "エッジコンピューティングとクラウドの組み合わせでデータパイプラインを構築する。"
        "これにより3Dモデルが「生きた」デジタルツインとして機能する。"
    )

    # ===== 第4章 =====
    pdf.chapter_title("第4章  3Dモデル構築パイプライン")

    pdf.section_title("4.1 データ前処理")
    pdf.body_text(
        "取得した生データから高品質な3Dモデルを構築するには、段階的な処理が必要である。"
    )
    pdf.bullet("ノイズ除去: 統計的外れ値除去（SOR）、半径外れ値除去（ROR）等のフィルタリング。")
    pdf.bullet("点群レジストレーション: ICP（Iterative Closest Point）アルゴリズムによる複数スキャンの位置合わせ。")
    pdf.bullet("座標変換: ローカル座標系からプロジェクト座標系への変換。GCP（地上基準点）による精度向上。")
    pdf.bullet("ダウンサンプリング: ボクセルグリッドフィルタ等によるデータ量の削減。")

    pdf.section_title("4.2 3D再構成")
    pdf.body_text(
        "前処理された点群データからサーフェスモデルを再構成する工程。"
    )
    pdf.bullet("ポアソン再構成: 点群の法線情報から滑らかな表面を生成する手法。")
    pdf.bullet("ドロネー三角形分割: 点群を三角形メッシュに変換する基本手法。")
    pdf.bullet("ボールピボッティング: 仮想的な球を点群上で転がして表面を生成する手法。")
    pdf.bullet("AI支援再構成: PointNet、PointNet++等のディープラーニングモデルによるセマンティックな再構成。")

    pdf.section_title("4.3 テクスチャマッピングとLOD")
    pdf.body_text(
        "テクスチャマッピングでは、写真データから色・質感情報をメッシュ表面に投影する。"
        "LOD（Level of Detail）管理により、視点からの距離に応じて3Dモデルの詳細度を"
        "動的に切り替え、パフォーマンスと品質のバランスを最適化する。"
        "CesiumJSの3D Tilesフォーマットが大規模モデルのストリーミング配信に広く使われている。"
    )

    pdf.section_title("4.4 セマンティックラベリング")
    pdf.body_text(
        "3Dモデルの各要素（壁、床、配管、設備等）に意味的なラベルを付与する工程。"
        "手動ラベリングに加え、PointNet系のディープラーニングモデルによる自動セグメンテーションが"
        "実用化されつつある。IFCスキーマやCityGMLとの連携により、"
        "BIMやGISとの相互運用性を確保する。"
    )

    # ===== 第5章 =====
    pdf.chapter_title("第5章  主要プラットフォームとツール")

    pdf.section_title("5.1 クラウドプラットフォーム")

    pdf.subsection_title("NVIDIA Omniverse")
    pdf.body_text(
        "NVIDIAが提供するリアルタイム3Dコラボレーションプラットフォーム。USD（Universal Scene "
        "Description）を基盤とし、物理シミュレーション（PhysX）、レイトレーシング（RTX）、"
        "AI推論を統合的に提供する。BMW、Siemens等が大規模工場のデジタルツインに採用。"
    )

    pdf.subsection_title("Autodesk Tandem")
    pdf.body_text(
        "Autodesk社のBIMベースデジタルツインプラットフォーム。RevitモデルをベースにIoTデータを統合し、"
        "建物の運用管理・施設管理を支援する。Forge APIによるカスタマイズが可能。"
    )

    pdf.subsection_title("Azure Digital Twins / AWS IoT TwinMaker")
    pdf.body_text(
        "クラウド大手が提供するデジタルツインPaaS。Azure Digital Twinsはグラフベースの"
        "ツインモデリング言語（DTDL）を使用し、AWS IoT TwinMakerはAWSサービス群と"
        "シームレスに統合する。いずれもIoTデータ連携とスケーラビリティに優れる。"
    )

    pdf.section_title("5.2 3Dエンジンとビューア")

    pdf.subsection_title("Unity / Unreal Engine")
    pdf.body_text(
        "ゲームエンジンをベースとした高品質リアルタイムレンダリング環境。"
        "Unreal EngineのNanite（仮想化ジオメトリ）やLumen（グローバルイルミネーション）は、"
        "大規模3Dモデルのリアルタイム表示を革新した。Cesium for Unrealプラグインにより"
        "地理空間データとの統合も容易になっている。"
    )

    pdf.subsection_title("CesiumJS / deck.gl")
    pdf.body_text(
        "Webブラウザ上で大規模3Dモデルを表示するオープンソースライブラリ。"
        "CesiumJSは3D Tilesフォーマットのストリーミングに対応し、地球規模の"
        "デジタルツインの可視化が可能。deck.glはUberが開発した大規模データ"
        "可視化ライブラリで、点群や地理空間データの高速描画に適している。"
    )

    pdf.section_title("5.3 オープンソースツール")
    pdf.bullet("CloudCompare: 点群・メッシュの処理・解析・可視化ツール。")
    pdf.bullet("Open3D: Intelが主導する3Dデータ処理ライブラリ（Python/C++）。")
    pdf.bullet("PCL（Point Cloud Library）: C++による高性能点群処理ライブラリ。")
    pdf.bullet("PDAL（Point Data Abstraction Library）: 点群データのETLパイプライン構築ツール。")
    pdf.bullet("Blender: 3Dモデリング・レンダリングの統合環境。Python APIによる自動化が可能。")
    pdf.bullet("FreeCAD: オープンソースの3D CADモデラー。パラメトリック設計に対応。")

    # ===== 第6章 =====
    pdf.chapter_title("第6章  産業別応用事例")

    pdf.section_title("6.1 製造業")
    pdf.body_text(
        "製造業はデジタルツイン技術の最も先進的な導入分野である。"
        "Siemensは自社工場（アンベルク工場）の完全なデジタルツインを構築し、"
        "生産ラインの最適化、予知保全、新製品の仮想検証を実現している。"
        "BMWはNVIDIA Omniverseを使用し、世界中の工場レイアウトを仮想空間で"
        "設計・最適化している。日本ではトヨタ、ファナック、三菱電機などが"
        "独自のデジタルツインソリューションを展開している。"
    )

    pdf.section_title("6.2 建設・建築")
    pdf.body_text(
        "BIMとデジタルツインの統合により、設計→施工→運用の全ライフサイクルを"
        "デジタルで管理する取り組みが進む。大林組、清水建設、鹿島建設などの"
        "ゼネコンが建設現場のデジタルツインを構築し、進捗管理や安全管理に活用。"
        "竣工後も施設管理（FM）デジタルツインとして建物の運用最適化に利用される。"
    )

    pdf.section_title("6.3 スマートシティ")
    pdf.body_text(
        "都市全体のデジタルツインにより、交通シミュレーション、防災計画、"
        "エネルギー管理、都市開発の意思決定を支援する。シンガポールの"
        "Virtual Singaporeプロジェクト、東京都のProject PLATEAUが代表的な事例。"
        "PLATEAUは日本全国の3D都市モデルをオープンデータとして公開し、"
        "CityGML形式で約600都市のデータを整備している。"
    )

    pdf.section_title("6.4 エネルギー・インフラ")
    pdf.body_text(
        "発電プラント、送電網、風力タービン、石油プラントなどの大規模インフラの"
        "監視・最適化にデジタルツインが活用される。GEのPredixプラットフォームは"
        "風力タービンのデジタルツインにより発電量の最適化と予知保全を実現。"
        "シェルはプラント全体のデジタルツインにより運用効率を向上させている。"
    )

    pdf.section_title("6.5 医療・ヘルスケア")
    pdf.body_text(
        "人体のデジタルツインにより、個別化医療や手術シミュレーションを実現する。"
        "Siemens Healthineersの心臓デジタルツインは、患者固有の心臓モデルを構築し、"
        "治療計画の最適化を支援。PhilipsはICU（集中治療室）の"
        "デジタルツインによる患者モニタリングシステムを展開している。"
    )

    # ===== 第7章 =====
    pdf.chapter_title("第7章  先端技術トレンド")

    pdf.section_title("7.1 AI/機械学習との融合")
    pdf.body_text(
        "生成AI・大規模言語モデル（LLM）のデジタルツインへの統合が急速に進展している。"
        "自然言語による3Dモデルの操作・クエリ、AIによる自動3Dモデル生成、"
        "異常検知・予知保全の高度化などが実現されつつある。"
        "NVIDIA ACEによるAIアバター、Foundation Modelによる3D理解など、"
        "AI技術がデジタルツインの能力を大きく拡張している。"
    )

    pdf.section_title("7.2 3D Gaussian Splatting")
    pdf.body_text(
        "2023年に登場した革新的な3D表現技術。従来のNeRFと比較して、"
        "リアルタイムレンダリング（100+ FPS）を実現しつつ、高い視覚品質を維持する。"
        "トレーニング速度もNeRFの数十倍に高速化。都市規模のシーン再構成や、"
        "動的シーンの4D表現など、急速に研究・応用が拡大している。"
        "LumaAI、Polycamなどのサービスが消費者向けの3Dキャプチャに展開。"
    )

    pdf.section_title("7.3 WebGPU / クラウドレンダリング")
    pdf.body_text(
        "WebGPUの標準化により、ブラウザ上でのGPUアクセラレーテッドな"
        "3Dレンダリングが実用段階に入りつつある。Three.jsのWebGPUレンダラ、"
        "Babylonian.jsなどのフレームワークがWebGPU対応を進めている。"
        "また、NVIDIA CloudXRやGoogle Immersive Streamによるクラウドレンダリングにより、"
        "端末性能に依存しない高品質な3D体験が可能になっている。"
    )

    pdf.section_title("7.4 メタバースとの融合")
    pdf.body_text(
        "デジタルツインとメタバースの融合により、物理世界の正確な複製を"
        "没入的な仮想空間で体験・操作できるようになる。工場見学の仮想化、"
        "遠隔地からの設備操作、建築デザインレビューなど、実用的なユースケースが拡大。"
        "Apple Vision ProやMeta Quest Proなどの空間コンピューティングデバイスが"
        "デジタルツインの新しいインタラクション手段を提供している。"
    )

    # ===== 第8章 =====
    pdf.chapter_title("第8章  導入ガイドと今後の展望")

    pdf.section_title("8.1 導入ステップ")
    pdf.body_text("デジタルツインの導入は以下のステップで進めることが推奨される:")
    pdf.bullet("Step 1 — 目的定義: 何を解決したいのかを明確にし、ROIの仮説を立てる。")
    pdf.bullet("Step 2 — 現状調査: 既存の3Dデータ、CAD/BIMモデル、センサーインフラの棚卸し。")
    pdf.bullet("Step 3 — PoC実施: 限定的な範囲でプロトタイプを構築し、効果を検証する。")
    pdf.bullet("Step 4 — データパイプライン構築: 継続的なデータ取得・更新の仕組みを整備。")
    pdf.bullet("Step 5 — スケールアウト: 成功パターンを横展開し、全社的なプラットフォームへ拡大。")

    pdf.section_title("8.2 技術選定のポイント")
    pdf.body_text(
        "デジタルツイン技術の選定においては、以下の観点を考慮する必要がある:"
    )
    pdf.bullet("精度要件: mm級の精度が必要か、cm級で十分かによりセンサーと処理手法が異なる。")
    pdf.bullet("リアルタイム性: 静的なモデルで良いか、リアルタイム更新が必要かで全体アーキテクチャが変わる。")
    pdf.bullet("スケーラビリティ: 単一建物か、複数拠点か、都市規模かでプラットフォーム選定が変わる。")
    pdf.bullet("相互運用性: 既存システム（ERP、MES、SCADA等）との連携要件を確認する。")
    pdf.bullet("コスト: 初期投資（スキャン機材、ソフトウェアライセンス）と運用コスト（クラウド、保守）のバランス。")

    pdf.section_title("8.3 今後の展望")
    pdf.body_text(
        "デジタルツイン市場は2025年時点で約500億ドル規模に成長し、2030年には1500億ドルを"
        "超えると予測されている。特に以下のトレンドが今後の発展を牽引する:"
    )
    pdf.bullet("生成AIによる3Dモデル自動生成: テキストや画像から直接3Dモデルを生成する技術の実用化。")
    pdf.bullet("Edge Computing + 5G/6G: 超低遅延のリアルタイムデジタルツインの実現。")
    pdf.bullet("自律型デジタルツイン: AIが自ら判断し物理世界を最適化するクローズドループの実現。")
    pdf.bullet("デジタルツインの民主化: ノーコード/ローコードツールによる導入障壁の低下。")
    pdf.bullet("標準化の進展: Digital Twin Consortium、ISO 23247等による国際標準の整備。")

    pdf.body_text(
        "デジタルツイン技術は、物理世界とデジタル世界の境界を消失させ、"
        "あらゆる産業の意思決定と運用を革新する基盤技術である。"
        "本書で解説した3Dモデリング技術、データ取得手法、プラットフォーム群を"
        "組み合わせることで、読者の組織においてもデジタルツインの構築と"
        "活用が可能になることを期待する。"
    )

    # 出力
    pdf.output("docs/digital-twin-textbook.pdf")
    print("PDF generated: docs/digital-twin-textbook.pdf")


if __name__ == "__main__":
    build_textbook()
