package com.parkmaster.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class AdminUserDtos {

    private AdminUserDtos() {}

    public record CreateUserRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank @Size(max = 120) String fullName,
            @NotNull Role role) {}

    public record UpdateRoleRequest(@NotNull Role role) {}

    public record UpdateActiveRequest(boolean active) {}

    public record UserSummary(Long id, String email, String fullName, Role role, boolean active,
            Instant createdAt) {
        static UserSummary from(User u) {
            return new UserSummary(u.getId(), u.getEmail(), u.getFullName(), u.getRole(),
                    u.isActive(), u.getCreatedAt());
        }
    }
}
