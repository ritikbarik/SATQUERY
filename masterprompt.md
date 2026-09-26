# SATQUERY AI — MASTER IMPLEMENTATION SPECIFICATION
## Agentic Remote-Sensing, Bi-Temporal Change Detection & Geospatial Intelligence Platform
### SIH26167

---

# 1. Purpose

SatQuery AI is a production-grade conversational remote-sensing and geospatial intelligence platform designed around SIH26167.

The system combines:

- High-resolution satellite imagery
- Multispectral Earth Observation imagery
- SAR/radar imagery
- Geospatial analysis
- Computer vision
- Vision-Language AI
- Natural-language satellite querying
- Bi-temporal change detection
- Change-based VQA
- Agentic query routing
- Interactive geospatial visualization
- Grounded AI explanations
- Intelligence report generation

The existing application must be **extended and improved, not replaced**.

Do not create a separate demo application.
Do not unnecessarily rewrite existing functionality.
Preserve all existing working features.

---

# 2. Technology Stack

## Frontend

- React 18
- TypeScript
- Vite
- React-Leaflet v4/v5
- Leaflet
- Lucide React
- jsPDF
- Vanilla CSS
- Existing dark/glassmorphic design system

## Backend

- Python 3.12
- FastAPI
- Uvicorn
- PyTorch
- HuggingFace Transformers
- Qwen3-VL / Qwen-VL
- Remote-sensing models where appropriate
- Raster/vector processing libraries
- httpx for asynchronous GIS/API requests

## Geospatial and Satellite Data

Support appropriate authentic sources such as:

- Mappls Satellite
- ESRI World Imagery
- Sentinel-2 multispectral imagery
- ISRO/Bhuvan resources where available
- Cartosat imagery where available
- RISAT/SAR datasets where available
- OpenStreetMap/Nominatim for geographic lookup
- Authentic administrative GeoJSON boundaries

Never fabricate satellite imagery, measurements, coordinates, historical observations, or analytical results.

---

# 3. Core Product Goal

Users should be able to ask natural-language questions about satellite imagery.

Examples:

- "How many houses are in this area?"
- "Show the vegetation."
- "Identify the water bodies."
- "What is the built-up area?"
- "Compare this area between 2021 and 2026."
- "Show how this area changed in the last five years."
- "Where did new construction occur?"
- "Did vegetation decrease?"
- "Did the water body shrink?"
- "Which region experienced the most change?"

The system must understand the query and automatically select the appropriate analysis workflow.

---

# 4. Agentic Query Router

Implement an agentic query-routing layer that determines:

1. User intent
2. Geographic region
3. Area of Interest (AOI)
4. Required imagery
5. Required dates/time periods
6. Required analytical method
7. Required model/tool
8. Required output format

Supported intents should include:

```text
SINGLE_IMAGE_VQA
OBJECT_DETECTION
OBJECT_COUNTING
LAND_COVER_CLASSIFICATION
VEGETATION_ANALYSIS
WATER_ANALYSIS
BUILT_UP_ANALYSIS
BI_TEMPORAL_CHANGE
CHANGE_VQA
OPTICAL_SAR_ANALYSIS
BOUNDARY_QUERY
GEOLOCATION_QUERY
GENERAL_REMOTE_SENSING_QUERY
```

Do not route every query directly to Qwen3-VL.

Use deterministic geospatial processing whenever quantitative measurements are required.

---

# 5. Area of Interest (AOI)

Users must be able to define an AOI through:

- Mappls location search
- Map click
- City/town selection
- Selection rectangle
- Polygon selection where supported
- Administrative boundary selection
- Capture View

Preserve the existing `isSelectionMode` functionality.

Store AOI information such as:

```text
latitude
longitude
bbox
polygon
zoom
map bounds
place name
```

The AOI must be passed to the backend in a structured format.

---

# 6. Map Capture Pipeline

Preserve the existing map-capture functionality.

When the user clicks "Capture View":

```text
Map View
    ↓
Raster Capture
    ↓
PNG/File Object
    ↓
T1 / T2 / SAR Imagery Panel
    ↓
Analysis Pipeline
```

