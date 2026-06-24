package com.parkmaster.auth;

import com.parkmaster.auth.AuthDtos.AuthResponse;
import com.parkmaster.auth.AuthDtos.ForgotPasswordRequest;
import com.parkmaster.auth.AuthDtos.LoginRequest;
import com.parkmaster.auth.AuthDtos.RegisterRequest;
import com.parkmaster.auth.AuthDtos.ResetPasswordRequest;
import com.parkmaster.common.ApiException;
import com.parkmaster.security.JwtService;
import com.parkmaster.user.Role;
import com.parkmaster.user.User;
import com.parkmaster.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository resetTokens;
    private final String frontendOrigin;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder,
                       JwtService jwtService, PasswordResetTokenRepository resetTokens,
                       @org.springframework.beans.factory.annotation.Value("${FRONTEND_ORIGIN:http://localhost:5173}") String frontendOrigin) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.resetTokens = resetTokens;
        this.frontendOrigin = frontendOrigin;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (users.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }
        // ponytail: self-registration is always a driver (USER). Staff/manager/admin
        // are provisioned by an admin endpoint, add that when admin module lands.
        User user = new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.fullName(),
                Role.USER);
        users.save(user);
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmail(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return toResponse(user);
    }

    @Transactional
    public AuthDtos.ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        var user = users.findByEmail(request.email()).orElse(null);
        if (user == null) {
            return new AuthDtos.ForgotPasswordResponse(
                    "If an account exists with that email, a reset link has been sent.",
                    null, null);
        }
        String token = UUID.randomUUID().toString().replace("-", "");
        var resetToken = new PasswordResetToken(user, token, Instant.now().plus(30, ChronoUnit.MINUTES));
        resetTokens.save(resetToken);
        // ponytail: return token in response for demo; send via email in production
        String origin = frontendOrigin.contains(",") ? frontendOrigin.split(",")[0].trim() : frontendOrigin;
        String resetUrl = origin + "/reset-password?token=" + token;
        return new AuthDtos.ForgotPasswordResponse(
                "Password reset link generated.", token, resetUrl);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        var resetToken = resetTokens.findByToken(request.token())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token"));
        if (resetToken.isUsed() || resetToken.isExpired()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token");
        }
        resetToken.markUsed();
        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        users.save(user);
    }

    private AuthResponse toResponse(User user) {
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }
}
