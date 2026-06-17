package com.parkmaster.pricing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.pricing.PricingDtos.PricingPolicyRequest;
import com.parkmaster.pricing.PricingDtos.VehicleTypeRequest;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

/** Unit test for PricingService — repositories mocked, no Spring context. */
class PricingServiceTest {

    private VehicleTypeRepository vehicleTypes;
    private PricingPolicyRepository policies;
    private PricingService service;

    @BeforeEach
    void setUp() {
        vehicleTypes = Mockito.mock(VehicleTypeRepository.class);
        policies = Mockito.mock(PricingPolicyRepository.class);
        service = new PricingService(vehicleTypes, policies);
    }

    @Test
    void duplicateVehicleTypeNameRejected() {
        when(vehicleTypes.existsByNameIgnoreCase("Car")).thenReturn(true);
        assertThatThrownBy(() -> service.createVehicleType(new VehicleTypeRequest("Car", null)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void createVehicleTypePersistsAndReturns() {
        when(vehicleTypes.existsByNameIgnoreCase("Truck")).thenReturn(false);
        when(vehicleTypes.save(any(VehicleType.class))).thenAnswer(inv -> inv.getArgument(0));
        var resp = service.createVehicleType(new VehicleTypeRequest("Truck", "Heavy"));
        assertThat(resp.name()).isEqualTo("Truck");
        assertThat(resp.description()).isEqualTo("Heavy");
    }

    @Test
    void getPolicyForMissingVehicleTypeThrows() {
        when(vehicleTypes.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getPolicy(99L)).isInstanceOf(ApiException.class);
    }

    @Test
    void setPolicyCreatesWhenAbsent() {
        VehicleType car = new VehicleType("Car", null);
        when(vehicleTypes.findById(1L)).thenReturn(Optional.of(car));
        when(policies.findByVehicleTypeId(1L)).thenReturn(Optional.empty());
        when(policies.save(any(PricingPolicy.class))).thenAnswer(inv -> inv.getArgument(0));
        var resp = service.setPolicy(1L, new PricingPolicyRequest(new BigDecimal("3.00"),
                new BigDecimal("20.00"), 15, new BigDecimal("1.5")));
        assertThat(resp.ratePerHour()).isEqualByComparingTo("3.00");
        assertThat(resp.dailyCap()).isEqualByComparingTo("20.00");
        assertThat(resp.graceMinutes()).isEqualTo(15);
        assertThat(resp.peakMultiplier()).isEqualByComparingTo("1.5");
    }

    @Test
    void setPolicyUpdatesExisting() {
        VehicleType car = new VehicleType("Car", null);
        PricingPolicy existing = new PricingPolicy(car, new BigDecimal("2.00"), null, 0);
        when(vehicleTypes.findById(1L)).thenReturn(Optional.of(car));
        when(policies.findByVehicleTypeId(1L)).thenReturn(Optional.of(existing));
        when(policies.save(any(PricingPolicy.class))).thenAnswer(inv -> inv.getArgument(0));
        var resp = service.setPolicy(1L, new PricingPolicyRequest(new BigDecimal("5.00"), null, 10,
                BigDecimal.ONE));
        assertThat(resp.ratePerHour()).isEqualByComparingTo("5.00");
        assertThat(existing.getRatePerHour()).isEqualByComparingTo("5.00");
        assertThat(existing.getGraceMinutes()).isEqualTo(10);
    }
}
