package com.mockmate.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ResumeResponse {
    private Long id;
    private String fileName;
    private String fileUrl;
    private List<String> parsedSkills;
    private Float experienceYears;
    private LocalDateTime uploadedAt;
}
