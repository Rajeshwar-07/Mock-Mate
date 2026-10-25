package com.mockmate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "scores")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @Column(name = "overall_score")
    private Double overallScore;

    private Boolean passed;

    @Column(name = "technical_feedback", columnDefinition = "TEXT")
    private String technicalFeedback;

    @Column(columnDefinition = "TEXT")
    private String strengths;        // JSON array

    @Column(columnDefinition = "TEXT")
    private String improvements;     // JSON array

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
