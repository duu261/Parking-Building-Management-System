package com.parkmaster.user;

import com.parkmaster.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver/profile")
class DriverProfileController {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    DriverProfileController(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    ProfileResponse me(Authentication auth) {
        User user = findUser(auth);
        return new ProfileResponse(user.getId(), user.getEmail(), user.getFullName(),
                user.getRole(), user.getCreatedAt());
    }

    @PutMapping
    ProfileResponse update(@Valid @RequestBody UpdateProfileRequest req, Authentication auth) {
        User user = findUser(auth);
        user.setFullName(req.fullName());
        users.save(user);
        return new ProfileResponse(user.getId(), user.getEmail(), user.getFullName(),
                user.getRole(), user.getCreatedAt());
    }

    @PostMapping("/change-password")
    MessageResponse changePassword(@Valid @RequestBody ChangePasswordRequest req, Authentication auth) {
        User user = findUser(auth);
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        users.save(user);
        return new MessageResponse("Password changed successfully");
    }

    private User findUser(Authentication auth) {
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    record ProfileResponse(Long id, String email, String fullName, Role role, Instant createdAt) {}
    record UpdateProfileRequest(@NotBlank @Size(max = 120) String fullName) {}
    record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 100) String newPassword) {}
    record MessageResponse(String message) {}
}
