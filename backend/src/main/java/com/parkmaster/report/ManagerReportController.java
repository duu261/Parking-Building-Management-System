package com.parkmaster.report;

import com.parkmaster.report.ReportDtos.AllocationComparison;
import com.parkmaster.report.ReportDtos.DailyRevenueReport;
import com.parkmaster.report.ReportDtos.DurationByTypeReport;
import com.parkmaster.report.ReportDtos.HourlyCheckInReport;
import com.parkmaster.report.ReportDtos.RevenueByTypeReport;
import java.time.Instant;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Chart-ready analytics for the manager dashboard. All windows are [from, to) in UTC. */
@RestController
@RequestMapping("/api/manager/reports")
class ManagerReportController {

    private final ReportService service;

    ManagerReportController(ReportService service) {
        this.service = service;
    }

    @GetMapping("/revenue-daily")
    DailyRevenueReport revenueDaily(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return service.revenueDaily(from, to);
    }

    @GetMapping("/revenue-by-vehicle-type")
    RevenueByTypeReport revenueByVehicleType(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return service.revenueByVehicleType(from, to);
    }

    @GetMapping("/check-ins-by-hour")
    HourlyCheckInReport checkInsByHour(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return service.checkInsByHour(from, to);
    }

    @GetMapping("/duration-by-vehicle-type")
    DurationByTypeReport durationByVehicleType(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return service.durationByVehicleType(from, to);
    }

    @GetMapping("/allocation-comparison")
    AllocationComparison allocationComparison(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return service.allocationComparison(from, to);
    }
}
