package com.mockmate.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockmate.entity.Interview;
import com.mockmate.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiClientService {

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    /** Generate interview questions from Python AI service */
    public Map<String, Object> generateQuestions(Interview interview, List<String> technologies, String resumeText) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("interview_id", interview.getId().toString());
            body.put("technologies", technologies);
            body.put("experience_level", interview.getExperienceLevel().name());
            body.put("interview_type", interview.getInterviewType().name());
            body.put("round_number", interview.getRoundNumber());
            if (resumeText != null && !resumeText.isBlank()) {
                body.put("resume_text", resumeText);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/ai/generate-questions", entity, Map.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling AI service for question generation", e);
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
    }

    /** Evaluate a single answer */
    public Map<String, Object> evaluateAnswer(String question, String answer,
                                               String technology, String experienceLevel,
                                               List<String> expectedKeywords) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("question", question);
            body.put("answer", answer);
            body.put("technology", technology);
            body.put("experience_level", experienceLevel);
            body.put("expected_keywords", expectedKeywords);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/ai/evaluate-answer", entity, Map.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling AI service for answer evaluation", e);
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
    }

    /** Generate interview summary */
    public Map<String, Object> generateSummary(Long interviewId, List<String> questions,
                                                List<String> answers, List<Integer> scores,
                                                List<String> technologies, String experienceLevel) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("interview_id", interviewId.toString());
            body.put("questions", questions);
            body.put("answers", answers);
            body.put("scores", scores);
            body.put("technologies", technologies);
            body.put("experience_level", experienceLevel);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/ai/interview-summary", entity, Map.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling AI service for summary", e);
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
    }

    /** Extract text from resume file via Python service */
    public String extractResumeText(MultipartFile file) {
        try {
            MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override public String getFilename() { return file.getOriginalFilename(); }
            };
            formData.add("file", resource);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(formData, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/ai/extract-resume-text", entity, Map.class);

            return (String) Objects.requireNonNull(response.getBody()).get("text");
        } catch (Exception e) {
            log.error("Error extracting resume text", e);
            return "";
        }
    }
}