The captured image should be available to the analysis workflow without unnecessary manual download/upload steps.

---

# 7. Administrative Boundaries

When the user selects an Indian state, district, city, or other administrative region:

**Never draw a rectangular bounding box as the administrative boundary.**

Use authentic:

- Polygon
- MultiPolygon
- GeoJSON

Maintain the existing boundary service:

```http
GET /api/boundary?q={place}
```

The service should:

- Serve cached GeoJSON from `backend/app/data/boundaries/` where available.
- Dynamically obtain and cache authentic boundaries for unvisited regions where required.

Render using React-Leaflet GeoJSON.

Maintain the existing:

- Electric-blue stroke
- Dashed boundary
- Translucent fill
- Automatic bounds fitting

The boundary should represent the real geographic contour.

---

# 8. Precision Geocoding

Maintain the existing urban-core prioritization.

Prefer actual:

```text
city
town
suburb
place
```

over generic administrative district centroids when resolving locations.

Maintain the existing precision needle marker.

The marker should point directly to the resolved geographic coordinate.

---

# 9. Single Image Analysis

Support:

- Visual Question Answering
- Object detection
- Object counting
- Building detection
- Road detection
- Water-body detection
- Land-cover classification
- Vegetation analysis
- NDVI
- NDWI
- NDBI

For queries such as:

> "How many houses are there?"

use an appropriate detection/counting workflow where possible rather than relying only on generic VLM estimation.

Return, where available:

```text
object count
confidence
bounding boxes
feature locations
classification
```

Do not invent detections.

---

# 10. Bi-Temporal Change Detection

Bi-temporal analysis is a core SIH26167 capability.

The system must compare two observations of the same AOI from different periods.

Example:

```text
T1 = 2021
T2 = 2026
```

Do not hard-code these years.

Support arbitrary comparisons such as:

```text
2018 → 2024
2020 → 2025
2021 → 2026
```

For:

> "Show changes in the last five years."

automatically determine the historical and current periods based on the current date.

---

# 11. Temporal Imagery Workflow

The temporal workflow must be:

```text
User Query
    ↓
AOI Identification
    ↓
Determine T1
    ↓
Determine T2
    ↓
Satellite Data Search
    ↓
Cloud / Quality Filtering
    ↓
AOI Cropping
    ↓
Resolution Matching
    ↓
Spatial Alignment
    ↓
Bi-Temporal Analysis
```

Do not require an exact acquisition date when it produces poor or unavailable imagery.

Use an appropriate date window.

Maintain metadata including:

- Acquisition date
- Sensor
- Resolution
- Cloud coverage
- CRS
- AOI
- Data source
- Band information where applicable

---

# 12. Satellite Data

Prefer authentic Earth Observation data.

Primary optical source:

**Sentinel-2 multispectral imagery**

Also support appropriate sources where available:

- Mappls Satellite
- ESRI World Imagery
- Sentinel-2
- ISRO/Bhuvan
- Cartosat
- RISAT/SAR

Use actual satellite observations for scientific analysis whenever possible.

Do not use random web images as scientific evidence.

---

# 13. Geospatial Raster Format

The internal scientific workflow should support:

```text
GeoTIFF
TIFF
```

Preserve:

- CRS
- Transform
- Resolution
- Bounds
- Acquisition date
- Sensor
- Band information

PNG/JPEG may be generated for frontend visualization.

Do not discard geospatial metadata unnecessarily.

---

# 14. Image Preprocessing

Before temporal comparison:

1. Clip both images to the same AOI.
2. Filter clouds.
3. Remove poor-quality observations.
4. Match spatial resolution.
5. Match coordinate systems where required.
6. Co-register/alignment-check the images.
7. Normalize imagery where appropriate.
8. Ensure identical spatial coverage.
9. Generate visualization-ready images.

T1 and T2 must represent the same geographic area before pixel/index comparison.

---

# 15. Vegetation Analysis

Implement NDVI.

Formula:

```text
NDVI = (NIR - Red) / (NIR + Red)
```

For Sentinel-2, use appropriate bands such as:

