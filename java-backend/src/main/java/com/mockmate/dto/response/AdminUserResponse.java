package com.mockmate.dto.response;

import com.mockmate.entity.User;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String name;
    private String email;
    private User.ExperienceLevel experienceLevel;
    private String targetRole;
    private LocalDateTime createdAt;
    private int interviewCount;
}
