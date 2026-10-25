package com.mockmate.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mockmate.dto.request.CreateInterviewRequest;
import com.mockmate.dto.request.SubmitAnswerRequest;
import com.mockmate.dto.response.*;
import com.mockmate.entity.*;
import com.mockmate.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final QuestionRepository questionRepository;
    private final ScoreRepository scoreRepository;
    private final ResumeRepository resumeRepository;
    private final AiClientService aiClientService;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional
    public InterviewResponse createInterview(User user, CreateInterviewRequest req) {
        // Generate unique token for the interview link
        String token = UUID.randomUUID().toString();

        // Get resume text if available
        String resumeText = null;
        Optional<Resume> resumeOpt = resumeRepository.findByUser(user);
        if (resumeOpt.isPresent() && resumeOpt.get().getExtractedText() != null) {
            resumeText = resumeOpt.get().getExtractedText();
        }

        // Create interview record
        Interview interview = Interview.builder()
                .token(token)
                .user(user)
                .roundNumber(req.getRoundNumber())
                .interviewType(req.getInterviewType())
                .experienceLevel(req.getExperienceLevel())
                .technologies(toJson(req.getTechnologies()))
                .status(Interview.InterviewStatus.SCHEDULED)
                .scheduledAt(LocalDateTime.now().plusMinutes(5))
                .createdAt(LocalDateTime.now())
                .build();

        interview = interviewRepository.save(interview);

        // Generate questions from AI service
        Map<String, Object> aiResult = aiClientService.generateQuestions(interview, req.getTechnologies(), resumeText);
        List<Map<String, Object>> aiQuestions = (List<Map<String, Object>>) aiResult.get("questions");

        List<Question> questions = new ArrayList<>();
        for (Map<String, Object> q : aiQuestions) {
            List<String> keywords = (List<String>) q.getOrDefault("expected_keywords", List.of());
            Question question = Question.builder()
                    .interview(interview)
                    .orderNumber((Integer) q.get("order"))
                    .questionText((String) q.get("text"))
                    .category((String) q.get("category"))
                    .difficulty((String) q.get("difficulty"))
                    .expectedKeywords(toJson(keywords))
                    .build();
            questions.add(question);
        }
        questionRepository.saveAll(questions);

        // Send interview link via email (async)
        String interviewLink = frontendUrl + "/interview/" + token;
        emailService.sendInterviewLink(user.getEmail(), user.getName(), interviewLink,
                req.getRoundNumber(), req.getTechnologies());

        return buildInterviewResponse(interview, questions, null);
    }

    @Transactional
    public InterviewResponse startInterview(String token, User user) {
        Interview interview = interviewRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Interview not found"));

        if (!interview.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        if (interview.getStatus() == Interview.InterviewStatus.COMPLETED) {
            throw new RuntimeException("Interview already completed");
        }

        interview.setStatus(Interview.InterviewStatus.IN_PROGRESS);
        interview.setStartedAt(LocalDateTime.now());
        interview = interviewRepository.save(interview);

        List<Question> questions = questionRepository.findByInterviewOrderByOrderNumber(interview);
        return buildInterviewResponse(interview, questions, null);
    }

    @Transactional
    public QuestionResponse submitAnswer(String token, User user, SubmitAnswerRequest req) {
        Interview interview = interviewRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Interview not found"));

        if (!interview.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        Question question = questionRepository.findById(req.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Question not found"));

        // Get technologies for context
        List<String> technologies = fromJson(interview.getTechnologies());
        String primaryTech = technologies.isEmpty() ? "general" : technologies.get(0);

        // Evaluate answer via AI
        List<String> keywords = fromJson(question.getExpectedKeywords());
        Map<String, Object> evaluation = aiClientService.evaluateAnswer(
                question.getQuestionText(),
                req.getAnswerText(),
                primaryTech,
                interview.getExperienceLevel().name(),
                keywords
        );

        // Save answer and evaluation
        question.setAnswerText(req.getAnswerText());
        question.setAiScore((Integer) evaluation.get("score"));
        question.setAiFeedback((String) evaluation.get("feedback"));
        question.setAiStrengths(toJson((List<String>) evaluation.getOrDefault("strengths", List.of())));
        question.setAiImprovements(toJson((List<String>) evaluation.getOrDefault("improvements", List.of())));
        question = questionRepository.save(question);

        return buildQuestionResponse(question);
    }

    @Transactional
    public InterviewResponse completeInterview(String token, User user) {
        Interview interview = interviewRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Interview not found"));

        if (!interview.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        List<Question> questions = questionRepository.findByInterviewOrderByOrderNumber(interview);

        // Build summary data
        List<String> questionTexts = questions.stream().map(Question::getQuestionText).collect(Collectors.toList());
        List<String> answerTexts = questions.stream()
                .map(q -> q.getAnswerText() != null ? q.getAnswerText() : "")
                .collect(Collectors.toList());
        List<Integer> scores = questions.stream()
                .map(q -> q.getAiScore() != null ? q.getAiScore() : 0)
                .collect(Collectors.toList());
        List<String> technologies = fromJson(interview.getTechnologies());

        // Get AI summary
        Map<String, Object> summary = aiClientService.generateSummary(
                interview.getId(), questionTexts, answerTexts, scores,
                technologies, interview.getExperienceLevel().name());

        // Save score
        Double overallScore = ((Number) summary.get("overall_score")).doubleValue();
        Boolean passed = (Boolean) summary.get("passed");

        Score score = Score.builder()
                .interview(interview)
                .overallScore(overallScore)
                .passed(passed)
                .technicalFeedback((String) summary.get("technical_feedback"))
                .strengths(toJson((List<String>) summary.getOrDefault("strengths", List.of())))
                .improvements(toJson((List<String>) summary.getOrDefault("improvements", List.of())))
                .recommendation((String) summary.get("recommendation"))
                .build();
        scoreRepository.save(score);

        // Update interview status
        interview.setStatus(Interview.InterviewStatus.COMPLETED);
        interview.setCompletedAt(LocalDateTime.now());
        interview = interviewRepository.save(interview);

        // Send result email
        emailService.sendInterviewResult(user.getEmail(), user.getName(), overallScore, passed,
                interview.getRoundNumber(), technologies);

        return buildInterviewResponse(interview, questions, score);
    }

    public List<InterviewResponse> getUserInterviews(User user) {
        List<Interview> interviews = interviewRepository.findByUserOrderByCreatedAtDesc(user);
        return interviews.stream()
                .map(i -> {
                    List<Question> qs = questionRepository.findByInterviewOrderByOrderNumber(i);
                    Score s = scoreRepository.findByInterview(i).orElse(null);
                    return buildInterviewResponse(i, qs, s);
                })
                .collect(Collectors.toList());
    }

    public InterviewResponse getInterviewByToken(String token, User user) {
        Interview interview = interviewRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Interview not found"));
        if (!interview.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        List<Question> questions = questionRepository.findByInterviewOrderByOrderNumber(interview);
        Score score = scoreRepository.findByInterview(interview).orElse(null);
        return buildInterviewResponse(interview, questions, score);
    }

    // ---- Helpers ----

    private InterviewResponse buildInterviewResponse(Interview i, List<Question> questions, Score score) {
        List<String> technologies = fromJson(i.getTechnologies());
        return InterviewResponse.builder()
                .id(i.getId())
                .token(i.getToken())
                .roundNumber(i.getRoundNumber())
                .interviewType(i.getInterviewType())
                .experienceLevel(i.getExperienceLevel())
                .technologies(technologies)
                .status(i.getStatus())
                .scheduledAt(i.getScheduledAt())
                .startedAt(i.getStartedAt())
                .completedAt(i.getCompletedAt())
                .createdAt(i.getCreatedAt())
                .questions(questions.stream().map(this::buildQuestionResponse).collect(Collectors.toList()))
                .score(score != null ? buildScoreResponse(score) : null)
                .interviewLink(frontendUrl + "/interview/" + i.getToken())
                .build();
    }

    private QuestionResponse buildQuestionResponse(Question q) {
        return QuestionResponse.builder()
                .id(q.getId())
                .orderNumber(q.getOrderNumber())
                .questionText(q.getQuestionText())
                .category(q.getCategory())
                .difficulty(q.getDifficulty())
                .answerText(q.getAnswerText())
                .aiScore(q.getAiScore())
                .aiFeedback(q.getAiFeedback())
                .aiStrengths(fromJson(q.getAiStrengths()))
                .aiImprovements(fromJson(q.getAiImprovements()))
                .build();
    }

    private ScoreResponse buildScoreResponse(Score s) {
        return ScoreResponse.builder()
                .overallScore(s.getOverallScore())
                .passed(s.getPassed())
                .technicalFeedback(s.getTechnicalFeedback())
                .strengths(fromJson(s.getStrengths()))
                .improvements(fromJson(s.getImprovements()))
                .recommendation(s.getRecommendation())
                .build();
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) { return "[]"; }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) { return List.of(); }
    }
}