```text
NIR = B08
Red = B04
```

Generate:

```text
NDVI_T1
NDVI_T2
NDVI_difference
```

Determine, when supported:

```text
Vegetation_T1
Vegetation_T2
Vegetation_Change
```

Only display actual calculated values.

---

# 16. Water Analysis

Implement NDWI or another appropriate water-detection method.

Generate:

```text
Water_T1
Water_T2
Water_difference
```

Identify where supported:

- Water expansion
- Water reduction
- Newly appearing water
- Disappearing water
- Significant water-body change

Do not claim changes unsupported by the underlying data.

---

# 17. Built-Up Analysis

Implement NDBI and/or an appropriate built-up classification method.

Generate:

```text
BuiltUp_T1
BuiltUp_T2
BuiltUp_difference
```

Identify where supported:

- Urban expansion
- New built-up regions
- Road development
- Infrastructure growth
- Land-use conversion

Do not claim individual building construction from low-resolution imagery unless supported by suitable high-resolution data or an appropriate detection model.

---

# 18. General Change Detection Engine

Create a dedicated change-detection service.

Core workflow:

```text
T1 Image
    +
T2 Image
    ↓
Image Difference
    +
Spectral Index Difference
    +
Land-Cover Comparison
    ↓
Change Detection
    ↓
Change Map
```

Possible classes:

```text
Stable
Vegetation Change
Built-up Change
Water Change
Bare Land Change
Other Significant Change
```

Provide confidence/uncertainty where appropriate.

---

# 19. Change Map

Generate a spatial change layer.

Allow users to toggle:

```text
Historical Image
Current Image
Change Map
NDVI
NDWI
NDBI
Vegetation
Water
Built-up
Administrative Boundary
```

Provide a clear legend.

All change layers must remain spatially aligned with the imagery.

---

# 20. Before / After Temporal Viewer

Add a dedicated temporal comparison viewer without replacing the existing map.

Main presentation:

```text
┌──────────────────────┬──────────────────────┐
│      HISTORICAL      │       CURRENT        │
│       T1 / 2021      │       T2 / 2026      │
│                      │                      │
│    Satellite Image   │    Satellite Image   │
└──────────────────────┴──────────────────────┘
```

Also implement an interactive swipe comparison:

```text
T1  ◀────────●────────▶  T2
```

The slider must keep both images spatially synchronized.

Display:

- Historical date
- Current date
- Sensor
- Resolution
- Cloud/quality information where available
- Reset slider
- Zoom
- Pan

---

# 21. Qwen3-VL Role

Qwen3-VL should act primarily as the visual reasoning and explanation layer.

Do not make Qwen3-VL solely responsible for quantitative geospatial change calculation.

Provide it with:

```text
Historical image
Current image
Change map
Remote-sensing statistics
AOI information
User query
```

Qwen3-VL should answer:

- What changed?
- Where did the change occur?
- What visible patterns changed?
- Did vegetation increase or decrease?
- Did built-up areas expand?
- Did water bodies change?
- What are the most significant visible changes?

The response should distinguish:

```text
Observed
Calculated
Model-derived
Inferred
Uncertain
```

Unsupported conclusions must not be presented as confirmed measurements.

---

# 22. Change-Based VQA

Support conversational questions over temporal imagery.

Examples:

```text
"What changed between 2021 and 2026?"

"Are there more buildings now?"

"Where did development occur?"

"Did vegetation decrease?"

"Which region experienced the most change?"

"Did the water body shrink?"

"How much built-up area increased?"
```

The agentic router should send each question to the appropriate analytical module.

---

# 23. Optical + SAR Analysis

Maintain multimodal analysis.

Use optical imagery for:

- Spectral information
- Vegetation
- Water
- Land-cover
- Visual interpretation

Use SAR for:

- Structural information
- Radar observations
- Cloud-penetrating monitoring
- Complementary analysis

Maintain the existing:

```text
T1
T2
SAR
```

imagery workflow.

---

# 24. Feature Annotation Viewer

Maintain the existing deep-zoom viewer.

Support:

```text
100%
200%
300%
400%
```

