package com.parkmaster.pass;

import com.parkmaster.pass.PassDtos.IssueRequest;
import com.parkmaster.pass.PassDtos.PassResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager/passes")
class ManagerPassController {

    private final MonthlyPassService passes;

    ManagerPassController(MonthlyPassService passes) {
        this.passes = passes;
    }

    @PostMapping
    ResponseEntity<PassResponse> issue(@Valid @RequestBody IssueRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(passes.issueByManager(req));
    }

    @GetMapping
    List<PassResponse> list() {
        return passes.list();
    }

    @GetMapping("/{id}")
    PassResponse get(@PathVariable Long id) {
        return passes.get(id);
    }

    @DeleteMapping("/{id}")
    PassResponse revoke(@PathVariable Long id) {
        return passes.revoke(id);
    }

    @PatchMapping("/{id}/activate")
    PassResponse activate(@PathVariable Long id) {
        return passes.activateById(id);
    }
}
