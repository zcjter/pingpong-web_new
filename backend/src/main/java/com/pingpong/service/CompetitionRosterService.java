package com.pingpong.service;

import com.pingpong.entity.CompetitionRoster;
import com.pingpong.mapper.CompetitionRosterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CompetitionRosterService {

    @Autowired
    private CompetitionRosterRepository repository;

    public List<CompetitionRoster> findAll() {
        return repository.findAll();
    }

    public List<CompetitionRoster> findByVenue(String venue) {
        return repository.findByVenueOrderByCategoryAsc(venue);
    }

    public List<CompetitionRoster> findByVenueAndYear(String venue, Integer year) {
        return repository.findByVenueAndYearOrderByCategoryAsc(venue, year);
    }

    public Optional<CompetitionRoster> findById(Long id) {
        return repository.findById(id);
    }

    public CompetitionRoster save(CompetitionRoster roster) {
        return repository.save(roster);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public void deleteByVenue(String venue) {
        repository.deleteByVenue(venue);
    }

    public void deleteByVenueAndYear(String venue, Integer year) {
        repository.deleteByVenueAndYear(venue, year);
    }
}
