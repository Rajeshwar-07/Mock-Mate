package com.mockmate.dto.response;

import com.mockmate.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String token;
    private String name;
    private String email;
    private User.ExperienceLevel experienceLevel;
    private String targetRole;
    private boolean hasResume;
}
