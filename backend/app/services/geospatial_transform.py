"""
Geospatial Coordinate Transformation Engine
============================================
Mathematical transformation engine connecting raster pixel space (x, y)
with geographic geodetic space (lat, lng) and Web Mercator (EPSG:3857).

Handles:
- Pixel (x, y) <-> Geographic (lat, lng) conversion with sub-meter precision
- Normalized [0, 1000] bounding box <-> Geographic bounding box
- Contour pixel coordinates <-> GeoJSON Polygon coordinates [[lng, lat], ...]
- Leaflet polygon coordinates [[lat, lng], ...]
- Resolution (meters per pixel) and geographic surface area calculation
"""

from typing import Any
import math
from shapely.geometry import Polygon, MultiPolygon, mapping
from shapely.ops import transform


def pixel_to_latlng(
    x: float,
    y: float,
    img_width: int,
    img_height: int,
    bounds: list[float],  # [south, north, west, east]
) -> tuple[float, float]:
    """
    Transforms pixel coordinate (x, y) to (latitude, longitude).
    x ranges [0, img_width] (west -> east)
    y ranges [0, img_height] (north -> south, top to bottom in raster)
    bounds: [south, north, west, east]
    """
    south, north, west, east = bounds
    # Longitude is linear west to east
    norm_x = max(0.0, min(1.0, x / max(1, img_width)))
    lng = west + norm_x * (east - west)

    # Latitude is north at top (y=0) and south at bottom (y=height)
    norm_y = max(0.0, min(1.0, y / max(1, img_height)))
    lat = north - norm_y * (north - south)

    return (round(lat, 6), round(lng, 6))


def latlng_to_pixel(
    lat: float,
    lng: float,
    img_width: int,
    img_height: int,
    bounds: list[float],  # [south, north, west, east]
) -> tuple[int, int]:
    """
    Transforms geographic (latitude, longitude) to pixel coordinate (x, y).
    """
    south, north, west, east = bounds
    lng_span = max(1e-9, east - west)
    lat_span = max(1e-9, north - south)

    norm_x = (lng - west) / lng_span
    norm_y = (north - lat) / lat_span

    x = int(round(norm_x * img_width))
    y = int(round(norm_y * img_height))

    return (max(0, min(img_width, x)), max(0, min(img_height, y)))


def bbox_1000_to_latlng_bounds(
    box_1000: list[int],  # [ymin, xmin, ymax, xmax] in 0-1000 range
    bounds: list[float],   # [south, north, west, east]
) -> dict[str, Any]:
    """
    Converts 0-1000 normalized bounding box into geographic bounds:
    Returns dict with south, north, west, east, center_lat, center_lng,
    and Leaflet bounds format [[south, west], [north, east]].
    """
    ymin, xmin, ymax, xmax = box_1000
    south, north, west, east = bounds

    norm_xmin = max(0.0, min(1.0, xmin / 1000.0))
    norm_xmax = max(0.0, min(1.0, xmax / 1000.0))
    norm_ymin = max(0.0, min(1.0, ymin / 1000.0))
    norm_ymax = max(0.0, min(1.0, ymax / 1000.0))

    box_west = west + norm_xmin * (east - west)
    box_east = west + norm_xmax * (east - west)
    box_north = north - norm_ymin * (north - south)
    box_south = north - norm_ymax * (north - south)

    center_lat = (box_north + box_south) / 2.0
    center_lng = (box_east + box_west) / 2.0

    return {
        "south": round(box_south, 6),
        "north": round(box_north, 6),
        "west": round(box_west, 6),
        "east": round(box_east, 6),
        "center": [round(center_lat, 6), round(center_lng, 6)],
        "leaflet_bounds": [
            [round(box_south, 6), round(box_west, 6)],
            [round(box_north, 6), round(box_east, 6)],
        ],
    }


