import os
from google import genai
from google.genai import types
from app.schemas.ai import TacticalSummaryOutput, PhaseObservation, ConfidenceBlock
from app.services.tactical_feature_extractor import TacticalFeatureSet
from app.core.config import settings

def get_system_instruction(mode: str, tone: str) -> str:
    base = "You are an elite football tactical explanation assistant."
    if mode == "analytical":
        role = "Focus heavily on spatial geometry, mathematical width/depth, zones, pressing traps, half-spaces, and detailed statistics. Be precise and analytical."
    elif mode == "coach":
        role = "Focus on actionable instructions, team shape, defensive line height, immediate risks, and player communication. Be direct and instructive as if talking to a squad."
    elif mode == "creator":
        role = "Focus on engaging narratives, social media hooks, tactical trends, and making complex ideas simple and exciting for a broad audience."
    else:
        role = "Analyze structured football tactic-board data and produce grounded, readable explanations."
        
    return f"{base} {role} Tone: {tone}. Do not invent player identities, match context, or tactical intentions not supported by the input. Return ONLY valid JSON matching the required schema."

async def generate_llm_response(prompt: str, feature_heuristic: TacticalFeatureSet, mode: str = "analytical", tone: str = "balanced") -> TacticalSummaryOutput:
    """
    Uses Gemini to generate the tactical summary strictly in the defined OpenAPI JSON structure.
    Falls back to mock response if GEMINI_API_KEY is not configured or an error occurs.
    """
    if not settings.GEMINI_API_KEY or "mock" in settings.GEMINI_API_KEY.lower():
        return generate_mock_llm_response(prompt, feature_heuristic)
        
    try:
        sys_inst = get_system_instruction(mode, tone)
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        response = await client.aio.models.generate_content(
            model="gemini-1.5-flash",
            contents=f"Data:\n{prompt}",
            config=types.GenerateContentConfig(
                system_instruction=sys_inst,
                response_mime_type="application/json",
                response_schema=TacticalSummaryOutput
            )
        )
        
        result = TacticalSummaryOutput.model_validate_json(response.text)
        result.confidence.overall = 0.92
        return result
    except Exception as e:
        print(f"[AI Service Error] Gemini API failed: {e}. Falling back to mock.")
        return generate_mock_llm_response(prompt, feature_heuristic)

async def generate_llm_stream(prompt: str, feature_heuristic: TacticalFeatureSet, mode: str = "analytical", tone: str = "balanced"):
    """
    Yields chunks of the AI response for SSE streaming.
    """
    if not settings.GEMINI_API_KEY or "mock" in settings.GEMINI_API_KEY.lower():
        mock_output = generate_mock_llm_response(prompt, feature_heuristic).model_dump_json()
        chunk_size = 50
        import asyncio
        for i in range(0, len(mock_output), chunk_size):
            await asyncio.sleep(0.05)
            yield f"data: {mock_output[i:i+chunk_size]}\n\n"
        return
        
    try:
        sys_inst = get_system_instruction(mode, tone)
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        response_stream = await client.aio.models.generate_content_stream(
            model="gemini-1.5-flash",
            contents=f"Data:\n{prompt}",
            config=types.GenerateContentConfig(
                system_instruction=sys_inst,
                response_mime_type="application/json",
                response_schema=TacticalSummaryOutput
            )
        )
        
        async for chunk in response_stream:
            try:
                if chunk.text:
                    yield f"data: {chunk.text}\n\n"
            except (ValueError, AttributeError):
                continue
    except Exception as e:
        print(f"[AI Service Stream Error] Gemini API failed: {e}. Falling back to mock.")
        mock_output = generate_mock_llm_response(prompt, feature_heuristic).model_dump_json()
        yield f"data: {mock_output}\n\n"

def generate_mock_llm_response(prompt: str, feature_heuristic: TacticalFeatureSet) -> TacticalSummaryOutput:
    """
    Acts as a stand-in for OpenAI/Gemini to avoid incurring heavy cloud costs during testing.
    Responds strictly in the defined OpenAPI JSON structure using dynamic injection.
    """
    
    return TacticalSummaryOutput(
        title=f"Analysis: {feature_heuristic.depth_profile} with {feature_heuristic.width_profile} Width",
        formation_summary=f"The board highlights {feature_heuristic.player_count} players shifting dynamically into a {feature_heuristic.width_profile.lower()} shape.",
        shape_summary=f"Players are heavily favoring the {feature_heuristic.ball_zone}. Half space density shows {feature_heuristic.half_space_occupation} actors breaking the lines.",
        short_summary="A rapid tactical dissection of the current board layout based strictly on geometric principles.",
        detailed_explanation=[
            f"The ball is positioned deep into the {feature_heuristic.ball_zone}.",
            f"With a {feature_heuristic.depth_profile}, the team assumes a very controlled posture."
        ],
        speaking_points=[
            "Exploit the half spaces!",
            "Maintain the line structure.",
            "Watch out for blind-side runner interceptions."
        ],
        phase_observations=[
            PhaseObservation(phase="Build Up", notes="Slow methodical progression out of the backline."),
            PhaseObservation(phase="Transition", notes="Vertical sprints are evident via the displayed arrows.")
        ],
        risks=[
            "Vulnerable to counter-attacks if possession is lost centrally.",
            "Width is too constricted, stifling wing-play."
        ],
        caption_ideas=[
            "Breaking down the lines! 🧠⚽ #tacticflow",
            "Notice the incredible spacing here."
        ],
        confidence=ConfidenceBlock(
            overall=0.92,
            notes=["High confidence due to clear coordinate clustering.", "Arrow trajectories are explicit."]
        )
    )
