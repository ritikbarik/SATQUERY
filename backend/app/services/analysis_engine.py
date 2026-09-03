from app.models.schemas import (
    AnalysisStats,
    BigEarthNetPatchDetail,
    LayerCollections,
    LocationMetadata,
    ParsedQueryIntent,
    WeatherData,
)
from app.services.agent_controller import AgentControllerOutput, agent_controller


class AnalysisOutput:
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


def analyze(intent: ParsedQueryIntent, loc: LocationMetadata, weather: WeatherData) -> AnalysisOutput:
    output: AgentControllerOutput = agent_controller.process_query(intent, loc, weather)
    return AnalysisOutput(
        answer=output.answer,
        analysis=output.analysis,
        layers=output.layers,
        highlights=output.highlights,
        bigearthnet=output.bigearthnet,
    )
