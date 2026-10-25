package com.mockmate.service;

import com.mockmate.dto.request.LoginRequest;
import com.mockmate.dto.request.RegisterRequest;
import com.mockmate.dto.response.AuthResponse;
import com.mockmate.entity.User;
import com.mockmate.repository.ResumeRepository;
import com.mockmate.repository.UserRepository;
import com.mockmate.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .experienceLevel(req.getExperienceLevel())
                .targetRole(req.getTargetRole())
                .build();

        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .experienceLevel(user.getExperienceLevel())
                .targetRole(user.getTargetRole())
                .hasResume(false)
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail());
        boolean hasResume = resumeRepository.findByUser(user).isPresent();

        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .experienceLevel(user.getExperienceLevel())
                .targetRole(user.getTargetRole())
                .hasResume(hasResume)
                .build();
    }
}
