package com.mockmate.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockmate.dto.response.ResumeResponse;
import com.mockmate.entity.Resume;
import com.mockmate.entity.User;
import com.mockmate.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final AiClientService aiClientService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ResumeResponse uploadResume(User user, MultipartFile file) {
        // Validate file
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.toLowerCase().endsWith(".pdf")
                && !filename.toLowerCase().endsWith(".docx")
                && !filename.toLowerCase().endsWith(".doc"))) {
            throw new RuntimeException("Only PDF and DOCX files are supported");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("File size must be less than 5MB");
        }

        // Extract text via Python AI service
        String extractedText = aiClientService.extractResumeText(file);

        // Find or create resume record
        Resume resume = resumeRepository.findByUser(user)
                .orElse(Resume.builder().user(user).build());

        resume.setFileName(filename);
        resume.setExtractedText(extractedText);

        // Note: For production, upload to Cloudinary. For now store filename.
        resume.setFileUrl("/resumes/" + user.getId() + "/" + filename);

        resume = resumeRepository.save(resume);
        return buildResumeResponse(resume);
    }

    public ResumeResponse getResume(User user) {
        Resume resume = resumeRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("No resume uploaded yet"));
        return buildResumeResponse(resume);
    }

    public void deleteResume(User user) {
        Resume resume = resumeRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("No resume found"));
        resumeRepository.delete(resume);
    }

    private ResumeResponse buildResumeResponse(Resume r) {
        List<String> skills = List.of();
        if (r.getParsedSkills() != null && !r.getParsedSkills().isBlank()) {
            try {
                skills = objectMapper.readValue(r.getParsedSkills(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
            } catch (Exception ignored) {}
        }
        return ResumeResponse.builder()
                .id(r.getId())
                .fileName(r.getFileName())
                .fileUrl(r.getFileUrl())
                .parsedSkills(skills)
                .experienceYears(r.getExperienceYears())
                .uploadedAt(r.getUploadedAt())
                .build();
    }
}
