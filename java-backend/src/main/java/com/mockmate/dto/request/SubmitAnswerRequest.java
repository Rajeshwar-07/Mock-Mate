package com.mockmate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitAnswerRequest {
    @NotNull
    private Long questionId;
    @NotBlank(message = "Answer cannot be empty")
    private String answerText;
}
