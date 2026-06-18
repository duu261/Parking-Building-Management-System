package com.parkmaster.exceptionreport;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExceptionReportRepository extends JpaRepository<ExceptionReport, Long> {

    List<ExceptionReport> findByStatusOrderByCreatedAt(ExceptionStatus status);
}
