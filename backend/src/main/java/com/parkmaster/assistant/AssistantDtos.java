package com.parkmaster.assistant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

final class AssistantDtos {

    private AssistantDtos() {}

    /** One chat turn. role is "user" or "assistant"/"model" (mapped before sending to Gemini). */
    record Turn(String role, String text) {}

    record ChatRequest(
            @NotBlank @Size(max = 1000) String message,
            List<Turn> history) {}

    /** source = "ai" when answered by Gemini, "local" when answered by the built-in FAQ. */
    record ChatResponse(String reply, String source) {}
}
