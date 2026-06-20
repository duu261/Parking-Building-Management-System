package com.parkmaster.assistant;

import com.parkmaster.parking.ParkingDtos.BuildingAvailability;
import com.parkmaster.parking.ParkingDtos.BuildingResponse;
import com.parkmaster.parking.ParkingService;
import com.parkmaster.pricing.PricingDtos.PricingPolicyResponse;
import com.parkmaster.pricing.PricingService;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

// Hybrid assistant: always computes a grounded local answer from live parking data,
// then tries Gemini (given that same data as context). Gemini reply wins when available,
// otherwise the local answer is returned. Public surface — no auth, no PII used.
@Service
class AssistantService {

    private static final int MAX_HISTORY = 6;

    private final ParkingService parking;
    private final PricingService pricing;
    private final GeminiClient gemini;

    AssistantService(ParkingService parking, PricingService pricing, GeminiClient gemini) {
        this.parking = parking;
        this.pricing = pricing;
        this.gemini = gemini;
    }

    AssistantDtos.ChatResponse chat(AssistantDtos.ChatRequest req) {
        String context = buildContext();
        String local = localAnswer(req.message());
        var ai = gemini.generate(systemInstruction(context), trimHistory(req.history()),
                req.message());
        return ai.map(reply -> new AssistantDtos.ChatResponse(reply, "ai"))
                .orElseGet(() -> new AssistantDtos.ChatResponse(local, "local"));
    }

    private String systemInstruction(String context) {
        return """
            You are ParkMaster Assistant, a helpful guide for a parking building management \
            system. Answer questions about parking availability, pricing, reservations, \
            monthly passes, and how to use the app. Be concise (2-4 sentences). If asked \
            something unrelated to parking or this app, politely redirect. Use the live data \
            below when relevant; do not invent buildings or prices that are not listed.

            %s""".formatted(context);
    }

    // Keyword-routed fallback. Also the answer used when Gemini is unconfigured/unavailable.
    private String localAnswer(String message) {
        String m = message.toLowerCase(Locale.ROOT);
        if (containsAny(m, "price", "pricing", "cost", "rate", "fee", "how much")) {
            return "Here is our current pricing:\n" + pricingLines();
        }
        if (containsAny(m, "available", "availability", "free", "space", "full", "slot", "spot")) {
            return "Live slot availability:\n" + availabilityLines();
        }
        if (containsAny(m, "reserve", "reservation", "book")) {
            return "To reserve a slot: log in as a driver, open Reservations, pick a vehicle "
                    + "type and time window, then confirm. You will get a QR code for entry.";
        }
        if (containsAny(m, "monthly", "pass", "subscription")) {
            return "Monthly passes give entry for a fixed period and waive the per-exit charge. "
                    + "A manager issues them; once logged in you can see your active pass.";
        }
        if (containsAny(m, "login", "log in", "sign in", "sign up", "signup", "register",
                "account")) {
            return "Use the Login page to sign in, or Sign Up to create a driver account. "
                    + "After login you are routed to your role's dashboard.";
        }
        if (containsAny(m, "check in", "check-in", "checkin", "checkout", "check out",
                "check-out")) {
            return "Staff check vehicles in at the gate (manual slot pick or AI auto-allocate) "
                    + "and check them out to compute the charge. Drivers track their active "
                    + "session in My Parking.";
        }
        return "I can help with parking availability, pricing, reservations, monthly passes, and "
                + "using the app. Try \"What are your prices?\" or \"Are there free slots?\".";
    }

    private String buildContext() {
        return "Live parking availability:\n" + availabilityLines()
                + "\nPricing (per vehicle type):\n" + pricingLines();
    }

    private String availabilityLines() {
        var sb = new StringBuilder();
        for (BuildingResponse b : parking.listBuildings()) {
            try {
                BuildingAvailability a = parking.getAvailability(b.id());
                sb.append("- ").append(a.name()).append(": ")
                        .append(a.availableSlots()).append('/').append(a.totalSlots())
                        .append(" slots free\n");
            } catch (RuntimeException ignored) {
                // Skip a building whose availability can't be read; keep listing the rest.
            }
        }
        return sb.isEmpty() ? "- No buildings configured yet.\n" : sb.toString();
    }

    private String pricingLines() {
        var sb = new StringBuilder();
        for (PricingPolicyResponse p : pricing.listPolicies()) {
            sb.append("- ").append(p.vehicleTypeName()).append(": ")
                    .append(p.ratePerHour()).append("/hour");
            if (p.dailyCap() != null) sb.append(", daily cap ").append(p.dailyCap());
            sb.append(", ").append(p.graceMinutes()).append(" min grace\n");
        }
        return sb.isEmpty() ? "- No pricing configured yet.\n" : sb.toString();
    }

    // Drop blanks, map roles to Gemini's ("user"/"model"), keep the last MAX_HISTORY turns,
    // and ensure the window starts on a user turn (Gemini requires that).
    private List<AssistantDtos.Turn> trimHistory(List<AssistantDtos.Turn> history) {
        if (history == null || history.isEmpty()) return List.of();
        var mapped = new ArrayList<AssistantDtos.Turn>();
        for (var t : history) {
            if (t == null || t.text() == null || t.text().isBlank()) continue;
            boolean isModel = "assistant".equalsIgnoreCase(t.role())
                    || "model".equalsIgnoreCase(t.role());
            mapped.add(new AssistantDtos.Turn(isModel ? "model" : "user", t.text()));
        }
        var tail = mapped.subList(Math.max(0, mapped.size() - MAX_HISTORY), mapped.size());
        int firstUser = 0;
        while (firstUser < tail.size() && !"user".equals(tail.get(firstUser).role())) firstUser++;
        return List.copyOf(tail.subList(firstUser, tail.size()));
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String n : needles) {
            if (haystack.contains(n)) return true;
        }
        return false;
    }
}
