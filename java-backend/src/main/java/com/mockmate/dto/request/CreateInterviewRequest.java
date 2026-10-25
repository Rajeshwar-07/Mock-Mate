package com.mockmate.dto.request;

import com.mockmate.entity.Interview;
import com.mockmate.entity.User;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class CreateInterviewRequest {
    @NotNull(message = "Experience level is required")
    private User.ExperienceLevel experienceLevel;

    @NotNull(message = "Interview type is required")
    private Interview.InterviewType interviewType;

    @NotEmpty(message = "At least one technology must be selected")
    private List<String> technologies;

    private Integer roundNumber = 1;
}
