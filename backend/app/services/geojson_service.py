import math
from app.models.schemas import GeoJsonFeature, GeoJsonFeatureCollection, LayerCollections, LocationMetadata


def make_polygon(
    center_lat: float,
    center_lng: float,
    d_lat: float,
    d_lng: float,
    radius: float,
    class_name: str,
    confidence: float,
    area_km2: float,
    name: str,
    vertices: int = 6,
    angle_offset: float = 0.0,
) -> GeoJsonFeature:
    pts: list[list[float]] = []
    lat_0 = center_lat + d_lat
    lng_0 = center_lng + d_lng

    for i in range(vertices):
        angle = angle_offset + (2 * math.pi * i / vertices)
        # Add slight pseudo-organic distortion
        r = radius * (0.85 + 0.3 * math.sin(i * 1.5))
        p_lat = round(lat_0 + (r / 111.0) * math.cos(angle), 5)
        p_lng = round(lng_0 + (r / (111.0 * math.cos(math.radians(lat_0)))) * math.sin(angle), 5)
        pts.append([p_lng, p_lat])

    pts.append(pts[0])  # Close polygon

    return GeoJsonFeature(
        properties={
            "class": class_name,
            "confidence": confidence,
            "area_km2": round(area_km2, 2),
            "name": name,
        },
        geometry={
            "type": "Polygon",
            "coordinates": [pts],
        },
    )


def collection(features: list[GeoJsonFeature] | None = None) -> GeoJsonFeatureCollection:
    return GeoJsonFeatureCollection(features=features or [])


def build_dynamic_layers(loc: LocationMetadata, active_layer_names: list[str]) -> LayerCollections:
    lat = loc.lat
    lng = loc.lng
    area_scale = min(max(loc.areaKm2, 50.0), 5000.0)
    rad = math.sqrt(area_scale) * 0.08  # roughly 5-15 km radius

    # 1. Boundary polygon
    boundary_pts: list[list[float]] = []
    for i in range(8):
        angle = 2 * math.pi * i / 8
        r = rad * 1.4 * (0.9 + 0.2 * math.sin(i * 2))
        p_lat = round(lat + (r / 111.0) * math.cos(angle), 5)
        p_lng = round(lng + (r / (111.0 * math.cos(math.radians(lat)))) * math.sin(angle), 5)
        boundary_pts.append([p_lng, p_lat])
    boundary_pts.append(boundary_pts[0])

    boundary_feature = GeoJsonFeature(
        properties={
            "class": "boundary",
            "confidence": 0.99,
            "area_km2": loc.areaKm2,
            "name": f"{loc.regionName} Region Boundary",
        },
        geometry={
            "type": "Polygon",
            "coordinates": [boundary_pts],
        },
    )
    boundary_layer = collection([boundary_feature])

    # 2. Vegetation Polygons
    veg_features = [
        make_polygon(lat, lng, 0.04, -0.05, rad * 0.5, "vegetation", 0.94, loc.areaKm2 * 0.22, f"Forest Canopy {loc.regionName}", 6, 0.2),
        make_polygon(lat, lng, -0.05, 0.04, rad * 0.45, "vegetation", 0.91, loc.areaKm2 * 0.18, f"Green Belt {loc.regionName}", 7, 0.8),
    ]

    # 3. Water Polygons
    water_features = [
        make_polygon(lat, lng, -0.02, -0.03, rad * 0.35, "water", 0.93, loc.areaKm2 * 0.06, f"Water Reservoir {loc.regionName}", 6, 0.5),
        make_polygon(lat, lng, 0.06, 0.05, rad * 0.25, "water", 0.88, loc.areaKm2 * 0.04, f"River Basin Wetland", 5, 1.2),
    ]

    # 4. Built-up / Urban Polygons
    built_features = [
        make_polygon(lat, lng, 0.01, 0.01, rad * 0.55, "built_up", 0.89, loc.areaKm2 * 0.15, f"{loc.regionName} Central Sector", 6, 0.0),
        make_polygon(lat, lng, 0.04, 0.06, rad * 0.35, "built_up", 0.85, loc.areaKm2 * 0.09, f"{loc.regionName} Industrial Corridor", 5, 1.5),
    ]

    # 5. Decrease (Deforestation/Vegetation Loss)
    decrease_features = [
        make_polygon(lat, lng, 0.03, -0.02, rad * 0.3, "decrease", 0.91, loc.areaKm2 * 0.05, "Canopy Thinning Zone", 5, 0.4),
        make_polygon(lat, lng, -0.04, 0.02, rad * 0.25, "decrease", 0.88, loc.areaKm2 * 0.03, "Cleared Agricultural Patch", 6, 1.1),
    ]

    # 6. Increase (Construction Expansion)
    increase_features = [
        make_polygon(lat, lng, 0.05, 0.03, rad * 0.32, "increase", 0.87, loc.areaKm2 * 0.06, "New Urban Construction", 6, 0.7),
        make_polygon(lat, lng, -0.02, 0.06, rad * 0.28, "increase", 0.85, loc.areaKm2 * 0.04, "Highway Expansion Zone", 5, 1.9),
    ]

    return LayerCollections(
        vegetation=collection(veg_features if "vegetation" in active_layer_names else []),
        water=collection(water_features if "water" in active_layer_names else []),
        builtUp=collection(built_features if "builtUp" in active_layer_names else []),
        decrease=collection(decrease_features if "decrease" in active_layer_names else []),
        increase=collection(increase_features if "increase" in active_layer_names else []),
        boundary=boundary_layer,
    )
