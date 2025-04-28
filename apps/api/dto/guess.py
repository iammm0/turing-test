from pydantic import BaseModel


class GuessIn(BaseModel):
    suspect_ai: bool
