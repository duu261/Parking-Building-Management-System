package com.parkmaster.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.parkmaster.common.ApiException;
import com.parkmaster.user.AdminUserDtos.CreateUserRequest;
import com.parkmaster.user.AdminUserDtos.UserSummary;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Unit test for AdminUserService — repository + encoder mocked, no Spring context. */
class AdminUserServiceTest {

    private UserRepository users;
    private PasswordEncoder encoder;
    private AdminUserService service;

    @BeforeEach
    void setUp() {
        users = Mockito.mock(UserRepository.class);
        encoder = Mockito.mock(PasswordEncoder.class);
        when(users.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(encoder.encode(any())).thenReturn("hashed");
        service = new AdminUserService(users, encoder);
    }

    @Test
    void createProvisionsUserWithGivenRole() {
        when(users.existsByEmail("mgr@x.com")).thenReturn(false);

        UserSummary res = service.create(
                new CreateUserRequest("mgr@x.com", "password1", "Manager", Role.MANAGER));

        assertThat(res.role()).isEqualTo(Role.MANAGER);
        assertThat(res.active()).isTrue();
    }

    @Test
    void createDuplicateEmailFails() {
        when(users.existsByEmail("dup@x.com")).thenReturn(true);

        assertThatThrownBy(() -> service.create(
                new CreateUserRequest("dup@x.com", "password1", "Dup", Role.STAFF)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void changeRoleUpdatesRole() {
        User user = new User("u@x.com", "h", "U", Role.USER);
        when(users.findById(1L)).thenReturn(Optional.of(user));

        UserSummary res = service.changeRole(1L, Role.STAFF);

        assertThat(res.role()).isEqualTo(Role.STAFF);
    }

    @Test
    void setActiveTogglesFlag() {
        User user = new User("u@x.com", "h", "U", Role.USER);
        when(users.findById(1L)).thenReturn(Optional.of(user));

        UserSummary res = service.setActive(1L, false);

        assertThat(res.active()).isFalse();
    }

    @Test
    void changeRoleUnknownUserFails() {
        when(users.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.changeRole(9L, Role.ADMIN))
                .isInstanceOf(ApiException.class);
    }
}
