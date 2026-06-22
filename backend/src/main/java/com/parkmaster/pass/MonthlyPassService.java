package com.parkmaster.pass;

import com.parkmaster.common.ApiException;
import com.parkmaster.pass.PassDtos.IssueRequest;
import com.parkmaster.pass.PassDtos.PassResponse;
import com.parkmaster.payment.Payment;
import java.time.Instant;
import com.parkmaster.payment.PaymentMethod;
import com.parkmaster.payment.PaymentRepository;
import com.parkmaster.payment.PaymentStatus;
import com.parkmaster.pricing.PricingPolicy;
import com.parkmaster.pricing.PricingPolicyRepository;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.pricing.VehicleTypeRepository;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MonthlyPassService {

    private final MonthlyPassRepository passes;
    private final UserRepository users;
    private final VehicleTypeRepository vehicleTypes;
    private final PricingPolicyRepository pricingPolicies;
    private final PaymentRepository paymentRepo;

    public MonthlyPassService(MonthlyPassRepository passes, UserRepository users,
            VehicleTypeRepository vehicleTypes, PricingPolicyRepository pricingPolicies,
            PaymentRepository paymentRepo) {
        this.passes = passes;
        this.users = users;
        this.vehicleTypes = vehicleTypes;
        this.pricingPolicies = pricingPolicies;
        this.paymentRepo = paymentRepo;
    }

    @Transactional
    public PassResponse issue(IssueRequest req) {
        return issue(req, false);
    }

    @Transactional
    public PassResponse issueByManager(IssueRequest req) {
        return issue(req, true);
    }

    private PassResponse issue(IssueRequest req, boolean cashPayment) {
        if (req.validUntil().isBefore(req.validFrom())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "validUntil must be on or after validFrom");
        }
        User user = users.findByEmail(req.email())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        VehicleType type = vehicleTypes.findById(req.vehicleTypeId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle type not found"));

        List<MonthlyPass> existing = passes
                .findByLicensePlateIgnoreCaseAndVehicleType_IdAndStatusIn(
                        req.licensePlate(), req.vehicleTypeId(),
                        List.of(PassStatus.ACTIVE, PassStatus.PENDING));
        boolean overlap = existing.stream()
                .anyMatch(p -> !p.getValidFrom().isAfter(req.validUntil())
                        && !p.getValidUntil().isBefore(req.validFrom()));
        if (overlap) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "An active pass already covers this period for this vehicle");
        }

        PricingPolicy pricing = pricingPolicies.findByVehicleTypeId(req.vehicleTypeId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "No pricing policy for this vehicle type"));
        BigDecimal passPrice = pricing.getMonthlyPassPrice();
        if (passPrice == null || passPrice.signum() == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Monthly pass price not configured for this vehicle type");
        }

        MonthlyPass pass = new MonthlyPass(user, type, req.licensePlate(),
                req.validFrom(), req.validUntil());

        Payment payment = new Payment(passPrice);
        if (cashPayment) {
            payment.setMethod(PaymentMethod.CASH);
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(Instant.now());
        } else {
            payment.setMethod(PaymentMethod.ONLINE);
        }
        paymentRepo.save(payment);

        pass.setPayment(payment);
        if (cashPayment) {
            pass.setStatus(PassStatus.ACTIVE);
        }
        return PassResponse.from(passes.save(pass));
    }

    @Transactional(readOnly = true)
    public List<PassResponse> list() {
        return passes.findAllByOrderByCreatedAtDesc().stream().map(PassResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PassResponse get(Long id) {
        return PassResponse.from(passes.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pass not found")));
    }

    @Transactional
    public PassResponse revoke(Long id) {
        MonthlyPass pass = passes.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pass not found"));
        pass.setStatus(PassStatus.EXPIRED);
        return PassResponse.from(passes.save(pass));
    }

    /** True when an ACTIVE pass for this plate+type covers onDate. Used at checkout. */
    @Transactional(readOnly = true)
    public boolean hasActivePass(String licensePlate, Long vehicleTypeId, LocalDate onDate) {
        if (licensePlate == null || vehicleTypeId == null) {
            return false;
        }
        return passes
                .existsByLicensePlateIgnoreCaseAndVehicleType_IdAndStatusAndValidFromLessThanEqualAndValidUntilGreaterThanEqual(
                        licensePlate, vehicleTypeId, PassStatus.ACTIVE, onDate, onDate);
    }

    @Transactional
    public PassResponse activateById(Long id) {
        MonthlyPass pass = passes.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pass not found"));
        if (pass.getStatus() != PassStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only PENDING passes can be activated");
        }
        pass.setStatus(PassStatus.ACTIVE);
        Payment payment = pass.getPayment();
        if (payment != null && payment.getStatus() != PaymentStatus.PAID) {
            payment.setMethod(PaymentMethod.CASH);
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(Instant.now());
        }
        return PassResponse.from(passes.save(pass));
    }

    @Transactional(readOnly = true)
    public Optional<User> findUserByPlate(String licensePlate) {
        return passes.findFirstByLicensePlateIgnoreCaseAndStatusOrderByCreatedAtDesc(
                licensePlate, PassStatus.ACTIVE).map(MonthlyPass::getUser);
    }

    @Transactional(readOnly = true)
    public PassResponse findActiveByPlate(String plate) {
        return passes.findFirstByLicensePlateIgnoreCaseAndStatusOrderByCreatedAtDesc(
                plate, PassStatus.ACTIVE)
                .map(PassResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No active pass for this plate"));
    }

    @Transactional
    public void activatePass(Payment payment) {
        passes.findByPayment_Id(payment.getId()).ifPresent(pass -> {
            if (pass.getStatus() == PassStatus.PENDING) {
                pass.setStatus(PassStatus.ACTIVE);
            }
        });
    }
}
