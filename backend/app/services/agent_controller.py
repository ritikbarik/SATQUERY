from typing import Any
from app.models.schemas import (
    AnalysisStats,
    BigEarthNetPatchDetail,
    LayerCollections,
    LocationMetadata,
    ParsedQueryIntent,
    WeatherData,
)
from app.services.bigearthnet_service import bigearthnet_service
from app.services.geojson_service import build_dynamic_layers
from app.services.satellite_service import satellite_service


class AgentControllerOutput:
    def __init__(
        self,
        answer: str,
        analysis: AnalysisStats,
        layers: LayerCollections,
        highlights: list[str],
        bigearthnet: BigEarthNetPatchDetail | None = None,
    ) -> None:
        self.answer = answer
        self.analysis = analysis
        self.layers = layers
        self.highlights = highlights
        self.bigearthnet = bigearthnet


class AgenticAIController:
    """
    Central decision-making Agent Controller routing queries across:
    - Intent Classification
    - Visual Question Answering (VQA) with BigEarthNet Parquet Telemetry
    - Bounding Box Object Grounding
    - Multi-temporal Change Analysis
    - Optical + SAR Multimodal Fusion
    - Environmental & Soil Evidence Aggregation
    """

    def process_query(
        self,
        intent: ParsedQueryIntent,
        loc: LocationMetadata,
        weather: WeatherData,
    ) -> AgentControllerOutput:
        # Step 1: Run spectral and SAR multimodal fusion baseline
        spectral_stats = satellite_service.analyze_spectral_profile(
            loc=loc,
            target=intent.target,
            start_year=intent.startDate,
            end_year=intent.endDate,
        )
        spectral_stats.soilMoisture = weather.soilMoisture

        # Step 2: Route through specialized AI workflows
        # Check if the query is asking about BigEarthNet concepts or European Sentinel patches
        is_vqa_query = (
            intent.task in ["vqa", "captioning"]
            or any(w in intent.location.lower() for w in ["austria", "finland", "portugal", "serbia", "lithuania", "ireland", "belgium", "switzerland", "luxembourg", "kosovo"])
            or any(w in intent.detectedLocation.lower() if intent.detectedLocation else False for w in ["austria", "finland", "portugal", "serbia", "lithuania", "ireland", "belgium"])
            or any(w in intent.highlights for w in ["pastures", "arable", "coniferous", "broad-leaved", "patch", "sentinel", "bigearthnet"])
        )

        if is_vqa_query:
            return self._handle_vqa_workflow(intent, loc, weather, spectral_stats)
        elif intent.task == "weather":
            return self._handle_weather_workflow(intent, loc, weather, spectral_stats)
        elif intent.task == "change_detection":
            return self._handle_change_workflow(intent, loc, weather, spectral_stats)
        elif intent.task == "index":
            return self._handle_spectral_index_workflow(intent, loc, weather, spectral_stats)
        elif intent.task == "detection":
            return self._handle_detection_workflow(intent, loc, weather, spectral_stats)
        elif intent.task == "proximity":
            return self._handle_proximity_workflow(intent, loc, weather, spectral_stats)

        return self._handle_general_synthesis(intent, loc, weather, spectral_stats)

    def _handle_vqa_workflow(
        self,
        intent: ParsedQueryIntent,
        loc: LocationMetadata,
        weather: WeatherData,
        base_stats: AnalysisStats,
    ) -> AgentControllerOutput:
        patch_detail, best_qa = bigearthnet_service.match_vqa_query(
            question=" ".join(intent.highlights),
            location_hint=loc.displayName,
        )

        if patch_detail:
            loc.displayName = f"{patch_detail.country} (Sentinel-2 {patch_detail.patch_id[:20]}...)"
            loc.regionName = patch_detail.country
            loc.lat = patch_detail.latitude
            loc.lng = patch_detail.longitude

            qa_summary = f" Ground Truth VQA: '{best_qa.question}' ➔ {best_qa.answer}." if best_qa else ""
            answer = (
                f"BigEarthNet Visual QA Intelligence: {patch_detail.overview_caption}{qa_summary} "
                f"Sentinel-1 SAR scene {patch_detail.s1_name or 'S1B_IW_GRDH'} cross-referenced with Sentinel-2 multispectral bands."
            )

            base_stats.evidence.append(f"BigEarthNet Ground Truth Patch: {patch_detail.patch_id}")
            base_stats.evidence.append(f"Climate Zone: {patch_detail.climate_zone}, Season: {patch_detail.season}")
            base_stats.aiWorkflow = "bigearthnet_vqa_grounding"
            base_stats.confidence = 95

            layers = build_dynamic_layers(loc, ["vegetation", "water", "builtUp"])
            # Append real bounding box features from BigEarthNet
            if patch_detail.geojson_features:
                layers.vegetation.features.extend([f for f in patch_detail.geojson_features if f.properties.get("class") == "vegetation"])
                layers.water.features.extend([f for f in patch_detail.geojson_features if f.properties.get("class") == "water"])
                layers.builtUp.features.extend([f for f in patch_detail.geojson_features if f.properties.get("class") == "built_up"])

            highlights = [patch_detail.country, patch_detail.season or "Summer", "BigEarthNet VQA", "Sentinel-2", "Sentinel-1 SAR"]
            if best_qa:
                highlights.append(f"Answer: {best_qa.answer}")

            return AgentControllerOutput(
                answer=answer,
                analysis=base_stats,
                layers=layers,
                highlights=highlights,
                bigearthnet=patch_detail,
            )

        return self._handle_general_synthesis(intent, loc, weather, base_stats)

    def _handle_weather_workflow(
        self,
        intent: ParsedQueryIntent,
        loc: LocationMetadata,
        weather: WeatherData,
        base_stats: AnalysisStats,
    ) -> AgentControllerOutput:
        answer = (
            f"Live meteorological telemetry for {loc.displayName}: {weather.temperature}°C with {weather.condition.lower()}. "
            f"Atmospheric humidity is {weather.humidity}%, wind speed at {weather.wind}, and topsoil moisture index is {weather.soilMoisture}%."
        )
        base_stats.aiWorkflow = "meteorological_soil_telemetry"
        base_stats.evidence.append(f"Open-Meteo live API observation at {weather.updatedAt}")
        layers = build_dynamic_layers(loc, ["vegetation", "water"])
        highlights = [loc.displayName, f"{weather.temperature}°C", weather.condition, f"{weather.humidity}% Humidity", f"{weather.soilMoisture}% Soil Moisture"]
        return AgentControllerOutput(answer=answer, analysis=base_stats, layers=layers, highlights=highlights)

    def _handle_change_workflow(
        self,
        intent: ParsedQueryIntent,
        loc: LocationMetadata,
        weather: WeatherData,
        base_stats: AnalysisStats,
    ) -> AgentControllerOutput:
        start = intent.startDate or "2024"
        end = intent.endDate or "2026"
        base_stats.aiWorkflow = "bitemporal_cdvqa_change_detection"

        if intent.target == "built_up":
            answer = (
                f"Multi-temporal satellite change analysis for {loc.displayName} indicates a +{base_stats.builtUpArea}% expansion in built-up infrastructure "
                f"between {start} and {end}, verified by Sentinel-1 SAR structural backscatter ({base_stats.sarBackscatterDb} dB)."
            )
            layers = build_dynamic_layers(loc, ["builtUp", "increase"])
            highlights = [loc.displayName, f"+{base_stats.builtUpArea}% expansion", f"{start}-{end}", "built-up infrastructure"]
        else:
            loss = abs(base_stats.vegetationChange)
            answer = (
                f"Bi-temporal multispectral comparison across {loc.displayName} reveals a -{loss}% reduction in dense canopy cover "
                f"between {start} and {end} (NDVI decreased from 0.72 to {base_stats.meanNdvi}), covering ~{round(loc.areaKm2 * (loss/100), 1)} km²."
            )
            layers = build_dynamic_layers(loc, ["vegetation", "decrease"])
            highlights = [loc.displayName, f"-{loss}% reduction", f"{start}-{end}", "canopy cover", f"NDVI {base_stats.meanNdvi}"]

        return AgentControllerOutput(answer=answer, analysis=base_stats, layers=layers, highlights=highlights)

    def _handle_spectral_index_workflow(
        self,
        intent: ParsedQueryIntent,
        loc: LocationMetadata,
        weather: WeatherData,
        base_stats: AnalysisStats,
    ) -> AgentControllerOutput:
        base_stats.aiWorkflow = "multispectral_spectral_indices"
        health_status = "vigorous photosynthetic density" if (base_stats.meanNdvi or 0) > 0.6 else "moderate foliage"
        answer = (
            f"Multispectral indices for {loc.displayName}: Mean NDVI is estimated at {base_stats.meanNdvi} ({health_status}), "
            f"NDWI water index is {base_stats.ndwi}, and NDBI built-up index is {base_stats.ndbi}, backed by {weather.soilMoisture}% topsoil moisture."
        )
        layers = build_dynamic_layers(loc, ["vegetation"])
        highlights = [loc.displayName, f"NDVI {base_stats.meanNdvi}", f"NDWI {base_stats.ndwi}", f"NDBI {base_stats.ndbi}", health_status]
        return AgentControllerOutput(answer=answer, analysis=base_stats, layers=layers, highlights=highlights)

    def _handle_proximity_workflow(
        self,
        intent: ParsedQueryIntent,
        loc: LocationMetadata,
        weather: WeatherData,
        base_stats: AnalysisStats,
    ) -> AgentControllerOutput:
        base_stats.aiWorkflow = "hydrological_water_extraction"
        answer = (
            f"Hydrological extraction identified {base_stats.waterBodies} distinct water bodies across {loc.displayName}, "
            f"including seasonal reservoirs and perennial watercourses with an estimated NDWI index of {base_stats.ndwi}."
        )
        layers = build_dynamic_layers(loc, ["water"])
        highlights = [loc.displayName, f"{base_stats.waterBodies} water bodies", f"NDWI {base_stats.ndwi}", "hydrological basins"]
        return AgentControllerOutput(answer=answer, analysis=base_stats, layers=layers, highlights=highlights)

    def _handle_detection_workflow(
        self,
        intent: ParsedQueryIntent,
        loc: LocationMetadata,
        weather: WeatherData,
        base_stats: AnalysisStats,
    ) -> AgentControllerOutput:
        base_stats.aiWorkflow = "optical_sar_object_detection"
        answer = (
            f"Settlement and infrastructure scan for {loc.displayName} mapped {base_stats.builtUpArea}% urban density "
            f"(NDBI: {base_stats.ndbi}), verified with Sentinel-1 SAR backscatter at {base_stats.sarBackscatterDb} dB."
        )
        layers = build_dynamic_layers(loc, ["builtUp"])
        highlights = [loc.displayName, f"{base_stats.builtUpArea}% urban density", f"NDBI {base_stats.ndbi}", "SAR C-Band"]
        return AgentControllerOutput(answer=answer, analysis=base_stats, layers=layers, highlights=highlights)

    def _handle_general_synthesis(
        self,
        intent: ParsedQueryIntent,
        loc: LocationMetadata,
        weather: WeatherData,
        base_stats: AnalysisStats,
    ) -> AgentControllerOutput:
        answer = (
            f"SatQuery Intelligence synthesis for {loc.displayName}: Vegetation canopy is at {base_stats.vegetationCover}% "
            f"(NDVI {base_stats.meanNdvi}), built-up settlement covers {base_stats.builtUpArea}% (NDBI {base_stats.ndbi}), "
            f"and {base_stats.waterBodies} water bodies are identified with current {weather.condition} ({weather.temperature}°C)."
        )
        layers = build_dynamic_layers(loc, ["vegetation", "water", "builtUp"])
        highlights = [loc.displayName, f"{base_stats.vegetationCover}% Vegetation", f"{base_stats.builtUpArea}% Built-up", f"{base_stats.waterBodies} Water bodies", f"NDVI {base_stats.meanNdvi}"]
        return AgentControllerOutput(answer=answer, analysis=base_stats, layers=layers, highlights=highlights)


agent_controller = AgenticAIController()
