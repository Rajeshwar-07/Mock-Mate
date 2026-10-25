package com.mockmate.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "java-backend"));
    }

    @GetMapping("/api/health/ai")
    public ResponseEntity<Map<String, Object>> aiHealth() {
        try {
            ResponseEntity<Map> resp = restTemplate.getForEntity(aiServiceUrl + "/health", Map.class);
            return ResponseEntity.ok(Map.of("status", "ok", "ai", resp.getBody()));
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("status", "warming_up", "message", e.getMessage()));
        }
    }
}
