package com.mockmate.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockmate.dto.response.AdminInterviewResponse;
import com.mockmate.dto.response.AdminUserResponse;
import com.mockmate.dto.response.ScoreResponse;
import com.mockmate.entity.Interview;
import com.mockmate.entity.Score;
import com.mockmate.entity.User;
import com.mockmate.repository.InterviewRepository;
import com.mockmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final InterviewRepository interviewRepository;
    private final ObjectMapper objectMapper;

    private List<String> parseTech(String json) {
        try {
            if (json == null || json.isBlank()) return List.of();
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    // Simple check: first registered user (id=1) or email contains "admin"
    private boolean isAdmin(UserDetails ud) {
        User u = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        return u.getId() == 1 || u.getEmail().contains("admin");
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @AuthenticationPrincipal UserDetails ud) {
        if (!isAdmin(ud)) return ResponseEntity.status(403).build();

        long totalUsers = userRepository.count();
        long totalInterviews = interviewRepository.count();
        List<Interview> completed = interviewRepository.findAll().stream()
                .filter(i -> i.getStatus() == Interview.InterviewStatus.COMPLETED)
                .collect(Collectors.toList());
        double avgScore = completed.stream()
                .mapToDouble(i -> i.getScore() != null ? i.getScore().getOverallScore() : 0)
                .average().orElse(0);

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalInterviews", totalInterviews,
                "completedInterviews", completed.size(),
                "avgScore", Math.round(avgScore * 10.0) / 10.0
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers(
            @AuthenticationPrincipal UserDetails ud) {
        if (!isAdmin(ud)) return ResponseEntity.status(403).build();

        List<AdminUserResponse> users = userRepository.findAll().stream()
                .map(u -> AdminUserResponse.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .experienceLevel(u.getExperienceLevel())
                        .targetRole(u.getTargetRole())
                        .createdAt(u.getCreatedAt())
                        .interviewCount(u.getInterviews() != null ? u.getInterviews().size() : 0)
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

    @GetMapping("/interviews")
    public ResponseEntity<List<AdminInterviewResponse>> getAllInterviews(
            @AuthenticationPrincipal UserDetails ud) {
        if (!isAdmin(ud)) return ResponseEntity.status(403).build();

        List<AdminInterviewResponse> interviews = interviewRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(iv -> {
                    Score s = iv.getScore();
                    ScoreResponse scoreResp = s == null ? null : ScoreResponse.builder()
                            .overallScore(s.getOverallScore())
                            .passed(s.getPassed())
                            .build();
                    return AdminInterviewResponse.builder()
                            .id(iv.getId())
                            .token(iv.getToken())
                            .roundNumber(iv.getRoundNumber())
                            .interviewType(iv.getInterviewType())
                            .experienceLevel(iv.getExperienceLevel())
                            .technologies(parseTech(iv.getTechnologies()))
                            .status(iv.getStatus())
                            .createdAt(iv.getCreatedAt())
                            .userId(iv.getUser().getId())
                            .userEmail(iv.getUser().getEmail())
                            .score(scoreResp)
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(interviews);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {
        if (!isAdmin(ud)) return ResponseEntity.status(403).build();
        // Prevent deleting self
        User caller = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        if (caller.getId().equals(id)) return ResponseEntity.badRequest().build();
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/interviews/{id}")
    public ResponseEntity<Void> deleteInterview(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {
        if (!isAdmin(ud)) return ResponseEntity.status(403).build();
        interviewRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
