import re
from app.models.schemas import ParsedQueryIntent, QueryRequest, TaskType, TargetType
from app.services.geocoding_service import INDIA_REGIONS


def parse_query(request: QueryRequest) -> ParsedQueryIntent:
    question = request.question.strip()
    q_lower = question.lower()

    # 1. Extract years
    start_date, end_date = extract_year_range(q_lower)

    # 2. Detect location inside question text if not explicitly provided or if "India" was generic
    detected_loc = extract_location_name(q_lower, request.location)

    # 3. Detect intent & keywords
    task: TaskType = "unsupported"
    target: TargetType = "unsupported"
    highlights: list[str] = []

    if detected_loc:
        highlights.append(detected_loc.title())

    if start_date:
        highlights.append(start_date)
    if end_date:
        highlights.append(end_date)

    if any(k in q_lower for k in ["weather", "temperature", "climate", "rainfall", "rain", "humidity", "wind", "cloud"]):
        task = "weather"
        target = "weather"
        highlights.extend(["weather", "climate", "temperature", "humidity"])

    elif any(k in q_lower for k in ["water", "pond", "lake", "river", "wetland", "reservoir", "dam", "canal"]):
        task = "proximity"
        target = "water"
        highlights.extend(["water bodies", "wetlands", "reservoir", "lake"])

    elif "ndvi" in q_lower or "spectral index" in q_lower or "greenness" in q_lower or "chlorophyll" in q_lower:
        task = "index"
        target = "vegetation"
        highlights.extend(["NDVI", "vegetation index", "canopy health"])

    elif any(k in q_lower for k in ["construction", "urban growth", "sprawl", "expansion", "built-up increase"]):
        task = "change_detection"
        target = "built_up"
        highlights.extend(["urban growth", "construction increase", "expansion"])

    elif any(k in q_lower for k in ["built", "building", "settlement", "urban", "concrete", "infrastructure"]):
        task = "detection"
        target = "built_up"
        highlights.extend(["built-up area", "urban clusters", "settlements"])

    elif any(k in q_lower for k in ["road", "highway", "expressway", "corridor", "transport"]):
        task = "detection"
        target = "roads"
        highlights.extend(["road network", "highways", "corridors"])

    elif any(k in q_lower for k in ["vegetation", "loss", "forest", "canopy", "deforestation", "green cover"]):
        task = "change_detection"
        target = "vegetation"
        highlights.extend(["vegetation loss", "canopy decrease", "forest cover"])
        if not start_date:
            start_date = "2024"
        if not end_date:
            end_date = "2026"

    else:
        task = "change_detection"
        target = "vegetation"
        highlights.append("satellite analysis")

    return ParsedQueryIntent(
        task=task,
        target=target,
        startDate=start_date,
        endDate=end_date,
        location=detected_loc or request.location,
        detectedLocation=detected_loc,
        highlights=list(set(highlights)),
    )


def extract_location_name(q_lower: str, default_location: str) -> str | None:
    # 1. Match known Indian locations using word boundaries (longest key first)
    for key in sorted(INDIA_REGIONS.keys(), key=len, reverse=True):
        if key == "india":
            continue
        if re.search(r"\b" + re.escape(key) + r"\b", q_lower):
            return INDIA_REGIONS[key]["regionName"]

    # 2. Extract after action verbs: "analyse X", "analyze X", "check X", "scan X", "examine X", "map X", "show X"
    action_match = re.search(
        r"\b(?:analyse|analyze|scan|check|inspect|examine|explore|map|view|about)\s+([a-zA-Z\s]{3,30})\b",
        q_lower,
    )
    if action_match:
        cand = action_match.group(1).strip()
        cand = re.sub(
            r"\b(this|the|area|region|city|village|satellite|image|imagery|telemetry|water|bodies|vegetation|change|growth|infrastructure|ndvi|cover)\b",
            "",
            cand,
            flags=re.I,
        ).strip()
        if len(cand) >= 3:
            return cand.title()

    # 3. Regex patterns for prepositions: "in Mumbai", "near Bengaluru", "of Delhi", "around Jaipur"
    match = re.search(r"\b(?:in|near|around|at|of|for|across|to)\s+([a-zA-Z\s]{3,25})\b", q_lower)
    if match:
        candidate = match.group(1).strip()
        cand_clean = re.sub(
            r"\b(this|the|area|region|city|village|vegetation|water|bodies|construction|expansion|roads|canopy|forest|ndvi)\b",
            "",
            candidate,
            flags=re.I,
        ).strip()
        if len(cand_clean) >= 3:
            return cand_clean.title()

    if default_location and default_location.lower() not in ["india", "all"]:
        return default_location

    # 4. If query is a direct place name (e.g. "Kochi" or "Surat")
    tokens = [t for t in q_lower.split() if t not in ["show", "find", "water", "ndvi", "weather", "change", "the", "in", "is"]]
    if len(tokens) == 1 and len(tokens[0]) >= 3:
        return tokens[0].title()

    return None


def extract_year_range(question: str) -> tuple[str | None, str | None]:
    years = re.findall(r"(20\d{2})", question)
    if len(years) >= 2:
        return years[0], years[1]
    if len(years) == 1:
        return years[0], None
    return None, None
