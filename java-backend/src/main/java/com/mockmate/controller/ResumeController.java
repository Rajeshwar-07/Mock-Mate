package com.mockmate.controller;

import com.mockmate.dto.response.ResumeResponse;
import com.mockmate.entity.User;
import com.mockmate.repository.UserRepository;
import com.mockmate.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final UserRepository userRepository;

    @PostMapping("/upload")
    public ResponseEntity<ResumeResponse> uploadResume(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(resumeService.uploadResume(user, file));
    }

    @GetMapping
    public ResponseEntity<ResumeResponse> getResume(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(resumeService.getResume(user));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteResume(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        resumeService.deleteResume(user);
        return ResponseEntity.ok(Map.of("message", "Resume deleted successfully"));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
