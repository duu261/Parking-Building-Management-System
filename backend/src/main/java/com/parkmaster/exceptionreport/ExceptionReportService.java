package com.parkmaster.exceptionreport;

import com.parkmaster.common.ApiException;
import com.parkmaster.exceptionreport.ExceptionDtos.ExceptionResponse;
import com.parkmaster.session.ParkingSession;
import com.parkmaster.session.ParkingSessionRepository;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExceptionReportService {

    private final ExceptionReportRepository reports;
    private final UserRepository users;
    private final ParkingSessionRepository sessions;

    public ExceptionReportService(ExceptionReportRepository reports, UserRepository users,
            ParkingSessionRepository sessions) {
        this.reports = reports;
        this.users = users;
        this.sessions = sessions;
    }

    @Transactional
    public ExceptionResponse create(String reporterEmail, ExceptionType type, String description,
            Long sessionId) {
        User reporter = users.findByEmail(reporterEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reporter not found"));
        ParkingSession session = null;
        if (sessionId != null) {
            session = sessions.findById(sessionId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        }
        ExceptionReport report = new ExceptionReport(reporter, type, description, session);
        return ExceptionResponse.from(reports.save(report));
    }

    @Transactional(readOnly = true)
    public List<ExceptionResponse> listOpen() {
        return reports.findByStatusOrderByCreatedAt(ExceptionStatus.OPEN).stream()
                .map(ExceptionResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ExceptionResponse get(Long id) {
        return ExceptionResponse.from(reports.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Exception report not found")));
    }

    @Transactional
    public ExceptionResponse resolve(Long id, String resolutionNote) {
        ExceptionReport report = reports.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Exception report not found"));
        if (report.getStatus() == ExceptionStatus.RESOLVED) {
            throw new ApiException(HttpStatus.CONFLICT, "Exception report already resolved");
        }
        report.setStatus(ExceptionStatus.RESOLVED);
        report.setResolutionNote(resolutionNote);
        report.setResolvedAt(Instant.now());
        return ExceptionResponse.from(report);
    }
}