Provide:

- Zoom
- Pan
- Reset
- Bounding boxes
- Confidence scores
- Water polygons
- Detected feature overlays

Annotations must be spatially aligned with the source imagery.

---

# 25. GeoJSON Analysis Layers

Maintain:

```http
GET /api/geojson?location={name}&layers={vegetation,water,builtUp}
```

Support vector layers for:

- Vegetation
- Water
- Built-up
- Change
- Administrative boundaries

Never generate fake geographic features.

---

# 26. API Specification

Maintain and extend the existing API architecture.

Required functionality:

```http
GET /api/boundary?q={place}

GET /api/autosuggest?q={query}&limit=6

GET /api/geocode?q={query}

POST /api/rs/analyze

POST /api/rs/change-detection

GET /api/geojson?location={name}&layers={vegetation,water,builtUp}

POST /api/satellite/search

POST /api/aoi
```

Reuse equivalent existing endpoints instead of creating duplicates.

---

# 27. Change Detection API

Implement or extend:

```http
POST /api/rs/change-detection
```

Input:

```text
AOI
historical date/range
current date/range
query
optional imagery
```

Return structured data similar to:

```json
{
  "aoi": {},
  "historical": {},
  "current": {},
  "change_summary": {},
  "statistics": {},
  "change_layers": {},
  "detections": [],
  "confidence": {},
  "ai_explanation": ""
}
```

Adapt this structure to the existing backend conventions.

---

# 28. Frontend UI Changes

Do **not redesign the entire UI**.

Extend the existing SatQuery interface with a focused temporal-analysis workflow.

The three main UI additions are:

1. Temporal controls
2. Before/After viewer
3. Change analysis panel

---

# 29. Temporal Controls

Add an analysis mode inside the existing query/analysis area:

```text
Analysis Mode

○ Single Image
● Temporal Comparison
○ Optical + SAR
```

When Temporal Comparison is selected:

```text
Historical
[ 2021 ▼ ]

Current
[ 2026 ▼ ]
```

For:

> "last 5 years"

automatically populate the appropriate historical/current periods.

Do not restrict the controls to 2021 and 2026.

---

# 30. UI Before / After Viewer

Inside the existing center map area, add:

```text
[ Map ] [ Before / After ] [ Change Map ]
```

Before/After should display:

```text
┌─────────────────┬─────────────────┐
│      2021       │      2026       │
│   Historical    │     Current     │
│                 │                 │
│ Satellite Image │ Satellite Image │
└─────────────────┴─────────────────┘
```

Provide a synchronized swipe slider.

This should be the main visual feature of temporal analysis.

---

# 31. Change Map UI

Add a layer control:

```text
Layers

☑ Current
☐ Historical
☐ Change Detection
☐ Vegetation
☐ Water
☐ Built-up
```

When Change Detection is enabled, show the detected change overlay.

Provide a clear legend.

---

# 32. Change Statistics UI

Extend the existing Metrics Explorer instead of creating unnecessary duplicate panels.

Example:

```text
CHANGE SUMMARY

2021 → 2026

Vegetation
-18%

Built-up
+24%

Water
-5%

Major Change
Urban expansion
```

Only show numbers when actually calculated.

If a value cannot be calculated reliably, show:

```text
Unavailable
```

rather than inventing a number.

---

# 33. AI Change Summary UI

Add an AI explanation section to the existing AI Output Drawer or right-side analysis area.

Example:

```text
AI CHANGE SUMMARY

Qwen3-VL identified significant changes
in the selected area.

• New built-up regions detected
• Vegetation reduced in the affected region
• Road/infrastructure expansion visible

[ View Detailed Analysis ]
```

Clearly distinguish model observations from quantitative measurements.

---

# 34. Existing UI Layout

Preserve the current three-column workspace:

```text
LEFT
- SatQuery Input
- Query Engine
- Temporal Controls

CENTER
- High-Resolution Satellite Map
- Provider Tabs
- Search
- Administrative Boundary
- Before/After Viewer
- Change Map
- AI Output Drawer

RIGHT
- Feature Annotation Viewer
- Metrics Explorer
- Change Statistics
- Detection Results
- AI Change Summary
```

