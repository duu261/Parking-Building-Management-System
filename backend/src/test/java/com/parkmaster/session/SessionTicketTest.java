package com.parkmaster.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.pricing.VehicleType;
import java.util.Optional;
import org.junit.jupiter.api.Test;

/** Ticket code + QR rendering + scan lookup. Repos/collaborators mocked where needed. */
class SessionTicketTest {

    @Test
    void everySessionGetsAUniqueTicketCodeOnCreation() {
        var vt = new VehicleType("Car", "4 wheels");
        ParkingSession a = new ParkingSession(null, vt, "51A-1", false);
        ParkingSession b = new ParkingSession(null, vt, "51A-2", false);

        assertThat(a.getTicketCode()).isNotBlank();
        assertThat(a.getTicketCode()).isNotEqualTo(b.getTicketCode());
    }

    @Test
    void qrGeneratorReturnsPngBytes() {
        byte[] png = QrCodeGenerator.pngFor("ticket-abc-123");

        assertThat(png).isNotEmpty();
        // PNG magic number: 0x89 'P' 'N' 'G'
        assertThat(png[0] & 0xFF).isEqualTo(0x89);
        assertThat(new String(png, 1, 3)).isEqualTo("PNG");
    }

    @Test
    void byTicketResolvesScannedCode() {
        var sessions = mock(ParkingSessionRepository.class);
        var slot = slotWithId(3L);
        var vt = vehicleTypeWithId(2L);
        var session = mock(ParkingSession.class);
        when(session.getId()).thenReturn(7L);
        when(session.getSlot()).thenReturn(slot);
        when(session.getVehicleType()).thenReturn(vt);
        when(session.getLicensePlate()).thenReturn("51A-9");
        when(session.getTicketCode()).thenReturn("scan-me");
        when(session.getStatus()).thenReturn(SessionStatus.ACTIVE);
        when(sessions.findByTicketCode("scan-me")).thenReturn(Optional.of(session));

        var service = new ParkingSessionService(sessions, null, null, null, null, null, null);

        var res = service.byTicket("scan-me");

        assertThat(res.id()).isEqualTo(7L);
        assertThat(res.ticketCode()).isEqualTo("scan-me");
    }

    @Test
    void byTicketUnknownCodeThrows() {
        var sessions = mock(ParkingSessionRepository.class);
        when(sessions.findByTicketCode("nope")).thenReturn(Optional.empty());
        var service = new ParkingSessionService(sessions, null, null, null, null, null, null);

        assertThatThrownBy(() -> service.byTicket("nope")).isInstanceOf(ApiException.class);
    }

    private ParkingSlot slotWithId(Long id) {
        var slot = mock(ParkingSlot.class);
        when(slot.getId()).thenReturn(id);
        return slot;
    }

    private VehicleType vehicleTypeWithId(Long id) {
        var vt = mock(VehicleType.class);
        when(vt.getId()).thenReturn(id);
        return vt;
    }
}
