package com.pingpong.controller;

import com.pingpong.entity.CompetitionRoster;
import com.pingpong.service.CompetitionRosterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roster")
public class CompetitionRosterController {

    @Autowired
    private CompetitionRosterService service;

    @GetMapping
    public List<CompetitionRoster> getAllRosters() {
        return service.findAll();
    }

    @GetMapping("/venue/{venue}")
    public List<CompetitionRoster> getRostersByVenue(@PathVariable String venue) {
        return service.findByVenue(venue);
    }

    @GetMapping("/venue/{venue}/year/{year}")
    public List<CompetitionRoster> getRostersByVenueAndYear(@PathVariable String venue, @PathVariable Integer year) {
        return service.findByVenueAndYear(venue, year);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompetitionRoster> getRosterById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public CompetitionRoster createRoster(@RequestBody CompetitionRoster roster) {
        return service.save(roster);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompetitionRoster> updateRoster(@PathVariable Long id, @RequestBody CompetitionRoster roster) {
        return service.findById(id)
                .map(existingRoster -> {
                    roster.setId(id);
                    return ResponseEntity.ok(service.save(roster));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoster(@PathVariable Long id) {
        if (service.findById(id).isPresent()) {
            service.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/venue/{venue}")
    public ResponseEntity<Void> deleteRostersByVenue(@PathVariable String venue) {
        service.deleteByVenue(venue);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/venue/{venue}/year/{year}")
    public ResponseEntity<Void> deleteRostersByVenueAndYear(@PathVariable String venue, @PathVariable Integer year) {
        service.deleteByVenueAndYear(venue, year);
        return ResponseEntity.ok().build();
    }
}
