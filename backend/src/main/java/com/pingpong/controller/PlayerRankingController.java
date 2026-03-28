package com.pingpong.controller;

import com.pingpong.entity.PlayerRanking;
import com.pingpong.service.PlayerRankingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/rankings")
public class PlayerRankingController {
    
    @Autowired
    private PlayerRankingService playerRankingService;

    @GetMapping
    public List<PlayerRanking> getAllRankings() {
        return playerRankingService.findAll();
    }

    @GetMapping("/years")
    public List<Integer> getYears() {
        return playerRankingService.getYears();
    }

    @GetMapping("/year/{year}")
    public List<PlayerRanking> getRankingsByYear(@PathVariable Integer year) {
        return playerRankingService.findByYear(year);
    }

    @GetMapping("/year/{year}/category/{category}")
    public List<PlayerRanking> getRankingsByYearAndCategory(@PathVariable Integer year, @PathVariable String category) {
        return playerRankingService.findByYearAndCategory(year, category);
    }

    @GetMapping("/category/{category}")
    public List<PlayerRanking> getRankingsByCategory(@PathVariable String category) {
        return playerRankingService.findByCategory(category);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerRanking> getRankingById(@PathVariable Long id) {
        return playerRankingService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public PlayerRanking createRanking(@RequestBody PlayerRanking ranking) {
        return playerRankingService.save(ranking);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlayerRanking> updateRanking(@PathVariable Long id, @RequestBody PlayerRanking ranking) {
        return playerRankingService.findById(id)
                .map(existingRanking -> {
                    ranking.setId(id);
                    return ResponseEntity.ok(playerRankingService.save(ranking));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRanking(@PathVariable Long id) {
        if (playerRankingService.findById(id).isPresent()) {
            playerRankingService.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
