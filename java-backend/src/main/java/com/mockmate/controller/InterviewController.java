package com.mockmate.controller;

import com.mockmate.dto.request.CreateInterviewRequest;
import com.mockmate.dto.request.SubmitAnswerRequest;
import com.mockmate.dto.response.InterviewResponse;
import com.mockmate.dto.response.QuestionResponse;
import com.mockmate.entity.User;
import com.mockmate.repository.UserRepository;
import com.mockmate.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<InterviewResponse> createInterview(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateInterviewRequest req) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(interviewService.createInterview(user, req));
    }

    @GetMapping
    public ResponseEntity<List<InterviewResponse>> getMyInterviews(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(interviewService.getUserInterviews(user));
    }

    @GetMapping("/{token}")
    public ResponseEntity<InterviewResponse> getInterview(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String token) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(interviewService.getInterviewByToken(token, user));
    }

    @PostMapping("/{token}/start")
    public ResponseEntity<InterviewResponse> startInterview(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String token) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(interviewService.startInterview(token, user));
    }

    @PostMapping("/{token}/answer")
    public ResponseEntity<QuestionResponse> submitAnswer(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String token,
            @Valid @RequestBody SubmitAnswerRequest req) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(interviewService.submitAnswer(token, user, req));
    }

    @PostMapping("/{token}/complete")
    public ResponseEntity<InterviewResponse> completeInterview(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String token) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(interviewService.completeInterview(token, user));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