---

# 35. UI Design

Maintain the existing premium dark glassmorphism.

Primary design language:

```text
Dark Navy
Slate
Electric Blue
Emerald
Amber
```

Existing colors include:

```text
#0B132B
#0F172A
#2563EB
#10B981
```

Use:

```text
system-ui / Inter
```

Maintain responsive behavior.

Do not unnecessarily redesign the interface.

---

# 36. Z-Index Rules

Preserve:

```text
topbar
z-index: 3000

location-dropdown-panel
z-index: 3500

map-sel-overlay
z-index: 1200

Leaflet map
base level
```

Ensure:

- Location dropdown is always above map toolbar buttons.
- Dropdowns do not overlap incorrectly.
- Modals dismiss on outside click.
- Menus dismiss on outside click.
- Controls remain usable on smaller screens.

---

# 37. Live Clock and Date

The existing **Live Clock and Date widget MUST remain**.

Do not remove it during:

- UI simplification
- Refactoring
- Redesign
- Component restructuring
- Feature additions

---

# 38. Existing Query Management

Maintain Save Query.

Store:

```text
query
coordinates
AOI
dates
imagery metadata
preview
analysis metrics
```

Maintain Reset Query.

Reset:

```text
question
T1
T2
SAR
results
detections
highlights
change layers
statistics
```

to the clean baseline.

---

# 39. Reporting

Maintain PDF reporting through jsPDF.

Include:

- Query
- Location
- Coordinates
- AOI
- Historical period
- Current period
- Historical imagery
- Current imagery
- Change map
- Spectral metrics
- Change statistics
- AI explanation
- Detection results

Also maintain:

- Export Markdown
- Copy to Clipboard

Never include fabricated measurements.

---

# 40. Data Integrity

SatQuery AI is a scientific/geospatial application.

NEVER fabricate:

- Satellite imagery
- Historical imagery
- Coordinates
- Object counts
- Percentages
- Area measurements
- Confidence scores
- Change statistics
- Detection results

Clearly distinguish:

```text
Measured
Calculated
Model-derived
Inferred
Uncertain
Unavailable
```

If data is unavailable, explicitly state that it is unavailable.

---

# 41. Model Responsibility

Use the correct tool for each task:

```text
Object Counting
→ Detection / Counting Model

NDVI
→ Deterministic Spectral Calculation

NDWI
→ Deterministic Spectral Calculation

NDBI
→ Deterministic Spectral Calculation

Change Detection
→ Geospatial / Raster Analysis

Visual Interpretation
→ Qwen3-VL

Natural-Language Explanation
→ Qwen3-VL / Language Reasoning

Administrative Boundary
→ Authentic GeoJSON

Geocoding
→ Geographic Search Service
```

Qwen3-VL must not replace deterministic remote-sensing calculations.

---

# 42. Performance

Optimize image processing and inference.

Before Qwen3-VL:

```text
Raw Satellite Image
        ↓
AOI Crop
        ↓
Resolution Optimization
        ↓
Relevant Image / Change Map
        ↓
Qwen3-VL
```

Do not send unnecessarily large raw images to the model.

Cache repeated satellite requests where practical.

Avoid repeated processing of identical AOIs and date ranges.

Perform heavy processing on the backend/inference environment.

---

# 43. Error Handling

Gracefully handle:

```text
Invalid location
Invalid AOI
No satellite imagery
Cloud-covered imagery
Invalid date range
Satellite API failure
Boundary API failure
Qwen3-VL failure
Backend failure
Image alignment failure
Unsupported query
Missing credentials
Invalid GeoTIFF
```

Show meaningful user-facing messages.

Never silently substitute fake data.

---

# 44. Implementation Approach

Before modifying the codebase:

1. Inspect the entire existing project.
2. Identify the frontend architecture.
3. Identify the backend architecture.
4. Identify the Mappls integration.
5. Identify current satellite providers.
6. Identify the existing T1/T2/SAR workflow.
7. Identify the existing Qwen3-VL integration.
8. Identify existing APIs.
9. Identify existing state management.
10. Identify reusable components.
11. Identify environment variables.
12. Identify current analysis/model services.

