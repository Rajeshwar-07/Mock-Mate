package com.mockmate.repository;

import com.mockmate.entity.Interview;
import com.mockmate.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ScoreRepository extends JpaRepository<Score, Long> {
    Optional<Score> findByInterview(Interview interview);
}
