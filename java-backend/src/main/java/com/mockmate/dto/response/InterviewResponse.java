package com.mockmate.dto.response;

import com.mockmate.entity.Interview;
import com.mockmate.entity.User;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InterviewResponse {
    private Long id;
    private String token;
    private Integer roundNumber;
    private Interview.InterviewType interviewType;
    private User.ExperienceLevel experienceLevel;
    private List<String> technologies;
    private Interview.InterviewStatus status;
    private LocalDateTime scheduledAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private List<QuestionResponse> questions;
    private ScoreResponse score;
    private String interviewLink;
}