Then integrate the new capabilities into the existing architecture.

Do not create duplicate functionality.

Do not remove working features.

---

# 45. Implementation Priority

## Phase 1 — Existing System Stability

Verify:

```text
Mappls
Search
AOI selection
Capture View
T1
T2
SAR
Single-image VQA
Qwen3-VL
Feature annotations
```

## Phase 2 — Temporal Imagery

Implement:

```text
Date selection
Historical imagery retrieval
Current imagery retrieval
Cloud filtering
AOI cropping
Resolution matching
Spatial alignment
```

## Phase 3 — Remote-Sensing Analysis

Implement:

```text
NDVI
NDWI
NDBI
Land-cover analysis
Image difference
```

## Phase 4 — Change Detection

Implement:

```text
Bi-temporal comparison
Change classification
Change map
Change statistics
```

## Phase 5 — Qwen3-VL Interpretation

Implement:

```text
T1 + T2 + Change Map + Statistics
                ↓
             Qwen3-VL
                ↓
       Grounded Explanation
```

## Phase 6 — UI

Implement:

```text
Temporal Controls
Before / After Viewer
Swipe Slider
Change Overlay
Statistics
AI Summary
Temporal VQA
```

## Phase 7 — Reporting

Maintain:

```text
PDF
Markdown
Clipboard
Save Query
Reset Query
```

---

# 46. Testing

Test multiple geographic locations, including:

```text
Cuttack
Bhubaneswar
Pune
Delhi
Mumbai
```

Test temporal comparisons:

```text
2021 → 2026
2020 → 2025
Last 5 Years
```

Test natural-language queries:

```text
How many houses are there?
Where are the water bodies?
What changed?
Did vegetation decrease?
Where did development occur?
Compare this area with five years ago.
```

Test AOI types:

```text
Point
Rectangle
Polygon
Administrative Boundary
```

Test failure cases:

```text
Invalid location
No imagery
Cloudy imagery
Invalid dates
Satellite API unavailable
Backend unavailable
AI unavailable
```

---

# 47. Complete Product Workflow

The final SatQuery AI workflow should be:

```text
USER
  ↓
Natural-Language Query
  ↓
Agentic Intent Detection
  ↓
AOI Identification
  ↓
Determine Required Data
  ↓
┌──────────────────────────────┐
│                              │
│ Single Image       Bi-Temporal
│                              │
└──────────────────────────────┘
                       ↓
                 Historical T1
                       +
                   Current T2
                       ↓
                Image Processing
                       ↓
             Remote-Sensing Analysis
                       ↓
              ┌────────┼────────┐
              ↓        ↓        ↓
             NDVI     NDWI     NDBI
              │        │        │
              └────────┼────────┘
                       ↓
                Change Detection
                       ↓
                  Change Map
                       ↓
                 Qwen3-VL
                       ↓
              AI Interpretation
                       ↓
              SatQuery Interface
                       ↓
       ┌────────────────────────────┐
       │ Historical | Current       │
       │ Before/After Slider        │
       │ Change Map                 │
       │ Statistics                 │
       │ AI Explanation             │
       │ Feature Detection          │
       └────────────────────────────┘
                       ↓
              PDF / MD / Clipboard
```

---

# 48. UI Workflow

The user experience for temporal analysis should be:

```text
User selects/searches location
          ↓
AOI appears on Mappls
          ↓
User enters:
"Show changes in the last 5 years"
          ↓
Agentic router identifies BI_TEMPORAL_CHANGE
          ↓
Temporal controls appear
          ↓
System determines T1 and T2
          ↓
Historical + Current imagery retrieved
          ↓
Images processed and aligned
          ↓
Before/After viewer appears
          ↓
Change detection runs
          ↓
Change map appears
          ↓
Statistics appear in Metrics Explorer
          ↓
Qwen3-VL explains visible changes
          ↓
User can ask follow-up questions
          ↓
User can export the intelligence report
```

---

# 49. UI Change Principle

