package com.parkmaster.exceptionreport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.exceptionreport.ExceptionDtos.ExceptionResponse;
import com.parkmaster.session.ParkingSession;
import com.parkmaster.session.ParkingSessionRepository;
import com.parkmaster.user.Role;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/** Unit test for ExceptionReportService — repositories mocked, no Spring context. */
class ExceptionReportServiceTest {

    private ExceptionReportRepository reports;
    private UserRepository users;
    private ParkingSessionRepository sessions;
    private ExceptionReportService service;

    @BeforeEach
    void setUp() {
        reports = Mockito.mock(ExceptionReportRepository.class);
        users = Mockito.mock(UserRepository.class);
        sessions = Mockito.mock(ParkingSessionRepository.class);
        when(reports.save(any(ExceptionReport.class))).thenAnswer(inv -> inv.getArgument(0));
        service = new ExceptionReportService(reports, users, sessions);
    }

    private User staff() {
        return new User("staff@x.com", "hash", "Staff", Role.STAFF);
    }

    @Test
    void createWithoutSessionOpensReport() {
        when(users.findByEmail("staff@x.com")).thenReturn(Optional.of(staff()));

        ExceptionResponse res = service.create("staff@x.com", ExceptionType.LOST_TICKET,
                "Driver lost ticket", null);

        assertThat(res.status()).isEqualTo(ExceptionStatus.OPEN);
        assertThat(res.sessionId()).isNull();
        assertThat(res.reportedBy()).isEqualTo("staff@x.com");
    }

    @Test
    void createWithSessionLinksIt() {
        when(users.findByEmail("staff@x.com")).thenReturn(Optional.of(staff()));
        ParkingSession session = Mockito.mock(ParkingSession.class);
        when(session.getId()).thenReturn(7L);
        when(sessions.findById(7L)).thenReturn(Optional.of(session));

        ExceptionResponse res = service.create("staff@x.com", ExceptionType.WRONG_PLATE,
                "Plate mismatch", 7L);

        assertThat(res.sessionId()).isEqualTo(7L);
    }

    @Test
    void createWithUnknownSessionFails() {
        when(users.findByEmail("staff@x.com")).thenReturn(Optional.of(staff()));
        when(sessions.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create("staff@x.com", ExceptionType.OVERTIME, "x", 99L))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void resolveSetsResolvedStateAndNote() {
        ExceptionReport report = new ExceptionReport(staff(), ExceptionType.WRONG_ZONE, "wrong zone",
                null);
        when(reports.findById(1L)).thenReturn(Optional.of(report));

        ExceptionResponse res = service.resolve(1L, "Moved vehicle to correct zone");

        assertThat(res.status()).isEqualTo(ExceptionStatus.RESOLVED);
        assertThat(res.resolutionNote()).isEqualTo("Moved vehicle to correct zone");
        assertThat(res.resolvedAt()).isNotNull();
    }

    @Test
    void resolveAlreadyResolvedFails() {
        ExceptionReport report = new ExceptionReport(staff(), ExceptionType.WRONG_ZONE, "x", null);
        report.setStatus(ExceptionStatus.RESOLVED);
        when(reports.findById(1L)).thenReturn(Optional.of(report));

        assertThatThrownBy(() -> service.resolve(1L, "note")).isInstanceOf(ApiException.class);
    }
}
