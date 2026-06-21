package com.parkmaster.dev;

import com.parkmaster.parking.ParkingDtos.BuildingRequest;
import com.parkmaster.parking.ParkingDtos.BuildingResponse;
import com.parkmaster.parking.ParkingDtos.FloorRequest;
import com.parkmaster.parking.ParkingDtos.FloorResponse;
import com.parkmaster.parking.ParkingDtos.SlotRequest;
import com.parkmaster.parking.ParkingService;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.ParkingSlotRepository;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.pass.MonthlyPass;
import com.parkmaster.pass.MonthlyPassRepository;
import com.parkmaster.payment.Payment;
import com.parkmaster.payment.PaymentMethod;
import com.parkmaster.payment.PaymentRepository;
import com.parkmaster.payment.PaymentStatus;
import com.parkmaster.pricing.PricingDtos.PricingPolicyRequest;
import com.parkmaster.pricing.PricingDtos.VehicleTypeRequest;
import com.parkmaster.pricing.PricingDtos.VehicleTypeResponse;
import com.parkmaster.pricing.PricingService;
import com.parkmaster.pricing.VehicleType;
import com.parkmaster.pricing.VehicleTypeRepository;
import com.parkmaster.reservation.Reservation;
import com.parkmaster.reservation.ReservationRepository;
import com.parkmaster.session.ParkingSession;
import com.parkmaster.session.ParkingSessionRepository;
import com.parkmaster.session.SessionStatus;
import com.parkmaster.user.AdminUserDtos.CreateUserRequest;
import com.parkmaster.user.AdminUserService;
import com.parkmaster.user.Role;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Hand-test fixtures. Runs only under the "dev" profile and only when the users
 * table is empty, so it never seeds a real deployment. Reuses the domain
 * services for setup (passwords hash correctly, same validation as the API),
 * and writes backdated sessions/payments directly so the manager charts have
 * history on first load.
 *
 * Enable: SPRING_PROFILES_ACTIVE=dev mvnd spring-boot:run
 */