Do NOT create a completely new UI for historical comparison.

The existing SatQuery AI UI should remain recognizable.

Only extend it with:

### 1. Temporal Controls

Choose:

```text
Historical period
Current period
```

### 2. Before/After Viewer

Compare:

```text
T1 ↔ T2
```

### 3. Change Analysis

Show:

```text
Change Map
Change Statistics
AI Explanation
```

These should feel like natural extensions of the existing SatQuery workflow.

---

# 50. Final Architecture

```text
                         SATQUERY AI
                              │
                              ▼
                    ┌─────────────────┐
                    │   USER QUERY    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ AGENTIC ROUTER  │
                    └────────┬────────┘
                             │
                 ┌───────────┼───────────┐
                 │           │           │
                 ▼           ▼           ▼
             SINGLE       TEMPORAL     OPTICAL
             IMAGE        ANALYSIS      + SAR
                 │           │           │
                 │           ▼           │
                 │       Historical       │
                 │          T1            │
                 │           +            │
                 │       Current T2       │
                 │           │            │
                 │           ▼            │
                 │     Preprocessing      │
                 │           │            │
                 │           ▼            │
                 │    Change Detection   │
                 │           │            │
                 └───────────┼────────────┘
                             ▼
                  ┌─────────────────────┐
                  │ Remote-Sensing      │
                  │ Analysis            │
                  │                     │
                  │ NDVI / NDWI / NDBI  │
                  │ Detection / VQA      │
                  └──────────┬──────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   QWEN3-VL      │
                    │                 │
                    │ Visual Reasoning│
                    │ + Explanation   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ SATQUERY UI     │
                    │                 │
                    │ Map             │
                    │ Before / After  │
                    │ Change Map      │
                    │ Statistics      │
                    │ AI Summary      │
                    └────────┬────────┘
                             │
                             ▼
                    Intelligence Report
```

---

# 51. Core Product Principle

SatQuery AI must follow this hierarchy:

```text
AUTHENTIC EARTH OBSERVATION DATA
              ↓
       GEOSPATIAL PROCESSING
              ↓
      QUANTITATIVE ANALYSIS
              ↓
       CHANGE DETECTION
              ↓
      VISION-LANGUAGE REASONING
              ↓
       GROUNDED AI ANSWER
```

AI should interpret and explain geospatial evidence, not invent the evidence.

The final platform should demonstrate the SIH26167 concept of an **agentic, multimodal, conversational remote-sensing intelligence system** capable of:

- Natural-language satellite querying
- Single-image VQA
- Object detection
- Object counting
- Land-cover classification
- Vegetation analysis
- Water analysis
- Built-up analysis
- Bi-temporal change detection
- Change-based VQA
- Optical + SAR analysis
- Geographic boundary intelligence
- Interactive before/after comparison
- Quantitative geospatial statistics
- Vision-Language reasoning
- Grounded AI explanations
- Interactive geospatial reporting

---

# 52. Non-Negotiable Requirements

1. Preserve existing SatQuery AI functionality.
2. Preserve Mappls integration.
3. Preserve T1/T2/SAR imagery workflow.
4. Preserve administrative boundary functionality.
5. Preserve precision location search.
6. Preserve Feature Annotation Viewer.
7. Preserve Metrics Explorer.
8. Preserve AI Output Drawer.
9. Preserve Save Query.
10. Preserve Reset Query.
11. Preserve PDF export.
12. Preserve Markdown export.
13. Preserve Clipboard export.
14. Preserve the Live Clock and Date widget.
15. Do not fabricate satellite data.
16. Do not fabricate historical imagery.
17. Do not fabricate measurements.
18. Do not use Qwen3-VL as the sole quantitative change detector.
19. Support arbitrary temporal comparisons.
20. Make the 5-year comparison workflow easy to use.
21. Keep the new temporal UI integrated with the existing interface.
22. Keep all change layers spatially aligned.
23. Clearly distinguish measured, calculated, model-derived, inferred, and uncertain results.
24. Do not create an unrelated replacement application.
25. Build the feature as an integrated part of SatQuery AI.
