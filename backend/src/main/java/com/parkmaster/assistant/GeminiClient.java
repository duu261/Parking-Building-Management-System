package com.parkmaster.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

// Thin wrapper over the Gemini generateContent REST API using the JDK HttpClient
// (no extra dependency). The API key stays server-side. Any failure or missing key
// returns empty so the caller falls back to the local FAQ answers.
@Component
class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
    private static final String ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private final String apiKey;
    private final String model;
    private final ObjectMapper mapper;
    private final HttpClient http =
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    GeminiClient(@Value("${parkmaster.gemini.api-key:}") String apiKey,
            @Value("${parkmaster.gemini.model:gemini-2.5-flash}") String model,
            ObjectMapper mapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.mapper = mapper;
    }

    boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** history turns must already be mapped to Gemini roles ("user"/"model"). */
    Optional<String> generate(String systemInstruction, List<AssistantDtos.Turn> history,
            String message) {
        if (!isConfigured()) return Optional.empty();
        try {
            var req = HttpRequest.newBuilder(URI.create(String.format(ENDPOINT, model, apiKey)))
                    .timeout(Duration.ofSeconds(12))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(
                            buildBody(systemInstruction, history, message)))
                    .build();
            var res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() / 100 != 2) {
                log.warn("Gemini call failed: status={}", res.statusCode());
                return Optional.empty();
            }
            return extractText(res.body());
        } catch (Exception e) {
            log.warn("Gemini call error: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private String buildBody(String system, List<AssistantDtos.Turn> history, String message)
            throws Exception {
        var root = mapper.createObjectNode();
        root.putObject("system_instruction").putArray("parts").addObject().put("text", system);
        var contents = root.putArray("contents");
        for (var t : history) {
            var c = contents.addObject();
            c.put("role", t.role());
            c.putArray("parts").addObject().put("text", t.text());
        }
        var last = contents.addObject();
        last.put("role", "user");
        last.putArray("parts").addObject().put("text", message);
        var gen = root.putObject("generationConfig");
        gen.put("temperature", 0.4);
        gen.put("maxOutputTokens", 500);
        // Disable "thinking" (2.5 models) — a chat widget doesn't need it, and it burns
        // free-tier token quota + latency. Ignored by models without thinking.
        gen.putObject("thinkingConfig").put("thinkingBudget", 0);
        return mapper.writeValueAsString(root);
    }

    private Optional<String> extractText(String json) throws Exception {
        JsonNode text = mapper.readTree(json)
                .path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (text.isMissingNode() || text.asText().isBlank()) return Optional.empty();
        return Optional.of(text.asText().trim());
    }
}
