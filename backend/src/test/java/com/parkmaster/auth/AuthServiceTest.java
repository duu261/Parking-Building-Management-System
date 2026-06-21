package com.parkmaster.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.parkmaster.auth.AuthDtos.LoginRequest;
import com.parkmaster.auth.AuthDtos.RegisterRequest;
import com.parkmaster.common.ApiException;
import com.parkmaster.security.JwtService;
import com.parkmaster.user.Role;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Smoke test for the auth slice — no Spring context, plain in-memory fake repo. */
class AuthServiceTest {

    private AuthService authService;
    private Map<String, User> store;

    @BeforeEach
    void setUp() {
        store = new HashMap<>();
        UserRepository repo = fakeRepo(store);
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        // Valid 256-bit base64 secret for tests.
        JwtService jwt = new JwtService(
                "ZGV2LW9ubHktc2VjcmV0LWNoYW5nZS1tZS1pbi1wcm9kdWN0aW9uLTI1Ni1iaXQ=", 60);
        authService = new AuthService(repo, encoder, jwt, null);
    }

    @Test
    void registerThenLoginReturnsToken() {
        var reg = authService.register(new RegisterRequest("a@b.com", "password123", "Alice"));
        assertThat(reg.role()).isEqualTo(Role.USER);
        assertThat(reg.accessToken()).isNotBlank();

        var login = authService.login(new LoginRequest("a@b.com", "password123"));
        assertThat(login.email()).isEqualTo("a@b.com");
        assertThat(login.accessToken()).isNotBlank();
    }

    @Test
    void duplicateEmailRejected() {
        authService.register(new RegisterRequest("a@b.com", "password123", "Alice"));
        assertThatThrownBy(() -> authService.register(new RegisterRequest("a@b.com", "password123", "Bob")))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void wrongPasswordRejected() {
        authService.register(new RegisterRequest("a@b.com", "password123", "Alice"));
        assertThatThrownBy(() -> authService.login(new LoginRequest("a@b.com", "wrongpass")))
                .isInstanceOf(ApiException.class);
    }

    /** Minimal UserRepository fake — only the methods AuthService uses. */
    private static UserRepository fakeRepo(Map<String, User> store) {
        return (UserRepository) java.lang.reflect.Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class[] {UserRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "existsByEmail" -> store.containsKey((String) args[0]);
                    case "findByEmail" -> Optional.ofNullable(store.get((String) args[0]));
                    case "save" -> {
                        User u = (User) args[0];
                        setId(u);
                        store.put(u.getEmail(), u);
                        yield u;
                    }
                    default -> throw new UnsupportedOperationException(method.getName());
                });
    }

    private static void setId(User u) throws Exception {
        if (u.getId() == null) {
            var f = User.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(u, (long) (1));
        }
    }
}
