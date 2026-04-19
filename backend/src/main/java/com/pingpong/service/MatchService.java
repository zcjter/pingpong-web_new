package com.pingpong.service;

import com.pingpong.entity.Match;
import com.pingpong.mapper.MatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class MatchService {
    
    @Autowired
    private MatchRepository matchRepository;

    public List<Match> findAll() {
        return matchRepository.findAll(Sort.by(Sort.Direction.ASC, "matchDate"));
    }

    public Optional<Match> findById(Long id) {
        return matchRepository.findById(id);
    }

    public List<Match> findByStatus(String status) {
        return matchRepository.findByStatusOrderByMatchDateAsc(status);
    }

    public List<Match> findByCompetition(Long competitionId) {
        return matchRepository.findByCompetitionIdOrderByMatchDateAsc(competitionId);
    }

    @Transactional
    public Match save(Match match) {
        return matchRepository.save(match);
    }

    @Transactional
    public void deleteById(Long id) {
        matchRepository.deleteById(id);
    }
}
