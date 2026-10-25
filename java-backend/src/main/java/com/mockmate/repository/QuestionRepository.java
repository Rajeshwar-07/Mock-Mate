package com.mockmate.repository;

import com.mockmate.entity.Interview;
import com.mockmate.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByInterviewOrderByOrderNumber(Interview interview);
    long countByInterview(Interview interview);
}
