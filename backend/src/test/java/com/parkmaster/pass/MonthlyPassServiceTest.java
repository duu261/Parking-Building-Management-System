package com.parkmaster.pass;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.pass.PassDtos.IssueRequest;
import com.parkmaster.payment.Payment;
import com.parkmaster.payment.PaymentRepository;
import com.parkmaster.pricing.PricingPolicy;
import com.parkmaster.pricing.PricingPolicyRepository;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.user.Role;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class MonthlyPassServiceTest {

    private MonthlyPassRepository passes;
    private UserRepository users;
    private com.parkmaster.pricing.VehicleTypeRepository vehicleTypes;
    private PricingPolicyRepository pricingPolicies;
    private PaymentRepository paymentRepo;
    private MonthlyPassService service;

    private User user;
    private VehicleType car;
    private PricingPolicy carPricing;

    @BeforeEach
    void setUp() {
        passes = Mockito.mock(MonthlyPassRepository.class);
        users = Mockito.mock(UserRepository.class);
        vehicleTypes = Mockito.mock(com.parkmaster.pricing.VehicleTypeRepository.class);
        pricingPolicies = Mockito.mock(PricingPolicyRepository.class);
        paymentRepo = Mockito.mock(PaymentRepository.class);
        service = new MonthlyPassService(passes, users, vehicleTypes, pricingPolicies, paymentRepo);

        user = new User("d@x.com", "hash", "Driver D", Role.USER);
        car = new VehicleType("Car", null);
        carPricing = Mockito.mock(PricingPolicy.class);
        when(carPricing.getMonthlyPassPrice()).thenReturn(new BigDecimal("200000"));
    }

    @Test
    void issuePersistsAndReturns() {
        when(users.findByEmail("d@x.com")).thenReturn(Optional.of(user));
        when(vehicleTypes.findById(2L)).thenReturn(Optional.of(car));
        when(passes.findByLicensePlateIgnoreCaseAndVehicleType_IdAndStatusIn(
                eq("51A-123"), eq(2L), any())).thenReturn(List.of());
        when(pricingPolicies.findByVehicleTypeId(2L)).thenReturn(Optional.of(carPricing));
        when(paymentRepo.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(passes.save(any(MonthlyPass.class))).thenAnswer(inv -> inv.getArgument(0));

        var resp = service.issue(req(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31)));

        assertThat(resp.licensePlate()).isEqualTo("51A-123");
        assertThat(resp.status()).isEqualTo("PENDING");
        assertThat(resp.validFrom()).isEqualTo(LocalDate.of(2026, 7, 1));
        assertThat(resp.validUntil()).isEqualTo(LocalDate.of(2026, 7, 31));
    }

    @Test
    void issueRejectsInvertedDates() {
        assertThatThrownBy(() ->
                service.issue(req(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 7, 1))))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void issueRejectsMissingUser() {
        when(users.findByEmail("d@x.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() ->
                service.issue(req(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31))))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void issueRejectsMissingVehicleType() {
        when(users.findByEmail("d@x.com")).thenReturn(Optional.of(user));
        when(vehicleTypes.findById(2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() ->
                service.issue(req(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31))))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void issueRejectsOverlappingActivePass() {
        when(users.findByEmail("d@x.com")).thenReturn(Optional.of(user));
        when(vehicleTypes.findById(2L)).thenReturn(Optional.of(car));
        MonthlyPass existing = new MonthlyPass(user, car, "51A-123",
                LocalDate.of(2026, 7, 15), LocalDate.of(2026, 8, 15));
        when(passes.findByLicensePlateIgnoreCaseAndVehicleType_IdAndStatusIn(
                eq("51A-123"), eq(2L), any())).thenReturn(List.of(existing));

        assertThatThrownBy(() ->
                service.issue(req(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31))))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void issueAllowsNonOverlappingActivePass() {
        when(users.findByEmail("d@x.com")).thenReturn(Optional.of(user));
        when(vehicleTypes.findById(2L)).thenReturn(Optional.of(car));
        MonthlyPass existing = new MonthlyPass(user, car, "51A-123",
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31));
        when(passes.findByLicensePlateIgnoreCaseAndVehicleType_IdAndStatusIn(
                eq("51A-123"), eq(2L), any())).thenReturn(List.of(existing));
        when(pricingPolicies.findByVehicleTypeId(2L)).thenReturn(Optional.of(carPricing));
        when(paymentRepo.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(passes.save(any(MonthlyPass.class))).thenAnswer(inv -> inv.getArgument(0));

        var resp = service.issue(req(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31)));

        assertThat(resp.licensePlate()).isEqualTo("51A-123");
        assertThat(resp.status()).isEqualTo("PENDING");
        assertThat(resp.validFrom()).isEqualTo(LocalDate.of(2026, 7, 1));
        assertThat(resp.validUntil()).isEqualTo(LocalDate.of(2026, 7, 31));
    }

    @Test
    void revokeSetsExpired() {
        MonthlyPass pass = new MonthlyPass(user, car, "51A-123",
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));
        when(passes.findById(5L)).thenReturn(Optional.of(pass));
        when(passes.save(any(MonthlyPass.class))).thenAnswer(inv -> inv.getArgument(0));

        var resp = service.revoke(5L);

        assertThat(resp.status()).isEqualTo("EXPIRED");
        assertThat(pass.getStatus()).isEqualTo(PassStatus.EXPIRED);
    }

    @Test
    void hasActivePassDelegatesToRepository() {
        when(passes.existsByLicensePlateIgnoreCaseAndVehicleType_IdAndStatusAndValidFromLessThanEqualAndValidUntilGreaterThanEqual(
                eq("51A-123"), eq(2L), eq(PassStatus.ACTIVE), any(), any())).thenReturn(true);

        assertThat(service.hasActivePass("51A-123", 2L, LocalDate.of(2026, 7, 10))).isTrue();
    }

    @Test
    void hasActivePassNullSafe() {
        assertThat(service.hasActivePass(null, 2L, LocalDate.now())).isFalse();
    }

    private IssueRequest req(LocalDate from, LocalDate until) {
        return new IssueRequest("d@x.com", 2L, "51A-123", from, until);
    }
}
