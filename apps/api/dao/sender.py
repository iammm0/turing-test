import enum

class SenderRole(str, enum.Enum):
    I = "I"  # Interrogator
    A = "A"  # AI 或 AI 证人
    H = "H"  # Human 证人