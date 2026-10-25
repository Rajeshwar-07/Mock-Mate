package com.mockmate.dto.response;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class QuestionResponse {
    private Long id;
    private Integer orderNumber;
    private String questionText;
    private String category;
    private String difficulty;
    private String answerText;
    private Integer aiScore;
    private String aiFeedback;
    private List<String> aiStrengths;
    private List<String> aiImprovements;
    private String idealAnswer;
}
