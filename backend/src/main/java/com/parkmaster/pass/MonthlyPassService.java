package com.parkmaster.pass;

import com.parkmaster.common.ApiException;
import com.parkmaster.pass.PassDtos.IssueRequest;
import com.parkmaster.pass.PassDtos.PassResponse;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.pricing.VehicleTypeRepository;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MonthlyPassService {

    private final MonthlyPassRepository passes;
    private final UserRepository users;
    private final VehicleTypeRepository vehicleTypes;

    public MonthlyPassService(MonthlyPassRepository passes, UserRepository users,
            VehicleTypeRepository vehicleTypes) {
        this.passes = passes;
        this.users = users;
        this.vehicleTypes = vehicleTypes;
    }

    @Transactional
    public PassResponse issue(IssueRequest req) {
        if (req.validUntil().isBefore(req.validFrom())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "validUntil must be on or after validFrom");
        }
        User user = users.findByEmail(req.email())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        VehicleType type = vehicleTypes.findById(req.vehicleTypeId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle type not found"));

        // ponytail: check-then-save races if two managers issue the same plate+type
        // concurrently; manual admin action, near-zero contention. Add a btree_gist
        // exclusion constraint on (license_plate, vehicle_type_id, daterange) if it matters.
        boolean overlap = passes
                .findByLicensePlateIgnoreCaseAndVehicleType_IdAndStatus(
                        req.licensePlate(), req.vehicleTypeId(), PassStatus.ACTIVE)
                .stream()
                .anyMatch(p -> !p.getValidFrom().isAfter(req.validUntil())
                        && !p.getValidUntil().isBefore(req.validFrom()));
        if (overlap) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "An active pass already covers this period for this vehicle");
        }

        MonthlyPass pass = new MonthlyPass(user, type, req.licensePlate(),
                req.validFrom(), req.validUntil());
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
}
