package com.mockmate.dto.response;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ScoreResponse {
    private Double overallScore;
    private Boolean passed;
    private String technicalFeedback;
    private List<String> strengths;
    private List<String> improvements;
    private String recommendation;
}
