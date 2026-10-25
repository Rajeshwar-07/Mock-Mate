package com.mockmate.dto.request;

import com.mockmate.entity.User;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Valid email required")
    @NotBlank(message = "Email is required")
    private String email;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private User.ExperienceLevel experienceLevel;
    private String targetRole;
}
