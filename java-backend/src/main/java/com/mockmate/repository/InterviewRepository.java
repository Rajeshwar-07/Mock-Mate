package com.mockmate.repository;

import com.mockmate.entity.Interview;
import com.mockmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByUserOrderByCreatedAtDesc(User user);
    Optional<Interview> findByToken(String token);
    List<Interview> findByUserAndRoundNumber(User user, Integer roundNumber);

    @Query("SELECT i FROM Interview i WHERE i.user = :user AND i.roundNumber = :round AND i.status = 'COMPLETED'")
    Optional<Interview> findCompletedRound(User user, Integer round);
}
