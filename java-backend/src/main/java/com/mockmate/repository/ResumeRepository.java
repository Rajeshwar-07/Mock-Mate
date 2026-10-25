package com.mockmate.repository;

import com.mockmate.entity.Resume;
import com.mockmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Optional<Resume> findByUser(User user);
}
