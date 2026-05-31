package com.pingpong.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "matches")
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "competition_id")
    private Long competitionId;

    @Column(name = "player1_id")
    private Long player1Id;

    @Column(name = "player1_name")
    private String player1Name;

    @Column(name = "player1_country")
    private String player1Country;

    @Column(name = "player2_id")
    private Long player2Id;

    @Column(name = "player2_name")
    private String player2Name;

    @Column(name = "player2_country")
    private String player2Country;

    @Column(name = "scores", columnDefinition = "JSON")
    private String scores;

    @Column(name = "player1_total")
    private Integer player1Total;

    @Column(name = "player2_total")
    private Integer player2Total;

    private String venue;

    @Column(name = "match_date")
    private LocalDateTime matchDate;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(name = "round_number")
    private String roundNumber;

    @Column(name = "category")
    private String category;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
