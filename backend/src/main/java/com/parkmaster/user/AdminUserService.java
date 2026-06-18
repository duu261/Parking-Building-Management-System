package com.parkmaster.user;

import com.parkmaster.common.ApiException;
import com.parkmaster.user.AdminUserDtos.CreateUserRequest;
import com.parkmaster.user.AdminUserDtos.UserSummary;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserSummary> list() {
        return users.findAll().stream().map(UserSummary::from).toList();
    }

    @Transactional
    public UserSummary create(CreateUserRequest req) {
        if (users.existsByEmail(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }
        User user = new User(req.email(), passwordEncoder.encode(req.password()), req.fullName(),
                req.role());
        return UserSummary.from(users.save(user));
    }

    @Transactional
    public UserSummary changeRole(Long id, Role role) {
        User user = find(id);
        user.setRole(role);
        return UserSummary.from(user);
    }

    // ponytail: no self-lockout guard — an admin can demote/deactivate themselves.
    // Add a principal check here if that footgun bites during the demo.
    @Transactional
    public UserSummary setActive(Long id, boolean active) {
        User user = find(id);
        user.setActive(active);
        return UserSummary.from(user);
    }

    private User find(Long id) {
        return users.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
