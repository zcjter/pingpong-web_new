package com.pingpong.mapper;

import com.pingpong.entity.CompetitionRoster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionRosterRepository extends JpaRepository<CompetitionRoster, Long> {
    List<CompetitionRoster> findByVenue(String venue);
    List<CompetitionRoster> findByVenueOrderByCategoryAsc(String venue);
    List<CompetitionRoster> findByVenueAndYear(String venue, Integer year);
    List<CompetitionRoster> findByVenueAndYearOrderByCategoryAsc(String venue, Integer year);
    void deleteByVenue(String venue);
    void deleteByVenueAndYear(String venue, Integer year);
}
