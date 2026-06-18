package com.parkmaster.user;

import com.parkmaster.user.AdminUserDtos.CreateUserRequest;
import com.parkmaster.user.AdminUserDtos.UpdateActiveRequest;
import com.parkmaster.user.AdminUserDtos.UpdateRoleRequest;
import com.parkmaster.user.AdminUserDtos.UserSummary;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
class AdminUserController {

    private final AdminUserService service;

    AdminUserController(AdminUserService service) {
        this.service = service;
    }

    @GetMapping
    List<UserSummary> list() {
        return service.list();
    }

    @PostMapping
    ResponseEntity<UserSummary> create(@Valid @RequestBody CreateUserRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PatchMapping("/{id}/role")
    UserSummary changeRole(@PathVariable Long id, @Valid @RequestBody UpdateRoleRequest req) {
        return service.changeRole(id, req.role());
    }

    @PatchMapping("/{id}/active")
    UserSummary setActive(@PathVariable Long id, @Valid @RequestBody UpdateActiveRequest req) {
        return service.setActive(id, req.active());
    }
}
