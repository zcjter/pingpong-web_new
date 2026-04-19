package com.pingpong.mapper;

import com.pingpong.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.domain.Sort;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByStatus(String status);
    List<Match> findByCompetitionId(Long competitionId);
    List<Match> findByCompetitionIdOrderByMatchDateAsc(Long competitionId);
    List<Match> findByStatusOrderByMatchDateAsc(String status);
    void deleteByCompetitionId(Long competitionId);
}
