package com.parkmaster.dev;

import com.parkmaster.exceptionreport.ExceptionReport;
import com.parkmaster.exceptionreport.ExceptionReportRepository;
import com.parkmaster.exceptionreport.ExceptionStatus;
import com.parkmaster.exceptionreport.ExceptionType;
import com.parkmaster.feedback.Feedback;
import com.parkmaster.feedback.FeedbackRepository;
import com.parkmaster.parking.ParkingDtos.BuildingRequest;
import com.parkmaster.parking.ParkingDtos.FloorRequest;
import com.parkmaster.parking.ParkingDtos.FloorResponse;
import com.parkmaster.parking.ParkingDtos.SlotRequest;
import com.parkmaster.parking.ParkingService;
import com.parkmaster.parking.ParkingSlot;
import com.parkmaster.parking.ParkingSlotRepository;
import com.parkmaster.parking.SlotStatus;
import com.parkmaster.pass.MonthlyPass;
import com.parkmaster.pass.MonthlyPassRepository;
import com.parkmaster.pass.PassStatus;
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
import com.parkmaster.parking.ParkingBuilding;
import com.parkmaster.parking.ParkingBuildingRepository;
import com.parkmaster.reservation.Reservation;
import com.parkmaster.reservation.ReservationRepository;
import com.parkmaster.reservation.ReservationStatus;
import com.parkmaster.reservation.ReservationType;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("dev")
class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);
    private static final String PASSWORD = "password123";
    private static final int HISTORY_DAYS = 30;
    private static final int[] PEAK_HOURS = {7, 8, 8, 9, 9, 12, 14, 17, 18, 18, 19, 20};

    private static final String[] DRIVER_NAMES = {
        "Nguyen Van Minh", "Tran Thi Lan", "Le Hoang Nam", "Pham Duc Anh",
        "Vo Thi Mai", "Hoang Quoc Bao", "Dang Thi Huong"
    };
    private static final String[] DRIVER_EMAILS = {
        "minh.nguyen@gmail.com", "lan.tran@gmail.com", "nam.le@gmail.com",
        "anh.pham@gmail.com", "mai.vo@gmail.com", "bao.hoang@gmail.com",
        "huong.dang@gmail.com"
    };
    private static final String[] DRIVER_PLATES = {
        "51F-123.45", "59C-678.90", "51G-111.22", "30A-333.44",
        "51H-555.66", "43B-777.88", "92C-999.00"
    };

    private static final String[] FEEDBACK_COMMENTS = {
        "Very convenient parking system. The auto-allocation saved me a lot of time!",
        "Staff was helpful when I had trouble with the check-out process.",
        "Good location but could use better lighting on Level 2.",
        "The online payment is super fast. Love the QR code feature!",
        "Waited too long for the gate to open. Needs improvement.",
        "Clean and well-organized parking building. Will come back!",
        "Price is reasonable for the area. Monthly pass is a great deal.",
        "The app is easy to use. Found my slot quickly with auto-allocation.",
        "Had an issue with wrong plate detection but staff resolved it fast.",
        "Great experience overall. The reservation feature is very useful.",
        "Parking space was a bit tight for my SUV.",
        "Excellent service! The EV charging bay is a nice touch.",
    };

    private static final String[] ALLOC_SCORES = {
        "{\"vehicleTypeMatch\":40,\"loadBalance\":22,\"distanceToEntry\":18,\"peakHour\":8,\"total\":88,\"alternativesConsidered\":12}",
        "{\"vehicleTypeMatch\":20,\"loadBalance\":28,\"distanceToEntry\":14,\"peakHour\":10,\"total\":72,\"alternativesConsidered\":18}",
        "{\"vehicleTypeMatch\":40,\"loadBalance\":18,\"distanceToEntry\":20,\"peakHour\":6,\"total\":84,\"alternativesConsidered\":15}",
    };

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
    private final ExceptionReportRepository exceptions;
    private final FeedbackRepository feedbacks;
    private final ParkingBuildingRepository buildings;

    DevDataSeeder(UserRepository users, AdminUserService adminUsers, ParkingService parking,
            PricingService pricing, VehicleTypeRepository vehicleTypes, ParkingSlotRepository slots,
            ParkingSessionRepository sessions, PaymentRepository payments,
            ReservationRepository reservations, MonthlyPassRepository passes,
            ExceptionReportRepository exceptions, FeedbackRepository feedbacks,
            ParkingBuildingRepository buildings) {
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
        this.exceptions = exceptions;
        this.feedbacks = feedbacks;
        this.buildings = buildings;
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
        List<User> extraDrivers = seedExtraDrivers();
        VehicleTypeResponse[] vt = seedVehicleTypes();
        seedBuilding(vt);
        seedBuilding2(vt);
        seedSlotStatuses();

        List<User> allDrivers = new ArrayList<>();
        allDrivers.add(driver);
        allDrivers.addAll(extraDrivers);

        List<ParkingSession> completedSessions = seedHistory(vt, allDrivers);
        seedLiveDriverSession(vt, driver);
        seedLiveSessions(vt, extraDrivers);
        seedReservation(vt, driver);
        seedExtraReservations(vt, extraDrivers);
        seedMonthlyPass(vt, driver);
        seedExtraPasses(vt, extraDrivers);
        seedExceptionReports(completedSessions, allDrivers);
        seedFeedback(completedSessions, allDrivers);

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

    private List<User> seedExtraDrivers() {
        List<User> drivers = new ArrayList<>();
        for (int i = 0; i < DRIVER_NAMES.length; i++) {
            adminUsers.create(new CreateUserRequest(DRIVER_EMAILS[i], PASSWORD, DRIVER_NAMES[i], Role.USER));
            drivers.add(users.findByEmail(DRIVER_EMAILS[i]).orElseThrow());
        }
        log.info("Seeded {} extra driver accounts.", drivers.size());
        return drivers;
    }

    private VehicleTypeResponse[] seedVehicleTypes() {
        var car = pricing.createVehicleType(new VehicleTypeRequest("Car", "Standard 4-wheel vehicle"));
        var bike = pricing.createVehicleType(new VehicleTypeRequest("Motorbike", "2-wheel vehicle"));
        var ev = pricing.createVehicleType(new VehicleTypeRequest("EV", "Electric vehicle, charging bay"));

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

    private void seedSlotStatuses() {
        List<ParkingSlot> available = slots.findAll().stream()
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE)
                .toList();
        if (available.size() >= 2) {
            ParkingSlot maint = available.get(available.size() - 1);
            maint.setStatus(SlotStatus.MAINTENANCE);
            slots.save(maint);

            ParkingSlot locked = available.get(available.size() - 2);
            locked.setStatus(SlotStatus.LOCKED);
            slots.save(locked);
            log.info("Set slot {} to MAINTENANCE, {} to LOCKED.", maint.getCode(), locked.getCode());
        }
    }

    private void fillSlots(FloorResponse floor, String prefix, int count) {
        for (int i = 1; i <= count; i++) {
            parking.createSlot(floor.id(), new SlotRequest(String.format("%s-%02d", prefix, i)));
        }
    }

    private List<ParkingSession> seedHistory(VehicleTypeResponse[] vt, List<User> allDrivers) {
        VehicleType[] types = {
            vehicleTypes.findById(vt[0].id()).orElseThrow(),
            vehicleTypes.findById(vt[1].id()).orElseThrow(),
            vehicleTypes.findById(vt[2].id()).orElseThrow(),
        };
        BigDecimal[] rates = {new BigDecimal("10000"), new BigDecimal("5000"), new BigDecimal("15000")};
        List<ParkingSlot> allSlots = slots.findAll();
        Random rnd = new Random(42);
        List<ParkingSession> completed = new ArrayList<>();
        PaymentMethod[] methods = {PaymentMethod.CASH, PaymentMethod.ONLINE, PaymentMethod.VNPAY};

        for (int d = HISTORY_DAYS; d >= 1; d--) {
            LocalDate day = LocalDate.now(ZoneOffset.UTC).minusDays(d);
            int perDay = 6 + rnd.nextInt(10);
            for (int i = 0; i < perDay; i++) {
                int t = rnd.nextInt(types.length);
                ParkingSlot slot = allSlots.get(rnd.nextInt(allSlots.size()));
                int hour = PEAK_HOURS[rnd.nextInt(PEAK_HOURS.length)];
                Instant checkIn = day.atTime(hour, rnd.nextInt(60)).toInstant(ZoneOffset.UTC);
                long parkedMin = 30 + rnd.nextInt(300);
                Instant checkOut = checkIn.plus(Duration.ofMinutes(parkedMin));
                BigDecimal amount = charge(rates[t], parkedMin);
                boolean auto = rnd.nextBoolean();

                User owner = allDrivers.get(rnd.nextInt(allDrivers.size()));

                ParkingSession s = new ParkingSession(slot, types[t], plate(rnd), auto);
                s.setUser(owner);
                s.setCheckInAt(checkIn);
                s.setCheckOutAt(checkOut);
                s.setAmountCharged(amount);
                s.setStatus(SessionStatus.COMPLETED);
                sessions.save(s);

                Payment p = new Payment(s, amount);
                p.setMethod(methods[rnd.nextInt(methods.length)]);
                p.setStatus(PaymentStatus.PAID);
                p.setCreatedAt(checkOut);
                p.setPaidAt(checkOut);
                payments.save(p);
                completed.add(s);
            }
        }

        // A few VOIDED payments in history (refunds / staff corrections)
        for (int i = 0; i < 4; i++) {
            ParkingSession src = completed.get(rnd.nextInt(completed.size()));
            int t = rnd.nextInt(types.length);
            ParkingSlot slot = allSlots.get(rnd.nextInt(allSlots.size()));
            Instant checkIn = Instant.now().minus(Duration.ofDays(3 + i)).minus(Duration.ofHours(2));
            Instant checkOut = checkIn.plus(Duration.ofHours(1));
            BigDecimal amount = charge(rates[t], 60);

            ParkingSession vs = new ParkingSession(slot, types[t], plate(rnd), true);
            vs.setUser(allDrivers.get(rnd.nextInt(allDrivers.size())));
            vs.setCheckInAt(checkIn);
            vs.setCheckOutAt(checkOut);
            vs.setAmountCharged(amount);
            vs.setStatus(SessionStatus.COMPLETED);
            sessions.save(vs);

            Payment vp = new Payment(vs, amount);
            vp.setMethod(PaymentMethod.CASH);
            vp.setStatus(PaymentStatus.VOIDED);
            vp.setCreatedAt(checkOut);
            vp.setVoidedAt(checkOut.plus(Duration.ofMinutes(10)));
            vp.setVoidReason(i % 2 == 0 ? "Duplicate charge corrected" : "Customer complaint — staff override");
            payments.save(vp);
        }

        log.info("Seeded {} historical sessions ({} days) + 4 voided payments.", completed.size(), HISTORY_DAYS);
        return completed;
    }

    private void seedLiveDriverSession(VehicleTypeResponse[] vt, User driver) {
        VehicleType car = vehicleTypes.findById(vt[0].id()).orElseThrow();
        List<ParkingSlot> available = slots.findAll().stream()
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE)
                .toList();

        // Live session with AI score (45 min, car)
        ParkingSlot slot1 = available.get(0);
        Instant checkIn = Instant.now().minus(Duration.ofMinutes(45));
        ParkingSession s = new ParkingSession(slot1, car, "51F-00777", true);
        s.setUser(driver);
        s.setCheckInAt(checkIn);
        s.setAllocationScore(ALLOC_SCORES[0]);
        sessions.save(s);
        slot1.setStatus(SlotStatus.OCCUPIED);
        slots.save(slot1);

        // Billable demo session (3h, EV — highest rate 15k/hr ≈ 45k charge)
        VehicleType ev = vehicleTypes.findById(vt[2].id()).orElseThrow();
        ParkingSlot slot2 = available.get(1);
        ParkingSession demo = new ParkingSession(slot2, ev, "30K-99999", true);
        demo.setUser(driver);
        demo.setCheckInAt(Instant.now().minus(Duration.ofHours(3)));
        demo.setAllocationScore(ALLOC_SCORES[1]);
        sessions.save(demo);
        slot2.setStatus(SlotStatus.OCCUPIED);
        slots.save(slot2);

        // Active session from FREE reservation (10% off demo)
        ParkingSlot slot3 = available.get(2);
        ParkingSession resSess = new ParkingSession(slot3, car, "51A-888.88", true);
        resSess.setUser(driver);
        resSess.setCheckInAt(Instant.now().minus(Duration.ofMinutes(90)));
        resSess.setFromReservation(true);
        resSess.setAllocationScore(ALLOC_SCORES[0]);
        sessions.save(resSess);
        slot3.setStatus(SlotStatus.OCCUPIED);
        slots.save(slot3);

        // Active session from PAID reservation (deposit credited demo)
        ParkingSlot slot4 = available.get(3);
        ParkingSession paidSess = new ParkingSession(slot4, car, "51A-777.77", true);
        paidSess.setUser(driver);
        paidSess.setCheckInAt(Instant.now().minus(Duration.ofMinutes(60)));
        paidSess.setFromReservation(true);
        paidSess.setDepositCredit(new BigDecimal("5000"));
        paidSess.setAllocationScore(ALLOC_SCORES[1]);
        sessions.save(paidSess);
        slot4.setStatus(SlotStatus.OCCUPIED);
        slots.save(slot4);

        // AWAITING_PAYMENT session (shows "Pay now" on dashboard)
        ParkingSlot slot5 = available.get(4);
        ParkingSession awaitPay = new ParkingSession(slot5, car, "51A-666.66", true);
        awaitPay.setUser(driver);
        awaitPay.setCheckInAt(Instant.now().minus(Duration.ofHours(2)));
        awaitPay.setCheckOutAt(Instant.now().minus(Duration.ofMinutes(5)));
        awaitPay.setAmountCharged(new BigDecimal("10000"));
        awaitPay.setStatus(SessionStatus.AWAITING_PAYMENT);
        awaitPay.setAllocationScore(ALLOC_SCORES[0]);
        sessions.save(awaitPay);
        Payment awaitPayment = new Payment(awaitPay, new BigDecimal("10000"));
        payments.save(awaitPayment);

        // Completed session from FREE reservation (shows "10% off applied" in history)
        ParkingSlot slot6 = available.get(5);
        ParkingSession freeCompleted = new ParkingSession(slot6, car, "51A-555.55", true);
        freeCompleted.setUser(driver);
        freeCompleted.setCheckInAt(Instant.now().minus(Duration.ofHours(5)));
        freeCompleted.setCheckOutAt(Instant.now().minus(Duration.ofHours(3)));
        freeCompleted.setFromReservation(true);
        freeCompleted.setAmountCharged(new BigDecimal("9000"));
        freeCompleted.setStatus(SessionStatus.COMPLETED);
        sessions.save(freeCompleted);
        slot6.setStatus(SlotStatus.AVAILABLE);
        Payment freePay = new Payment(freeCompleted, new BigDecimal("9000"));
        freePay.setStatus(PaymentStatus.PAID);
        freePay.setPaidAt(Instant.now().minus(Duration.ofHours(3)));
        freePay.setMethod(PaymentMethod.VNPAY);
        payments.save(freePay);

        // Completed session from PAID reservation (shows "Deposit credited" in history)
        ParkingSlot slot7 = available.get(6);
        ParkingSession paidCompleted = new ParkingSession(slot7, car, "51A-444.44", true);
        paidCompleted.setUser(driver);
        paidCompleted.setCheckInAt(Instant.now().minus(Duration.ofHours(6)));
        paidCompleted.setCheckOutAt(Instant.now().minus(Duration.ofHours(4)));
        paidCompleted.setFromReservation(true);
        paidCompleted.setDepositCredit(new BigDecimal("5000"));
        paidCompleted.setAmountCharged(new BigDecimal("5000"));
        paidCompleted.setStatus(SessionStatus.COMPLETED);
        sessions.save(paidCompleted);
        slot7.setStatus(SlotStatus.AVAILABLE);
        Payment paidPay = new Payment(paidCompleted, new BigDecimal("5000"));
        paidPay.setStatus(PaymentStatus.PAID);
        paidPay.setPaidAt(Instant.now().minus(Duration.ofHours(4)));
        paidPay.setMethod(PaymentMethod.VNPAY);
        payments.save(paidPay);

        log.info("Seeded 7 driver sessions: walk-in×2, free-res active, paid-res active, awaiting payment, free-res completed, paid-res completed.");
    }

    private void seedLiveSessions(VehicleTypeResponse[] vt, List<User> extraDrivers) {
        VehicleType[] types = {
            vehicleTypes.findById(vt[0].id()).orElseThrow(),
            vehicleTypes.findById(vt[1].id()).orElseThrow(),
            vehicleTypes.findById(vt[2].id()).orElseThrow(),
        };
        List<ParkingSlot> available = slots.findAll().stream()
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE)
                .toList();

        int count = Math.min(3, Math.min(available.size(), extraDrivers.size()));
        for (int i = 0; i < count; i++) {
            ParkingSlot slot = available.get(i);
            VehicleType type = types[i % types.length];
            User drv = extraDrivers.get(i);
            Instant checkIn = Instant.now().minus(Duration.ofMinutes(20 + i * 30));

            ParkingSession s = new ParkingSession(slot, type, DRIVER_PLATES[i], true);
            s.setUser(drv);
            s.setCheckInAt(checkIn);
            s.setAllocationScore(ALLOC_SCORES[i % ALLOC_SCORES.length]);
            sessions.save(s);

            slot.setStatus(SlotStatus.OCCUPIED);
            slots.save(slot);
        }
        log.info("Seeded {} extra live sessions.", count);
    }

    private void seedReservation(VehicleTypeResponse[] vt, User driver) {
        VehicleType carType = vehicleTypes.findById(vt[0].id()).orElseThrow();
        ParkingBuilding building = buildings.findAll().get(0);
        List<ParkingSlot> avail = slots.findAll().stream()
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE
                        && s.getFloor().getVehicleType() != null
                        && s.getFloor().getVehicleType().getId().equals(carType.getId()))
                .toList();

        // PAID reservation with deposit
        ParkingSlot paidSlot = avail.get(0);
        paidSlot.setStatus(SlotStatus.RESERVED);
        slots.save(paidSlot);
        Payment deposit = new Payment(new BigDecimal("5000"));
        deposit.setMethod(PaymentMethod.VNPAY);
        deposit.setStatus(PaymentStatus.PAID);
        deposit.setPaidAt(Instant.now());
        deposit.setDescription("Reservation deposit · 51A-999.99 · " + paidSlot.getCode());
        payments.save(deposit);
        Instant paidArrival = Instant.now().plus(Duration.ofHours(1));
        Reservation paid = new Reservation(driver, paidSlot, carType, "51A-999.99",
                paidArrival.plus(Duration.ofMinutes(30)));
        paid.setReservationType(ReservationType.PAID);
        paid.setReservedStart(paidArrival);
        paid.setBuilding(building);
        paid.setDepositAmount(new BigDecimal("5000"));
        paid.setDepositPayment(deposit);
        reservations.save(paid);

        // FREE reservation
        Reservation free = new Reservation(driver, null, carType, "51A-888.88",
                Instant.now().plus(Duration.ofHours(2)));
        free.setReservationType(ReservationType.FREE);
        free.setReservedStart(Instant.now().plus(Duration.ofHours(1).plusMinutes(30)));
        free.setBuilding(building);
        reservations.save(free);

        log.info("Seeded PAID reservation (slot {}) + FREE reservation for driver.", paidSlot.getCode());
    }

    private void seedExtraReservations(VehicleTypeResponse[] vt, List<User> extraDrivers) {
        VehicleType carType = vehicleTypes.findById(vt[0].id()).orElseThrow();
        VehicleType bikeType = vehicleTypes.findById(vt[1].id()).orElseThrow();
        ParkingBuilding building = buildings.findAll().get(0);
        List<ParkingSlot> available = slots.findAll().stream()
                .filter(s -> s.getStatus() == SlotStatus.AVAILABLE)
                .toList();

        // FULFILLED paid reservation (arrived yesterday)
        if (available.size() > 0 && extraDrivers.size() > 0) {
            Reservation r1 = new Reservation(extraDrivers.get(0), available.get(0), carType,
                    DRIVER_PLATES[0], Instant.now().minus(Duration.ofDays(1)));
            r1.setStatus(ReservationStatus.FULFILLED);
            r1.setReservationType(ReservationType.PAID);
            r1.setReservedStart(Instant.now().minus(Duration.ofDays(1).minusHours(1)));
            r1.setBuilding(building);
            r1.setDepositAmount(new BigDecimal("5000"));
            reservations.save(r1);
        }

        // CANCELLED free reservation
        if (available.size() > 1 && extraDrivers.size() > 1) {
            Reservation r2 = new Reservation(extraDrivers.get(1), null, bikeType,
                    DRIVER_PLATES[1], Instant.now().minus(Duration.ofHours(5)));
            r2.setStatus(ReservationStatus.CANCELLED);
            r2.setReservationType(ReservationType.FREE);
            r2.setReservedStart(Instant.now().minus(Duration.ofHours(6)));
            r2.setBuilding(building);
            reservations.save(r2);
        }

        // EXPIRED paid reservation (no-show, deposit forfeit)
        if (available.size() > 2 && extraDrivers.size() > 2) {
            Reservation r3 = new Reservation(extraDrivers.get(2), available.get(2), carType,
                    DRIVER_PLATES[2], Instant.now().minus(Duration.ofHours(2)));
            r3.setStatus(ReservationStatus.EXPIRED);
            r3.setReservationType(ReservationType.PAID);
            r3.setReservedStart(Instant.now().minus(Duration.ofHours(3)));
            r3.setBuilding(building);
            r3.setDepositAmount(new BigDecimal("5000"));
            reservations.save(r3);
        }

        // PENDING free reservation (upcoming)
        if (available.size() > 3 && extraDrivers.size() > 3) {
            Reservation r4 = new Reservation(extraDrivers.get(3), null, bikeType,
                    DRIVER_PLATES[3], Instant.now().plus(Duration.ofHours(1)));
            r4.setReservationType(ReservationType.FREE);
            r4.setReservedStart(Instant.now().plus(Duration.ofMinutes(45)));
            r4.setBuilding(building);
            reservations.save(r4);
        }

        log.info("Seeded extra reservations (FULFILLED, CANCELLED, EXPIRED, PENDING).");
    }

    private void seedMonthlyPass(VehicleTypeResponse[] vt, User driver) {
        VehicleType motoType = vehicleTypes.findById(vt[1].id()).orElseThrow();

        Payment payment = new Payment(new BigDecimal("100000"));
        payment.setMethod(PaymentMethod.ONLINE);
        payment.setStatus(PaymentStatus.PAID);
        payment.setDescription("Monthly pass · 59C-678.90 · " + motoType.getName());
        payment.setPaidAt(Instant.now().minus(Duration.ofDays(5)));
        payments.save(payment);

        MonthlyPass pass = new MonthlyPass(driver, motoType, "59C-123.45",
                LocalDate.now().minusDays(5), LocalDate.now().plusDays(25));
        pass.setStatus(PassStatus.ACTIVE);
        pass.setPayment(payment);
        passes.save(pass);
        log.info("Monthly pass seeded for driver (plate {})", pass.getLicensePlate());

        VehicleType carType = vehicleTypes.findById(vt[0].id()).orElseThrow();
        Payment carPayment = new Payment(new BigDecimal("200000"));
        carPayment.setMethod(PaymentMethod.CASH);
        carPayment.setStatus(PaymentStatus.PAID);
        carPayment.setPaidAt(Instant.now().minus(Duration.ofDays(2)));
        payments.save(carPayment);

        MonthlyPass carPass = new MonthlyPass(driver, carType, "51F-00777",
                LocalDate.now().minusDays(2), LocalDate.now().plusDays(28));
        carPass.setStatus(PassStatus.ACTIVE);
        carPass.setPayment(carPayment);
        passes.save(carPass);
        log.info("Monthly pass seeded for driver (plate {})", carPass.getLicensePlate());
    }

    private void seedExtraPasses(VehicleTypeResponse[] vt, List<User> extraDrivers) {
        VehicleType carType = vehicleTypes.findById(vt[0].id()).orElseThrow();
        VehicleType bikeType = vehicleTypes.findById(vt[1].id()).orElseThrow();

        // EXPIRED pass (last month)
        if (extraDrivers.size() > 0) {
            Payment p1 = new Payment(new BigDecimal("200000"));
            p1.setMethod(PaymentMethod.VNPAY);
            p1.setStatus(PaymentStatus.PAID);
            p1.setPaidAt(Instant.now().minus(Duration.ofDays(40)));
            payments.save(p1);

            MonthlyPass exp = new MonthlyPass(extraDrivers.get(0), carType, DRIVER_PLATES[0],
                    LocalDate.now().minusDays(35), LocalDate.now().minusDays(5));
            exp.setStatus(PassStatus.EXPIRED);
            exp.setPayment(p1);
            passes.save(exp);
        }

        // ACTIVE pass (car)
        if (extraDrivers.size() > 1) {
            Payment p2 = new Payment(new BigDecimal("200000"));
            p2.setMethod(PaymentMethod.CASH);
            p2.setStatus(PaymentStatus.PAID);
            p2.setPaidAt(Instant.now().minus(Duration.ofDays(10)));
            payments.save(p2);

            MonthlyPass active = new MonthlyPass(extraDrivers.get(1), carType, DRIVER_PLATES[1],
                    LocalDate.now().minusDays(10), LocalDate.now().plusDays(20));
            active.setStatus(PassStatus.ACTIVE);
            active.setPayment(p2);
            passes.save(active);
        }

        // PENDING pass (just purchased, awaiting activation)
        if (extraDrivers.size() > 2) {
            Payment p3 = new Payment(new BigDecimal("100000"));
            p3.setMethod(PaymentMethod.ONLINE);
            p3.setStatus(PaymentStatus.PENDING);
            payments.save(p3);

            MonthlyPass pending = new MonthlyPass(extraDrivers.get(2), bikeType, DRIVER_PLATES[2],
                    LocalDate.now(), LocalDate.now().plusDays(30));
            pending.setStatus(PassStatus.PENDING);
            pending.setPayment(p3);
            passes.save(pending);
        }

        log.info("Seeded extra passes (EXPIRED, ACTIVE, PENDING).");
    }

    private void seedExceptionReports(List<ParkingSession> completedSessions, List<User> allDrivers) {
        User staff = users.findByEmail("staff@parkmaster.dev").orElseThrow();
        Random rnd = new Random(99);

        // LOST_TICKET — RESOLVED
        ExceptionReport e1 = new ExceptionReport(staff, ExceptionType.LOST_TICKET,
                "Driver lost paper ticket. Verified entry via CCTV at 08:15. Plate: 51F-123.45.",
                completedSessions.get(0));
        e1.setStatus(ExceptionStatus.RESOLVED);
        e1.setResolutionNote("Confirmed via CCTV. Charged standard rate + lost ticket penalty.");
        e1.setResolvedAt(Instant.now().minus(Duration.ofDays(3)));
        exceptions.save(e1);

        // WRONG_PLATE — RESOLVED
        ExceptionReport e2 = new ExceptionReport(staff, ExceptionType.WRONG_PLATE,
                "Plate mismatch at exit: entry 51G-111.22, exit scan reads 51G-111.23. Likely OCR error.",
                completedSessions.get(1));
        e2.setStatus(ExceptionStatus.RESOLVED);
        e2.setResolutionNote("Manual override. OCR misread '2' as '3'. Visual match confirmed.");
        e2.setResolvedAt(Instant.now().minus(Duration.ofDays(2)));
        exceptions.save(e2);

        // OVERTIME — OPEN
        ExceptionReport e3 = new ExceptionReport(staff, ExceptionType.OVERTIME,
                "Vehicle parked 26 hours (overnight). Driver claims forgot to pick up. Plate: 30A-333.44.",
                completedSessions.get(rnd.nextInt(completedSessions.size())));
        exceptions.save(e3);

        // WRONG_ZONE — OPEN
        ExceptionReport e4 = new ExceptionReport(staff, ExceptionType.WRONG_ZONE,
                "Motorbike parked in slot A-05 on Level 1 (preferred for Cars). AI suggested Level 2 but driver chose manually.",
                completedSessions.get(rnd.nextInt(completedSessions.size())));
        exceptions.save(e4);

        // LOST_TICKET — OPEN
        ExceptionReport e5 = new ExceptionReport(staff, ExceptionType.LOST_TICKET,
                "Driver cannot find QR ticket. Vehicle still in slot B-12. Plate: 51H-555.66.",
                completedSessions.get(rnd.nextInt(completedSessions.size())));
        exceptions.save(e5);

        // OVERTIME — RESOLVED
        ExceptionReport e6 = new ExceptionReport(staff, ExceptionType.OVERTIME,
                "Vehicle overstayed by 8 hours. Driver paid penalty at booth.",
                completedSessions.get(rnd.nextInt(completedSessions.size())));
        e6.setStatus(ExceptionStatus.RESOLVED);
        e6.setResolutionNote("Penalty of 50,000 VND collected. Session closed.");
        e6.setResolvedAt(Instant.now().minus(Duration.ofDays(1)));
        exceptions.save(e6);

        log.info("Seeded 6 exception reports (3 OPEN, 3 RESOLVED).");
    }

    private void seedFeedback(List<ParkingSession> completedSessions, List<User> allDrivers) {
        Random rnd = new Random(77);
        short[] ratings = {5, 4, 3, 5, 2, 5, 4, 5, 3, 4, 4, 5};
        int count = Math.min(FEEDBACK_COMMENTS.length, completedSessions.size());

        for (int i = 0; i < count; i++) {
            ParkingSession session = completedSessions.get(i * (completedSessions.size() / count));
            User reviewer = session.getUser() != null
                    ? session.getUser()
                    : allDrivers.get(rnd.nextInt(allDrivers.size()));
            Feedback fb = new Feedback(session, reviewer, ratings[i], FEEDBACK_COMMENTS[i]);
            feedbacks.save(fb);
        }
        log.info("Seeded {} feedback entries.", count);
    }

    private static BigDecimal charge(BigDecimal ratePerHour, long parkedMin) {
        long billedHours = Math.max(1, (long) Math.ceil(parkedMin / 60.0));
        return ratePerHour.multiply(BigDecimal.valueOf(billedHours));
    }

    private static String plate(Random rnd) {
        char letter = (char) ('A' + rnd.nextInt(26));
        return String.format("51%c-%05d", letter, rnd.nextInt(100000));
    }
}
