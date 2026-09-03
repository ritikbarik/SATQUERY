from app.models.schemas import AnalysisStats, GeoJsonFeature, GeoJsonFeatureCollection, LayerCollections


def polygon_feature(
    class_name: str,
    confidence: float,
    area_km2: float,
    coordinates: list[list[float]],
    name: str,
) -> GeoJsonFeature:
    closed_coordinates = coordinates if coordinates[0] == coordinates[-1] else [*coordinates, coordinates[0]]
    return GeoJsonFeature(
        properties={
            "class": class_name,
            "confidence": confidence,
            "area_km2": area_km2,
            "name": name,
        },
        geometry={
            "type": "Polygon",
            "coordinates": [closed_coordinates],
        },
    )


def collection(features: list[GeoJsonFeature] | None = None) -> GeoJsonFeatureCollection:
    return GeoJsonFeatureCollection(features=features or [])


BOUNDARY_LAYER = collection([
    polygon_feature(
        "boundary",
        0.98,
        142.6,
        [[85.12, 20.58], [85.76, 20.85], [86.32, 20.68], [86.55, 20.27], [86.16, 19.89], [85.56, 19.77], [85.02, 20.06]],
        "Selected Area",
    )
])


LAYERS = {
    "vegetation": collection([
        polygon_feature("vegetation", 0.92, 6.8, [[85.18, 20.11], [85.30, 20.34], [85.73, 20.29], [85.63, 19.98]], "Dense vegetation"),
        polygon_feature("vegetation", 0.89, 5.4, [[85.72, 20.38], [86.00, 20.57], [86.22, 20.32], [85.96, 20.14]], "Forest belt"),
    ]),
    "water": collection([
        polygon_feature("water", 0.91, 2.1, [[85.47, 20.43], [85.62, 20.54], [85.83, 20.44], [85.71, 20.27]], "Reservoir cluster"),
        polygon_feature("water", 0.87, 1.7, [[86.03, 20.03], [86.22, 20.18], [86.39, 20.05], [86.19, 19.90]], "River wetland"),
    ]),
    "builtUp": collection([
        polygon_feature("built_up", 0.86, 3.2, [[85.73, 20.26], [85.87, 20.43], [86.07, 20.31], [85.92, 20.12]], "Built-up zone"),
        polygon_feature("built_up", 0.83, 2.9, [[86.05, 20.49], [86.18, 20.64], [86.38, 20.52], [86.25, 20.35]], "Urban fringe"),
    ]),
    "decrease": collection([
        polygon_feature("decrease", 0.91, 4.4, [[85.77, 20.08], [85.90, 20.24], [86.11, 20.15], [85.98, 19.96]], "Vegetation decrease"),
        polygon_feature("decrease", 0.88, 3.1, [[86.11, 20.42], [86.28, 20.58], [86.45, 20.43], [86.29, 20.26]], "Cleared patch"),
    ]),
    "increase": collection([
        polygon_feature("increase", 0.86, 2.6, [[85.58, 20.56], [85.76, 20.72], [85.96, 20.61], [85.81, 20.41]], "Construction increase"),
    ]),
}


EMPTY_LAYERS = LayerCollections(
    vegetation=collection(),
    water=collection(),
    builtUp=collection(),
    decrease=collection(),
    increase=collection(),
    boundary=BOUNDARY_LAYER,
)


ANALYSIS_RESULTS = {
    "vegetation_change": AnalysisStats(
        waterBodies=37,
        vegetationCover=63.4,
        builtUpArea=12.8,
        vegetationChange=-18.4,
        confidence=91,
    ),
    "water_proximity": AnalysisStats(
        waterBodies=43,
        vegetationCover=63.4,
        builtUpArea=12.8,
        vegetationChange=-4.2,
        confidence=88,
    ),
    "built_up_change": AnalysisStats(
        waterBodies=37,
        vegetationCover=60.1,
        builtUpArea=15.6,
        vegetationChange=-7.8,
        confidence=86,
    ),
    "ndvi": AnalysisStats(
        waterBodies=37,
        vegetationCover=66.8,
        builtUpArea=12.8,
        vegetationChange=2.1,
        confidence=89,
    ),
    "built_up_detection": AnalysisStats(
        waterBodies=37,
        vegetationCover=63.4,
        builtUpArea=12.8,
        vegetationChange=-3.4,
        confidence=87,
    ),
    "unsupported": AnalysisStats(
        waterBodies=37,
        vegetationCover=63.4,
        builtUpArea=12.8,
        vegetationChange=-18.4,
        confidence=72,
    ),
}