def pixel_contour_to_geojson_polygon(
    contour_pixels: list[list[int]],  # [[x1, y1], [x2, y2], ...]
    img_width: int,
    img_height: int,
    bounds: list[float],  # [south, north, west, east]
    simplify_tolerance: float = 0.00002,  # approx 2 meters in degrees
) -> dict[str, Any] | None:
    """
    Converts raster pixel contour polygon to a georeferenced GeoJSON Polygon geometry.
    Coordinates are transformed into standard GeoJSON: [longitude, latitude].
    Also computes Leaflet coordinates [[latitude, longitude], ...] and surface area.
    """
    if len(contour_pixels) < 3:
        return None

    geo_coords_lnglat: list[list[float]] = []
    leaflet_coords_latlng: list[list[float]] = []

    for pt in contour_pixels:
        x, y = pt[0], pt[1]
        lat, lng = pixel_to_latlng(x, y, img_width, img_height, bounds)
        geo_coords_lnglat.append([lng, lat])
        leaflet_coords_latlng.append([lat, lng])

    # Ensure closed ring
    if geo_coords_lnglat[0] != geo_coords_lnglat[-1]:
        geo_coords_lnglat.append(geo_coords_lnglat[0])
        leaflet_coords_latlng.append(leaflet_coords_latlng[0])

    try:
        poly = Polygon(geo_coords_lnglat)
        if not poly.is_valid:
            poly = poly.buffer(0)

        if poly.is_empty:
            return None

        # Simplify to remove unnecessary jitter while preserving natural shoreline
        if simplify_tolerance > 0:
            simplified = poly.simplify(simplify_tolerance, preserve_topology=True)
            if not simplified.is_empty and simplified.geom_type == "Polygon":
                poly = simplified

        # Calculate approximate geodesic area in m²
        # Center latitude for cosine scaling
        south, north, _, _ = bounds
        center_lat = (north + south) / 2.0
        lat_rad = math.radians(center_lat)
        meters_per_deg_lat = 111132.92 - 559.82 * math.cos(2 * lat_rad) + 1.175 * math.cos(4 * lat_rad)
        meters_per_deg_lng = 111412.84 * math.cos(lat_rad) - 93.5 * math.cos(3 * lat_rad)

        # Scale coordinates to meters for accurate area calculation
        coords_meters = [
            (pt[0] * meters_per_deg_lng, pt[1] * meters_per_deg_lat)
            for pt in poly.exterior.coords
        ]
        poly_meters = Polygon(coords_meters)
        area_m2 = round(poly_meters.area, 2)
        area_km2 = round(area_m2 / 1_000_000.0, 5)
        perimeter_m = round(poly_meters.length, 2)

        centroid = poly.centroid
        centroid_lat = round(centroid.y, 6)
        centroid_lng = round(centroid.x, 6)

        # Re-export simplified coordinates
        geojson_coords = [[[round(pt[0], 6), round(pt[1], 6)] for pt in poly.exterior.coords]]
        leaflet_coords = [[round(pt[1], 6), round(pt[0], 6)] for pt in poly.exterior.coords]

        return {
            "type": "Polygon",
            "coordinates": geojson_coords,
            "leaflet_coordinates": leaflet_coords,
            "area_m2": area_m2,
            "area_km2": area_km2,
            "perimeter_m": perimeter_m,
            "centroid": [centroid_lat, centroid_lng],
            "bounds": [
                round(poly.bounds[1], 6),  # miny (south)
                round(poly.bounds[3], 6),  # maxy (north)
                round(poly.bounds[0], 6),  # minx (west)
                round(poly.bounds[2], 6),  # maxx (east)
            ],
        }
    except Exception as err:
        print(f"[GeospatialTransform] Polygon conversion error: {err}")
        return None


def calculate_ground_resolution(
    bounds: list[float],
    width: int,
    height: int,
) -> dict[str, float]:
    """
    Computes meters per pixel ground sampling distance (GSD).
    """
    south, north, west, east = bounds
    center_lat = (north + south) / 2.0
    lat_rad = math.radians(center_lat)

    meters_per_deg_lat = 111132.92 - 559.82 * math.cos(2 * lat_rad)
    meters_per_deg_lng = 111412.84 * math.cos(lat_rad)

    width_meters = abs(east - west) * meters_per_deg_lng
    height_meters = abs(north - south) * meters_per_deg_lat

    res_x = round(width_meters / max(1, width), 3)
    res_y = round(height_meters / max(1, height), 3)
    avg_res = round((res_x + res_y) / 2.0, 3)

    return {
        "width_meters": round(width_meters, 1),
        "height_meters": round(height_meters, 1),
        "meters_per_pixel": avg_res,
        "area_km2": round((width_meters * height_meters) / 1_000_000.0, 4),
    }
