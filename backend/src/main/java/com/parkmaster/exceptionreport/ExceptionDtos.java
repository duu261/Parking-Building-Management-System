package com.parkmaster.exceptionreport;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class ExceptionDtos {

    private ExceptionDtos() {}

    public record CreateExceptionRequest(
            @NotNull ExceptionType type,
            @NotBlank @Size(max = 1000) String description,
            Long sessionId) {}

    public record ResolveExceptionRequest(@NotBlank @Size(max = 1000) String resolutionNote) {}

    public record ExceptionResponse(Long id, ExceptionType type, ExceptionStatus status,
            String description, Long sessionId, String reportedBy, String resolutionNote,
            Instant createdAt, Instant resolvedAt) {

        static ExceptionResponse from(ExceptionReport r) {
            return new ExceptionResponse(r.getId(), r.getType(), r.getStatus(), r.getDescription(),
                    r.getSession() == null ? null : r.getSession().getId(),
                    r.getReportedBy().getEmail(), r.getResolutionNote(), r.getCreatedAt(),
                    r.getResolvedAt());
        }
    }
}
