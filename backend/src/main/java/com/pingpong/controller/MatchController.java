package com.pingpong.controller;

import com.pingpong.entity.Match;
import com.pingpong.service.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/matches")
public class MatchController {
    
    @Autowired
    private MatchService matchService;

    @GetMapping
    public List<Match> getAllMatches() {
        return matchService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Match> getMatchById(@PathVariable Long id) {
        return matchService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<Match> getMatchesByStatus(@PathVariable String status) {
        return matchService.findByStatus(status);
    }

    @GetMapping("/competition/{competitionId}")
    public List<Match> getMatchesByCompetition(@PathVariable Long competitionId) {
        return matchService.findByCompetition(competitionId);
    }

    @PostMapping
    public Match createMatch(@RequestBody Match match) {
        return matchService.save(match);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Match> updateMatch(@PathVariable Long id, @RequestBody Match match) {
        return matchService.findById(id)
                .map(existingMatch -> {
                    match.setId(id);
                    return ResponseEntity.ok(matchService.save(match));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMatch(@PathVariable Long id) {
        if (matchService.findById(id).isPresent()) {
            matchService.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
