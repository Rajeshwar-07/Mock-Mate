package com.mockmate.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @Column(name = "order_number")
    private Integer orderNumber;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    private String category;         // technical / hr / behavioral

    private String difficulty;       // easy / medium / hard

    @Column(name = "expected_keywords", columnDefinition = "TEXT")
    private String expectedKeywords; // JSON array

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "ai_score")
    private Integer aiScore;         // 0-10

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(name = "ai_strengths", columnDefinition = "TEXT")
    private String aiStrengths;      // JSON array

    @Column(name = "ai_improvements", columnDefinition = "TEXT")
    private String aiImprovements;   // JSON array

    @Column(name = "ideal_answer", columnDefinition = "TEXT")
    private String idealAnswer;
}