@Component
@Profile("dev")
class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);
    private static final String PASSWORD = "password123";
    private static final int HISTORY_DAYS = 30;
    // Weighted to morning + evening rush so the check-ins-by-hour chart shows real peaks.
    private static final int[] PEAK_HOURS = {7, 8, 8, 9, 9, 12, 14, 17, 18, 18, 19, 20};

    private final UserRepository users;
    private final AdminUserService adminUsers;
    private final ParkingService parking;
    private final PricingService pricing;
    private final VehicleTypeRepository vehicleTypes;
    private final ParkingSlotRepository slots;
    private final ParkingSessionRepository sessions;
    private final PaymentRepository payments;
    private final ReservationRepository reservations;
    private final MonthlyPassRepository passes;

    DevDataSeeder(UserRepository users, AdminUserService adminUsers, ParkingService parking,
            PricingService pricing, VehicleTypeRepository vehicleTypes, ParkingSlotRepository slots,
            ParkingSessionRepository sessions, PaymentRepository payments,
            ReservationRepository reservations, MonthlyPassRepository passes) {
        this.users = users;
        this.adminUsers = adminUsers;
        this.parking = parking;
        this.pricing = pricing;
        this.vehicleTypes = vehicleTypes;
        this.slots = slots;
        this.sessions = sessions;
        this.payments = payments;
        this.reservations = reservations;
        this.passes = passes;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (users.count() > 0) {
            log.info("Dev seed skipped: users already present.");
            return;
        }
        log.info("Seeding dev data (profile=dev)...");

        User driver = seedUsers();
        VehicleTypeResponse[] vt = seedVehicleTypes();
        seedBuilding(vt);
        seedBuilding2(vt);
        seedHistory(vt, driver);
        seedLiveDriverSession(vt, driver);
        seedReservation(vt, driver);
        seedMonthlyPass(vt, driver);

        log.info("Dev seed complete. Logins (password '{}'): admin@parkmaster.dev, "
                + "manager@parkmaster.dev, staff@parkmaster.dev, driver@parkmaster.dev", PASSWORD);
    }

    private User seedUsers() {
        adminUsers.create(new CreateUserRequest("admin@parkmaster.dev", PASSWORD, "Ada Admin", Role.ADMIN));
        adminUsers.create(new CreateUserRequest("manager@parkmaster.dev", PASSWORD, "Mai Manager", Role.MANAGER));
        adminUsers.create(new CreateUserRequest("staff@parkmaster.dev", PASSWORD, "Sang Staff", Role.STAFF));
        adminUsers.create(new CreateUserRequest("driver@parkmaster.dev", PASSWORD, "Duc Driver", Role.USER));
        return users.findByEmail("driver@parkmaster.dev").orElseThrow();
    }

    private VehicleTypeResponse[] seedVehicleTypes() {
        var car = pricing.createVehicleType(new VehicleTypeRequest("Car", "Standard 4-wheel vehicle"));
        var bike = pricing.createVehicleType(new VehicleTypeRequest("Motorbike", "2-wheel vehicle"));
        var ev = pricing.createVehicleType(new VehicleTypeRequest("EV", "Electric vehicle, charging bay"));

        // ratePerHour (VND), dailyCap (VND), graceMinutes, peakMultiplier, monthlyPassPrice
        pricing.setPolicy(car.id(), new PricingPolicyRequest(
                new BigDecimal("10000"), new BigDecimal("80000"), 15, new BigDecimal("1.5"),
                new BigDecimal("200000")));
        pricing.setPolicy(bike.id(), new PricingPolicyRequest(
                new BigDecimal("5000"), new BigDecimal("30000"), 15, new BigDecimal("1.2"),
                new BigDecimal("100000")));
        pricing.setPolicy(ev.id(), new PricingPolicyRequest(
                new BigDecimal("15000"), new BigDecimal("100000"), 10, new BigDecimal("1.5"),
                new BigDecimal("300000")));
        return new VehicleTypeResponse[] {car, bike, ev};
    }

    private void seedBuilding(VehicleTypeResponse[] vt) {
        var building = parking.createBuilding(new BuildingRequest("Downtown Garage", "12 Le Loi, District 1"));

        var f1 = parking.createFloor(building.id(), new FloorRequest(1, "Level 1"));
        parking.setFloorVehicleType(f1.id(), vt[0].id());
        fillSlots(f1, "A", 12);

        var f2 = parking.createFloor(building.id(), new FloorRequest(2, "Level 2"));
        parking.setFloorVehicleType(f2.id(), vt[1].id());
        fillSlots(f2, "B", 16);

        var f3 = parking.createFloor(building.id(), new FloorRequest(3, "Level 3"));
        parking.setFloorVehicleType(f3.id(), vt[2].id());
        fillSlots(f3, "C", 8);

        var mixed = parking.createFloor(building.id(), new FloorRequest(4, "Roof (mixed)"));
        fillSlots(mixed, "R", 10);
    }

    private void fillSlots(FloorResponse floor, String prefix, int count) {
        for (int i = 1; i <= count; i++) {
            parking.createSlot(floor.id(), new SlotRequest(String.format("%s-%02d", prefix, i)));
        }
    }

    // Backdated COMPLETED sessions, each with a PAID payment, so revenue / duration /
    // peak-hour / allocation charts populate immediately. Deterministic (fixed seed).
    private void seedHistory(VehicleTypeResponse[] vt, User driver) {
        VehicleType[] types = {
            vehicleTypes.findById(vt[0].id()).orElseThrow(),
            vehicleTypes.findById(vt[1].id()).orElseThrow(),
            vehicleTypes.findById(vt[2].id()).orElseThrow(),
        };
        BigDecimal[] rates = {new BigDecimal("10000"), new BigDecimal("5000"), new BigDecimal("15000")};
        List<ParkingSlot> allSlots = slots.findAll();
        Random rnd = new Random(42);
        int total = 0;

        for (int d = HISTORY_DAYS; d >= 1; d--) {
            LocalDate day = LocalDate.now(ZoneOffset.UTC).minusDays(d);
            int perDay = 4 + rnd.nextInt(6); // 4-9 sessions/day
            for (int i = 0; i < perDay; i++) {
                int t = rnd.nextInt(types.length);
                ParkingSlot slot = allSlots.get(rnd.nextInt(allSlots.size()));
                int hour = PEAK_HOURS[rnd.nextInt(PEAK_HOURS.length)];
                Instant checkIn = day.atTime(hour, rnd.nextInt(60)).toInstant(ZoneOffset.UTC);
                long parkedMin = 30 + rnd.nextInt(300); // 0.5 - 5.5 h
                Instant checkOut = checkIn.plus(Duration.ofMinutes(parkedMin));
                BigDecimal amount = charge(rates[t], parkedMin);
                boolean auto = rnd.nextBoolean();
                boolean owned = rnd.nextInt(4) == 0; // ~25% belong to the demo driver

                ParkingSession s = new ParkingSession(slot, types[t], plate(rnd), auto);
                if (owned) {
                    s.setUser(driver);
                }
                s.setCheckInAt(checkIn);
                s.setCheckOutAt(checkOut);
                s.setAmountCharged(amount);
                s.setStatus(SessionStatus.COMPLETED);
                sessions.save(s);

                Payment p = new Payment(s, amount);
                p.setMethod(owned ? PaymentMethod.ONLINE : PaymentMethod.CASH);
                p.setStatus(PaymentStatus.PAID);
                p.setCreatedAt(checkOut);
                p.setPaidAt(checkOut);
                payments.save(p);
                total++;
            }
        }
        log.info("Seeded {} historical paid sessions over {} days.", total, HISTORY_DAYS);
    }

    // One live session owned by the driver + a PENDING payment, so the driver
    // My Parking view shows the QR ticket and an enabled "Pay online" button.
    private void seedLiveDriverSession(VehicleTypeResponse[] vt, User driver) {
        VehicleType car = vehicleTypes.findById(vt[0].id()).orElseThrow();
        ParkingSlot slot = slots.findAll().stream()
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE)
                .findFirst().orElseThrow();

        Instant checkIn = Instant.now().minus(Duration.ofMinutes(45));
        ParkingSession s = new ParkingSession(slot, car, "51F-00777", false);
        s.setUser(driver);
        s.setCheckInAt(checkIn);
        sessions.save(s);

        slot.setStatus(SlotStatus.OCCUPIED);
        slots.save(slot);

        Payment p = new Payment(s, charge(new BigDecimal("10000"), 45));
        p.setMethod(PaymentMethod.ONLINE);
        // status defaults to PENDING; no paidAt yet.
        payments.save(p);
        log.info("Seeded one live driver session (plate 51F-00777) with a pending payment.");
    }

    private static BigDecimal charge(BigDecimal ratePerHour, long parkedMin) {
        long billedHours = Math.max(1, (long) Math.ceil(parkedMin / 60.0));
        return ratePerHour.multiply(BigDecimal.valueOf(billedHours));
    }

    private static String plate(Random rnd) {
        char letter = (char) ('A' + rnd.nextInt(26));
        return String.format("51%c-%05d", letter, rnd.nextInt(100000));
    }

    private void seedBuilding2(VehicleTypeResponse[] vt) {
        var b2 = parking.createBuilding(new BuildingRequest("Campus Parking", "FPT University, Thu Duc"));

        var f1 = parking.createFloor(b2.id(), new FloorRequest(1, "Ground - Car"));
        parking.setFloorVehicleType(f1.id(), vt[0].id());
        fillSlots(f1, "G", 15);

        var f2 = parking.createFloor(b2.id(), new FloorRequest(2, "Basement - Motorbike"));
        parking.setFloorVehicleType(f2.id(), vt[1].id());
        fillSlots(f2, "D", 25);

        log.info("Campus Parking seeded: 2 floors, 40 slots");
    }

    private void seedReservation(VehicleTypeResponse[] vt, User driver) {
        VehicleType carType = vehicleTypes.findById(vt[0].id()).orElseThrow();
        ParkingSlot slot = slots.findAll().stream()
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE
                        && s.getFloor().getVehicleType() != null
                        && s.getFloor().getVehicleType().getId().equals(carType.getId()))
                .skip(1).findFirst().orElseThrow();
        slot.setStatus(SlotStatus.RESERVED);
        slots.save(slot);
        Reservation reservation = new Reservation(driver, slot, carType, "51A-999.99",
                Instant.now().plus(Duration.ofMinutes(30)));
        reservations.save(reservation);
        log.info("Reservation seeded for driver (slot {})", slot.getCode());
    }

    private void seedMonthlyPass(VehicleTypeResponse[] vt, User driver) {
        VehicleType motoType = vehicleTypes.findById(vt[1].id()).orElseThrow();

        Payment payment = new Payment(new BigDecimal("100000"));
        payment.setMethod(PaymentMethod.ONLINE);
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(Instant.now().minus(Duration.ofDays(5)));
        payments.save(payment);

        MonthlyPass pass = new MonthlyPass(driver, motoType, "59C-123.45",
                LocalDate.now().minusDays(5), LocalDate.now().plusDays(25));
        pass.setStatus(com.parkmaster.pass.PassStatus.ACTIVE);
        pass.setPayment(payment);
        passes.save(pass);
        log.info("Monthly pass seeded for driver (plate {})", pass.getLicensePlate());
    }
}
