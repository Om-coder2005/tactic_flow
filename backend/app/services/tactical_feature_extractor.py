class TacticalFeatureSet:
    def __init__(self):
        self.width_profile: str = "Unknown"
        self.depth_profile: str = "Unknown"
        self.half_space_occupation: int = 0
        self.ball_zone: str = "Unknown"
        self.player_count: int = 0
        self.arrow_intents: list[str] = []

    def to_llm_prompt_string(self) -> str:
        """Compresses complex JSON into a tiny ~30 token string for massive AI cost savings!"""
        base = f"Players: {self.player_count}. Width: {self.width_profile}. Depth: {self.depth_profile}. "
        base += f"Half-Space Density: {self.half_space_occupation}. Ball: {self.ball_zone}. "
        if self.arrow_intents:
            base += f"Movements: {', '.join(set(self.arrow_intents))}."
        return base

def extract_features(snapshot: dict) -> TacticalFeatureSet:
    """
    Parses exact X/Y coordinate JSON and performs mathematical approximations.
    """
    features = TacticalFeatureSet()
    
    objects = snapshot.get("objects", [])
    if not isinstance(objects, list) or len(objects) == 0:
        return features

    # Filter arrays statically
    players = [o for o in objects if o.get("type") in ("player", "goalkeeper")]
    balls = [o for o in objects if o.get("type") == "ball"]
    arrows = [o for o in objects if "arrow" in str(o.get("type", ""))]

    features.player_count = len(players)

    # 1. Width Profile (X axis variance)
    if players:
        xs = [p.get("x", 50) for p in players]
        spread_x = max(xs) - min(xs)
        if spread_x > 70:
            features.width_profile = "Wide"
        elif spread_x < 30:
            features.width_profile = "Narrow"
        else:
            features.width_profile = "Balanced"

    # 2. Depth Profile (Y axis variance)
    if players:
        ys = [p.get("y", 50) for p in players]
        avg_y = sum(ys) / len(ys)
        if avg_y < 33:
            features.depth_profile = "High line (Attacking third)"
        elif avg_y > 66:
            features.depth_profile = "Low block (Defensive third)"
        else:
            features.depth_profile = "Mid block"

    # 3. Half-space occupancy math (Left half-space is approx X=20-35, Right is X=65-80)
    for p in players:
        x = p.get("x", 50)
        if (20 <= x <= 35) or (65 <= x <= 80):
            features.half_space_occupation += 1

    # 4. Ball logic
    if balls:
        bx = balls[0].get("x", 50)
        by = balls[0].get("y", 50)
        zone = "Central"
        if bx < 33: zone = "Left Flank"
        elif bx > 66: zone = "Right Flank"
        
        y_zone = "Midfield"
        if by < 33: y_zone = "Attacking Third"
        elif by > 66: y_zone = "Defensive Third"
            
        features.ball_zone = f"{zone} {y_zone}"

    # 5. Arrows
    for a in arrows:
        if a.get("dashed"):
            features.arrow_intents.append("pass_attempt")
        else:
            features.arrow_intents.append("player_run")

    return features
