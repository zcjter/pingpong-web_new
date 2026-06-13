package com.pingpong.controller;

import com.pingpong.entity.Competition;
import com.pingpong.entity.Match;
import com.pingpong.entity.Player;
import com.pingpong.mapper.CompetitionRepository;
import com.pingpong.mapper.MatchRepository;
import com.pingpong.mapper.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private CompetitionRepository competitionRepository;

    /** Helper: check if a match is a bye (轮空). */
    private boolean isByeMatch(Match m) {
        String p1 = m.getPlayer1Name();
        String p2 = m.getPlayer2Name();
        return (p1 != null && p1.contains("轮空")) || (p2 != null && p2.contains("轮空"));
    }

    /** Helper: check if a player participates in a match (handles doubles pairs and team rosters). */
    private boolean isPlayerInMatch(String playerName, Match match) {
        String p1 = match.getPlayer1Name();
        String p2 = match.getPlayer2Name();
        return isNameInEntry(playerName, p1) || isNameInEntry(playerName, p2);
    }

    /** Helper: check if playerName appears in a name entry (singles/doubles-pair/team-roster). */
    private boolean isNameInEntry(String playerName, String entry) {
        if (entry == null || entry.isBlank()) return false;
        if (entry.equals(playerName)) return true; // exact match (singles)
        if (entry.contains("/")) {
            // Doubles pair: "王楚钦/孙颖莎"
            for (String part : entry.split("/")) {
                if (part.trim().equals(playerName)) return true;
            }
        }
        if (entry.contains("，")) {
            // Team roster: "张禹珍，安宰贤，林钟勋，朴康贤，李尚洙"
            for (String part : entry.split("，")) {
                if (part.trim().equals(playerName)) return true;
            }
        }
        return false;
    }

    /** Infer play type from category: 单打 / 双打 / 团体. */
    private String inferPlayType(String category) {
        if (category == null) return "单打";
        if (category.contains("团")) return "团体";
        if (category.contains("双") || category.contains("混")) return "双打";
        return "单打"; // default to singles
    }

    /**
     * Overall system statistics (excluding bye matches).
     */
    @GetMapping("/overall")
    public ResponseEntity<Map<String, Object>> getOverallStats() {
        List<Match> allRealMatches = matchRepository.findAll().stream()
                .filter(m -> !isByeMatch(m))
                .collect(Collectors.toList());
        long totalMatches = allRealMatches.size();
        long completedMatches = allRealMatches.stream()
                .filter(m -> "completed".equals(m.getStatus())).count();
        long scheduledMatches = allRealMatches.stream()
                .filter(m -> "scheduled".equals(m.getStatus())).count();
        long ongoingMatches = allRealMatches.stream()
                .filter(m -> "ongoing".equals(m.getStatus())).count();
        long totalPlayers = playerRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMatches", totalMatches);
        stats.put("completedMatches", completedMatches);
        stats.put("scheduledMatches", scheduledMatches);
        stats.put("ongoingMatches", ongoingMatches);
        stats.put("totalPlayers", totalPlayers);
        return ResponseEntity.ok(stats);
    }

    /**
     * Distinct player/team names from actual match data (excludes 轮空).
     */
    @GetMapping("/players/from-matches")
    public ResponseEntity<List<Map<String, Object>>> getPlayersFromMatches() {
        List<Match> allMatches = matchRepository.findAll();
        Set<String> nameSet = new LinkedHashSet<>();
        for (Match m : allMatches) {
            if (isByeMatch(m)) continue;
            String p1 = m.getPlayer1Name();
            String p2 = m.getPlayer2Name();
            if (p1 != null && !p1.isBlank() && p1.length() <= 20) nameSet.add(p1);
            if (p2 != null && !p2.isBlank() && p2.length() <= 20) nameSet.add(p2);
        }
        List<Map<String, Object>> result = new ArrayList<>();
        int idx = 1;
        for (String name : nameSet) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", idx++);
            item.put("name", name);
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Player detailed analysis by name (from match data, no player table needed).
     */
    @GetMapping("/player/detailed-by-name")
    public ResponseEntity<Map<String, Object>> getPlayerDetailedByName(@RequestParam String name) {
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        List<Match> playerMatches = matchRepository.findAll().stream()
                .filter(m -> "completed".equals(m.getStatus()))
                .filter(m -> !isByeMatch(m))
                .filter(m -> isPlayerInMatch(name, m))
                .collect(Collectors.toList());

        Map<Long, Competition> compMap = new HashMap<>();
        competitionRepository.findAll().forEach(c -> compMap.put(c.getId(), c));

        int wins = 0, losses = 0;
        int singlesWins = 0, singlesLosses = 0;
        int teamWins = 0, teamLosses = 0;
        Map<String, int[]> categoryWinLoss = new LinkedHashMap<>();
        Map<String, int[]> compCatStats = new LinkedHashMap<>();
        Set<String> playerCategories = new LinkedHashSet<>();

        // New analysis accumulators
        Map<String, int[]> roundStats = new LinkedHashMap<>();          // round -> [wins, losses]
        Map<String, int[]> monthStats = new LinkedHashMap<>();           // "YYYY-MM" -> [matches, wins]
        Map<String, int[]> compTypeStats = new LinkedHashMap<>();        // compType -> [wins, losses]
        Map<String, int[]> opponentStats = new LinkedHashMap<>();        // opponent name -> [wins, losses]
        int maxScoreDiff = 0;
        int comebackWins = 0;    // won after losing first game
        int comebackLosses = 0;  // lost after winning first game
        Map<String, int[]> scoreDist = new LinkedHashMap<>();            // "11-9" format -> [count]
        ObjectMapper om = new ObjectMapper();

        for (Match match : playerMatches) {
            boolean isPlayer1 = isNameInEntry(name, match.getPlayer1Name());
            int p1Total = match.getPlayer1Total() != null ? match.getPlayer1Total() : 0;
            int p2Total = match.getPlayer2Total() != null ? match.getPlayer2Total() : 0;
            boolean won = isPlayer1 ? p1Total > p2Total : p2Total > p1Total;

            if (won) wins++; else losses++;

            String cat = match.getCategory() != null ? match.getCategory() : "其他";
            playerCategories.add(cat);
            categoryWinLoss.computeIfAbsent(cat, k -> new int[2]);
            if (won) categoryWinLoss.get(cat)[0]++; else categoryWinLoss.get(cat)[1]++;

            if (cat.contains("团")) {
                if (won) teamWins++; else teamLosses++;
            } else {
                if (won) singlesWins++; else singlesLosses++;
            }

            if (match.getCompetitionId() != null) {
                String key = match.getCompetitionId() + "|" + cat;
                compCatStats.computeIfAbsent(key, k -> new int[3]);
                compCatStats.get(key)[0]++;
                if (won) compCatStats.get(key)[1]++;
                else compCatStats.get(key)[2]++;
            }

            // 1. Round breakdown
            String rn = match.getRoundNumber();
            if (rn != null && !rn.isBlank()) {
                roundStats.computeIfAbsent(rn, k -> new int[2]);
                roundStats.get(rn)[0]++; // matches
                if (won) roundStats.get(rn)[1]++; // wins
            }

            // 2. Monthly trend
            if (match.getMatchDate() != null) {
                String ym = match.getMatchDate().getYear() + "-"
                        + String.format("%02d", match.getMatchDate().getMonthValue());
                monthStats.computeIfAbsent(ym, k -> new int[2]);
                monthStats.get(ym)[0]++; // matches
                if (won) monthStats.get(ym)[1]++; // wins
            }

            // 3. Competition type breakdown
            if (match.getCompetitionId() != null) {
                Competition comp = compMap.get(match.getCompetitionId());
                if (comp != null) {
                    String compType = inferCompetitionType(comp.getName());
                    compTypeStats.computeIfAbsent(compType, k -> new int[2]);
                    compTypeStats.get(compType)[0]++; // matches
                    if (won) compTypeStats.get(compType)[1]++; // wins
                }
            }

            // 4. Opponent head-to-head (skip team events)
            if (!cat.contains("团")) {
                String opponent = isPlayer1 ? match.getPlayer2Name() : match.getPlayer1Name();
                if (opponent != null && !opponent.isBlank()) {
                    opponentStats.computeIfAbsent(opponent, k -> new int[2]);
                    if (won) opponentStats.get(opponent)[0]++;
                    else opponentStats.get(opponent)[1]++;
                }
            }

            // 5. Score analysis
            String scoresJson = match.getScores();
            if (scoresJson != null && !scoresJson.isBlank()) {
                try {
                    List<Map<String, Object>> scores = om.readValue(scoresJson,
                            new TypeReference<List<Map<String, Object>>>() {});
                    if (scores != null && !scores.isEmpty()) {
                        int firstP1 = 0, firstP2 = 0;
                        for (int i = 0; i < scores.size(); i++) {
                            Map<String, Object> s = scores.get(i);
                            int sp1 = ((Number) s.getOrDefault("p1", 0)).intValue();
                            int sp2 = ((Number) s.getOrDefault("p2", 0)).intValue();
                            if (sp1 == 0 && sp2 == 0) continue; // skip unplayed games
                            int diff = Math.abs(sp1 - sp2);
                            if (diff > maxScoreDiff) maxScoreDiff = diff;

                            // Score distribution (winner score - loser score)
                            String scoreKey;
                            if (sp1 > sp2) scoreKey = sp1 + "-" + sp2;
                            else scoreKey = sp2 + "-" + sp1;
                            scoreDist.computeIfAbsent(scoreKey, k -> new int[1])[0]++;

                            if (i == 0) { firstP1 = sp1; firstP2 = sp2; }
                        }
                        // Comeback detection
                        boolean lostFirstGame = isPlayer1 ? firstP1 < firstP2 : firstP2 < firstP1;
                        if (lostFirstGame && won) comebackWins++;
                        if (!lostFirstGame && !won) comebackLosses++;
                    }
                } catch (Exception ignored) {}
            }
        }

        // Build competition details
        List<Map<String, Object>> competitionDetails = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : compCatStats.entrySet()) {
            String[] parts = entry.getKey().split("\\|", 2);
            Long compId = Long.parseLong(parts[0]);
            String cat = parts[1];
            int[] stats = entry.getValue();
            Competition comp = compMap.get(compId);
            Map<String, Object> cd = new LinkedHashMap<>();
            cd.put("competitionId", compId);
            cd.put("competitionName", comp != null ? comp.getName() : "未知赛事");
            cd.put("competitionYear", comp != null ? comp.getCompetitionYear() : null);
            cd.put("category", cat);
            cd.put("matches", stats[0]);
            cd.put("wins", stats[1]);
            cd.put("losses", stats[2]);
            cd.put("winRate", stats[0] > 0 ? Math.round((double) stats[1] / stats[0] * 10000.0) / 100.0 : 0.0);
            competitionDetails.add(cd);
        }
        competitionDetails.sort((a, b) -> {
            Integer ya = (Integer) a.getOrDefault("competitionYear", 0);
            Integer yb = (Integer) b.getOrDefault("competitionYear", 0);
            int yearCmp = yb - ya;
            if (yearCmp != 0) return yearCmp;
            int nameCmp = ((String)a.getOrDefault("competitionName","")).compareTo((String)b.getOrDefault("competitionName",""));
            if (nameCmp != 0) return nameCmp;
            return ((String)a.getOrDefault("category","")).compareTo((String)b.getOrDefault("category",""));
        });

        // Championships
        List<Map<String, Object>> championships = new ArrayList<>();
        Map<String, int[]> champByType = new LinkedHashMap<>();
        for (Match match : playerMatches) {
            String rn = match.getRoundNumber();
            if (rn == null) continue;
            if (!rn.contains("决赛") && !rn.contains("Final") && !rn.contains("final")) continue;
            if (rn.contains("半") || rn.contains("1/")) continue;

            boolean isPlayer1 = isNameInEntry(name, match.getPlayer1Name());
            int p1Total = match.getPlayer1Total() != null ? match.getPlayer1Total() : 0;
            int p2Total = match.getPlayer2Total() != null ? match.getPlayer2Total() : 0;
            boolean won = isPlayer1 ? p1Total > p2Total : p2Total > p1Total;
            if (!won) continue;

            Competition comp = match.getCompetitionId() != null ? compMap.get(match.getCompetitionId()) : null;
            String cat = match.getCategory() != null ? match.getCategory() : "其他";
            String playType = inferPlayType(cat);
            Map<String, Object> ch = new LinkedHashMap<>();
            ch.put("competitionId", match.getCompetitionId());
            ch.put("competitionName", comp != null ? comp.getName() : "未知赛事");
            ch.put("competitionYear", comp != null ? comp.getCompetitionYear() : null);
            ch.put("category", cat);
            ch.put("playType", playType);
            ch.put("opponent", isPlayer1 ? match.getPlayer2Name() : match.getPlayer1Name());
            championships.add(ch);

            champByType.computeIfAbsent(playType, k -> new int[1])[0]++;
        }

        // Build round breakdown list
        List<Map<String, Object>> roundBreakdown = new ArrayList<>();
        roundStats.forEach((round, stats) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("round", round);
            item.put("matches", stats[0]);
            item.put("wins", stats[1]);
            item.put("losses", stats[0] - stats[1]);
            item.put("winRate", stats[0] > 0 ? Math.round((double) stats[1] / stats[0] * 10000.0) / 100.0 : 0.0);
            roundBreakdown.add(item);
        });
        roundBreakdown.sort(Comparator.comparingInt(r -> - (Integer) r.get("matches")));

        // Build monthly trend list
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        monthStats.forEach((ym, stats) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", ym);
            item.put("matches", stats[0]);
            item.put("wins", stats[1]);
            item.put("winRate", stats[0] > 0 ? Math.round((double) stats[1] / stats[0] * 10000.0) / 100.0 : 0.0);
            monthlyTrend.add(item);
        });
        monthlyTrend.sort(Comparator.comparing(m -> (String) m.get("month")));

        // Build comp type breakdown
        List<Map<String, Object>> compTypeBreakdown = new ArrayList<>();
        compTypeStats.forEach((type, stats) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("type", type);
            item.put("matches", stats[0]);
            item.put("wins", stats[1]);
            item.put("losses", stats[0] - stats[1]);
            item.put("winRate", stats[0] > 0 ? Math.round((double) stats[1] / stats[0] * 10000.0) / 100.0 : 0.0);
            compTypeBreakdown.add(item);
        });
        List<String> typeOrder = Arrays.asList("大满贯赛", "冠军赛", "球星挑战赛", "常规挑战赛", "总决赛",
                "世乒赛", "世界杯", "奥运会", "亚运会", "亚锦赛", "青少年赛", "其他");
        compTypeBreakdown.sort(Comparator.comparingInt(t -> {
            int idx = typeOrder.indexOf(t.get("type"));
            return idx < 0 ? 999 : idx;
        }));

        // Build opponent records (sorted by matches descending, top 20)
        List<Map<String, Object>> opponentRecords = new ArrayList<>();
        opponentStats.forEach((opp, stats) -> {
            int total = stats[0] + stats[1];
            if (total < 2) return; // skip trivial opponents
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("opponent", opp);
            item.put("matches", total);
            item.put("wins", stats[0]);
            item.put("losses", stats[1]);
            item.put("winRate", total > 0 ? Math.round((double) stats[0] / total * 10000.0) / 100.0 : 0.0);
            opponentRecords.add(item);
        });
        opponentRecords.sort((a, b) -> (Integer) b.get("matches") - (Integer) a.get("matches"));
        List<Map<String, Object>> opponentRecordsFinal = opponentRecords.size() > 20
                ? new ArrayList<>(opponentRecords.subList(0, 20)) : opponentRecords;

        // Build score distribution list (sorted by frequency descending)
        List<Map<String, Object>> scoreDistribution = new ArrayList<>();
        scoreDist.forEach((scoreKey, cnt) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("score", scoreKey);
            item.put("count", cnt[0]);
            scoreDistribution.add(item);
        });
        scoreDistribution.sort((a, b) -> (Integer) b.get("count") - (Integer) a.get("count"));

        // Breakdowns
        Map<String, Integer> champByCategory = new LinkedHashMap<>();
        for (Map<String, Object> ch : championships) {
            String cat = (String) ch.getOrDefault("category", "其他");
            champByCategory.merge(cat, 1, Integer::sum);
        }
        List<Map<String, Object>> championshipCategoryBreakdown = new ArrayList<>();
        champByCategory.forEach((cat, cnt) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("category", cat);
            item.put("count", cnt);
            championshipCategoryBreakdown.add(item);
        });

        List<Map<String, Object>> championshipTypeBreakdown = new ArrayList<>();
        champByType.forEach((type, arr) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("type", type);
            item.put("count", arr[0]);
            championshipTypeBreakdown.add(item);
        });
        championshipTypeBreakdown.sort(Comparator.comparingInt(t -> {
            int idx = typeOrder.indexOf(t.get("type"));
            return idx < 0 ? 999 : idx;
        }));
        // Reset typeOrder to the play-type order for this breakdown
        List<String> playTypeOrder = Arrays.asList("单打", "双打", "团体");
        championshipTypeBreakdown.sort(Comparator.comparingInt(t -> {
            int idx = playTypeOrder.indexOf(t.get("type"));
            return idx < 0 ? 999 : idx;
        }));

        int singlesTotal = singlesWins + singlesLosses;
        int teamTotal = teamWins + teamLosses;

        List<Map<String, Object>> categoryBreakdown = new ArrayList<>();
        categoryWinLoss.forEach((cat, wl) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("category", cat);
            item.put("totalMatches", wl[0] + wl[1]);
            item.put("wins", wl[0]);
            item.put("losses", wl[1]);
            item.put("winRate", (wl[0] + wl[1]) > 0
                    ? Math.round((double) wl[0] / (wl[0] + wl[1]) * 10000.0) / 100.0 : 0.0);
            categoryBreakdown.add(item);
        });

        int totalMatches = wins + losses;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("playerName", name);
        result.put("totalMatches", totalMatches);
        result.put("wins", wins);
        result.put("losses", losses);
        result.put("winRate", totalMatches > 0
                ? Math.round((double) wins / totalMatches * 10000.0) / 100.0 : 0.0);
        result.put("singlesCount", singlesTotal);
        result.put("singlesWins", singlesWins);
        result.put("singlesLosses", singlesLosses);
        result.put("singlesWinRate", singlesTotal > 0
                ? Math.round((double) singlesWins / singlesTotal * 10000.0) / 100.0 : 0.0);
        result.put("teamCount", teamTotal);
        result.put("teamWins", teamWins);
        result.put("teamLosses", teamLosses);
        result.put("teamWinRate", teamTotal > 0
                ? Math.round((double) teamWins / teamTotal * 10000.0) / 100.0 : 0.0);
        result.put("competitionDetails", competitionDetails);
        result.put("championships", championships);
        result.put("championshipCategoryBreakdown", championshipCategoryBreakdown);
        result.put("championshipTypeBreakdown", championshipTypeBreakdown);
        result.put("categoryBreakdown", categoryBreakdown);

        // New analysis data
        result.put("roundBreakdown", roundBreakdown);
        result.put("monthlyTrend", monthlyTrend);
        result.put("compTypeBreakdown", compTypeBreakdown);
        result.put("opponentRecords", opponentRecordsFinal);
        result.put("maxScoreDiff", maxScoreDiff);
        result.put("comebackWins", comebackWins);
        result.put("comebackLosses", comebackLosses);
        result.put("scoreDistribution", scoreDistribution);

        return ResponseEntity.ok(result);
    }

    /**
     * Match count distribution by category (for pie chart).
     */
    @GetMapping("/matches/category-distribution")
    public ResponseEntity<List<Map<String, Object>>> getCategoryDistribution() {
        List<Match> allMatches = matchRepository.findAll().stream()
                .filter(m -> !isByeMatch(m))
                .collect(Collectors.toList());
        Map<String, Long> categoryCount = allMatches.stream()
                .filter(m -> m.getCategory() != null)
                .collect(Collectors.groupingBy(Match::getCategory, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        categoryCount.forEach((category, count) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("name", category);
            item.put("value", count);
            result.add(item);
        });
        result.sort((a, b) -> Long.compare((Long) b.get("value"), (Long) a.get("value")));
        return ResponseEntity.ok(result);
    }

    /**
     * Match count distribution by status.
     */
    @GetMapping("/matches/status-distribution")
    public ResponseEntity<List<Map<String, Object>>> getStatusDistribution() {
        List<Match> allMatches = matchRepository.findAll().stream()
                .filter(m -> !isByeMatch(m))
                .collect(Collectors.toList());
        Map<String, Long> statusCount = allMatches.stream()
                .collect(Collectors.groupingBy(Match::getStatus, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        statusCount.forEach((status, count) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("name", status);
            item.put("value", count);
            result.add(item);
        });
        return ResponseEntity.ok(result);
    }

    /**
     * Win/loss statistics for a specific player.
     */
    @GetMapping("/player/{id}/win-loss")
    public ResponseEntity<Map<String, Object>> getPlayerWinLoss(@PathVariable Long id) {
        Optional<Player> playerOpt = playerRepository.findById(id);
        if (!playerOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Player player = playerOpt.get();
        String playerName = player.getName();

        List<Match> allMatches = matchRepository.findAll().stream()
                .filter(m -> !isByeMatch(m))
                .collect(Collectors.toList());

        int wins = 0, losses = 0;
        Map<String, int[]> categoryWinLoss = new LinkedHashMap<>();

        for (Match match : allMatches) {
            if (!"completed".equals(match.getStatus())) continue;

            boolean isPlayer1 = playerName.equals(match.getPlayer1Name());
            boolean isPlayer2 = playerName.equals(match.getPlayer2Name());
            if (!isPlayer1 && !isPlayer2) continue;

            int p1Total = match.getPlayer1Total() != null ? match.getPlayer1Total() : 0;
            int p2Total = match.getPlayer2Total() != null ? match.getPlayer2Total() : 0;

            boolean playerWon;
            if (isPlayer1) {
                playerWon = p1Total > p2Total;
            } else {
                playerWon = p2Total > p1Total;
            }

            if (playerWon) wins++;
            else losses++;

            String category = match.getCategory() != null ? match.getCategory() : "其他";
            categoryWinLoss.computeIfAbsent(category, k -> new int[2]);
            if (playerWon) categoryWinLoss.get(category)[0]++;
            else categoryWinLoss.get(category)[1]++;
        }

        List<Map<String, Object>> categoryBreakdown = new ArrayList<>();
        categoryWinLoss.forEach((cat, wl) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("category", cat);
            item.put("wins", wl[0]);
            item.put("losses", wl[1]);
            categoryBreakdown.add(item);
        });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("playerId", id);
        result.put("playerName", playerName);
        result.put("totalMatches", wins + losses);
        result.put("wins", wins);
        result.put("losses", losses);
        result.put("winRate", (wins + losses) > 0
                ? Math.round((double) wins / (wins + losses) * 10000.0) / 100.0
                : 0.0);
        result.put("categoryBreakdown", categoryBreakdown);

        return ResponseEntity.ok(result);
    }

    /**
     * Match history for a player (for trend chart).
     * Returns cumulative win/loss over time.
     */
    @GetMapping("/player/{id}/match-history")
    public ResponseEntity<List<Map<String, Object>>> getPlayerMatchHistory(@PathVariable Long id) {
        Optional<Player> playerOpt = playerRepository.findById(id);
        if (!playerOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Player player = playerOpt.get();
        String playerName = player.getName();

        List<Match> matches = matchRepository.findAll().stream()
                .filter(m -> !isByeMatch(m))
                .filter(m -> "completed".equals(m.getStatus()))
                .filter(m -> playerName.equals(m.getPlayer1Name()) || playerName.equals(m.getPlayer2Name()))
                .sorted(Comparator.comparing(Match::getMatchDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparingLong(Match::getId))
                .collect(Collectors.toList());

        List<Map<String, Object>> history = new ArrayList<>();
        int cumulativeWins = 0;
        int cumulativeMatches = 0;

        for (Match match : matches) {
            boolean isPlayer1 = playerName.equals(match.getPlayer1Name());
            int p1Total = match.getPlayer1Total() != null ? match.getPlayer1Total() : 0;
            int p2Total = match.getPlayer2Total() != null ? match.getPlayer2Total() : 0;

            boolean won;
            String opponent;
            if (isPlayer1) {
                won = p1Total > p2Total;
                opponent = match.getPlayer2Name() != null ? match.getPlayer2Name() : "未知";
            } else {
                won = p2Total > p1Total;
                opponent = match.getPlayer1Name() != null ? match.getPlayer1Name() : "未知";
            }

            cumulativeMatches++;
            if (won) cumulativeWins++;

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", match.getMatchDate() != null ? match.getMatchDate().toString() : null);
            point.put("opponent", opponent);
            point.put("result", won ? "胜" : "负");
            point.put("cumulativeWins", cumulativeWins);
            point.put("cumulativeMatches", cumulativeMatches);
            point.put("winRate", Math.round((double) cumulativeWins / cumulativeMatches * 10000.0) / 100.0);
            point.put("category", match.getCategory());

            String scoreDisplay = "";
            if (match.getScores() != null) {
                scoreDisplay = p1Total + ":" + p2Total;
            }
            point.put("score", scoreDisplay);
            history.add(point);
        }

        return ResponseEntity.ok(history);
    }

    /**
     * Top N players by ranking points.
     */
    @GetMapping("/players/top")
    public ResponseEntity<List<Map<String, Object>>> getTopPlayers(
            @RequestParam(defaultValue = "10") int limit) {
        List<Player> players = playerRepository.findAllOrderByRankingPointsDesc();
        List<Map<String, Object>> topPlayers = new ArrayList<>();

        for (int i = 0; i < Math.min(limit, players.size()); i++) {
            Player p = players.get(i);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", p.getId());
            item.put("name", p.getName());
            item.put("points", p.getRankingPoints() != null ? p.getRankingPoints() : 0);
            item.put("country", p.getCountry() != null ? p.getCountry() : "");
            item.put("rank", i + 1);
            topPlayers.add(item);
        }

        return ResponseEntity.ok(topPlayers);
    }

    /**
     * Monthly match activity (for bar chart).
     */
    @GetMapping("/matches/monthly-activity")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyActivity() {
        List<Match> allMatches = matchRepository.findAll().stream()
                .filter(m -> !isByeMatch(m))
                .collect(Collectors.toList());
        Map<String, Integer> monthlyCount = new TreeMap<>();

        for (Match match : allMatches) {
            if (match.getMatchDate() == null) continue;
            String yearMonth = match.getMatchDate().toString().substring(0, 7); // "YYYY-MM"
            monthlyCount.merge(yearMonth, 1, Integer::sum);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        monthlyCount.forEach((ym, count) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", ym);
            item.put("count", count);
            result.add(item);
        });

        return ResponseEntity.ok(result);
    }

    // ========== Competition Analysis ==========

    /**
     * Infer competition type from its name.
     */
    private String inferCompetitionType(String name) {
        if (name == null || name.isBlank()) return "其他";
        if (name.contains("大满贯")) return "大满贯赛";
        if (name.contains("冠军赛")) return "冠军赛";
        if (name.contains("球星")) return "球星挑战赛";
        if (name.contains("常规挑战赛") || name.contains("常挑赛")) return "常规挑战赛";
        if (name.contains("挑战赛")) return "常规挑战赛";
        if (name.contains("总决赛")) return "总决赛";
        if (name.contains("世乒赛") || name.contains("世锦赛")) return "世乒赛";
        if (name.contains("世界杯")) return "世界杯";
        if (name.contains("奥运")) return "奥运会";
        if (name.contains("亚运")) return "亚运会";
        if (name.contains("亚锦赛")) return "亚锦赛";
        if (name.contains("亚洲")) return "亚锦赛";
        if (name.contains("青少年") || name.contains("青年")) return "青少年赛";
        return "其他";
    }

    /**
     * Competition type distribution by year (for stacked bar chart).
     */
    @GetMapping("/competitions/type-year")
    public ResponseEntity<List<Map<String, Object>>> getCompetitionTypeByYear() {
        List<Competition> allComps = competitionRepository.findAll();
        // Group by year then by type
        Map<Integer, Map<String, Integer>> yearTypeMap = new TreeMap<>(Comparator.reverseOrder());
        Set<String> allTypes = new LinkedHashSet<>();

        for (Competition comp : allComps) {
            Integer year = comp.getCompetitionYear();
            if (year == null) continue;
            String type = inferCompetitionType(comp.getName());
            allTypes.add(type);
            yearTypeMap.computeIfAbsent(year, k -> new LinkedHashMap<>());
            yearTypeMap.get(year).merge(type, 1, Integer::sum);
        }

        List<String> sortedTypes = new ArrayList<>(allTypes);
        // Order: 大满贯赛, 冠军赛, 球星挑战赛, 常规挑战赛, 总决赛, 世乒赛, 世界杯, 奥运会, 亚运会, 亚锦赛, 青少年赛, 其他
        List<String> typeOrder = Arrays.asList("大满贯赛", "冠军赛", "球星挑战赛", "常规挑战赛", "总决赛",
                "世乒赛", "世界杯", "奥运会", "亚运会", "亚锦赛", "青少年赛", "其他");
        sortedTypes.sort(Comparator.comparingInt(t -> {
            int idx = typeOrder.indexOf(t);
            return idx < 0 ? 999 : idx;
        }));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<Integer, Map<String, Integer>> yearEntry : yearTypeMap.entrySet()) {
            Map<String, Object> yearItem = new LinkedHashMap<>();
            yearItem.put("year", yearEntry.getKey());
            int total = yearEntry.getValue().values().stream().mapToInt(Integer::intValue).sum();
            List<Map<String, Object>> types = new ArrayList<>();
            for (String type : sortedTypes) {
                int count = yearEntry.getValue().getOrDefault(type, 0);
                if (count > 0) {
                    Map<String, Object> t = new LinkedHashMap<>();
                    t.put("type", type);
                    t.put("count", count);
                    t.put("percentage", Math.round((double) count / total * 10000.0) / 100.0);
                    types.add(t);
                }
            }
            yearItem.put("types", types);
            yearItem.put("total", total);
            result.add(yearItem);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Competition distribution by host city (for pie chart).
     */
    @GetMapping("/competitions/location-distribution")
    public ResponseEntity<List<Map<String, Object>>> getLocationDistribution() {
        List<Competition> allComps = competitionRepository.findAll();
        Map<String, Long> locationCount = new HashMap<>();

        for (Competition comp : allComps) {
            String loc = comp.getLocation();
            if (loc == null || loc.isBlank()) {
                loc = "未知";
            } else {
                // Extract city from location (e.g. "中国北京" -> "北京", "法国巴黎" -> "巴黎")
                // Keep as-is but trim
                loc = loc.trim();
            }
            locationCount.merge(loc, 1L, Long::sum);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        locationCount.forEach((loc, count) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", loc);
            item.put("value", count);
            result.add(item);
        });
        result.sort((a, b) -> Long.compare((Long) b.get("value"), (Long) a.get("value")));

        return ResponseEntity.ok(result);
    }

    /**
     * Detailed player analysis: competition participation, singles/team breakdown, championships.
     */
    @GetMapping("/player/{id}/detailed")
    public ResponseEntity<Map<String, Object>> getPlayerDetailed(@PathVariable Long id) {
        Optional<Player> playerOpt = playerRepository.findById(id);
        if (!playerOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Player player = playerOpt.get();
        String playerName = player.getName();

        // Get all completed matches for this player (exclude bye)
        List<Match> playerMatches = matchRepository.findAll().stream()
                .filter(m -> !isByeMatch(m))
                .filter(m -> "completed".equals(m.getStatus()))
                .filter(m -> playerName.equals(m.getPlayer1Name()) || playerName.equals(m.getPlayer2Name()))
                .collect(Collectors.toList());

        // Get all competitions for reference
        Map<Long, Competition> compMap = new HashMap<>();
        competitionRepository.findAll().forEach(c -> compMap.put(c.getId(), c));

        // Basic stats
        int wins = 0, losses = 0;
        int singlesWins = 0, singlesLosses = 0;
        int teamWins = 0, teamLosses = 0;
        Map<String, int[]> categoryWinLoss = new LinkedHashMap<>();
        // Competition-level aggregation
        Map<Long, int[]> compStats = new LinkedHashMap<>(); // [matches, wins, losses]
        Set<String> playerCategories = new LinkedHashSet<>();

        for (Match match : playerMatches) {
            boolean isPlayer1 = playerName.equals(match.getPlayer1Name());
            int p1Total = match.getPlayer1Total() != null ? match.getPlayer1Total() : 0;
            int p2Total = match.getPlayer2Total() != null ? match.getPlayer2Total() : 0;
            boolean won = isPlayer1 ? p1Total > p2Total : p2Total > p1Total;

            if (won) wins++; else losses++;

            String cat = match.getCategory() != null ? match.getCategory() : "其他";
            playerCategories.add(cat);
            categoryWinLoss.computeIfAbsent(cat, k -> new int[2]);
            if (won) categoryWinLoss.get(cat)[0]++; else categoryWinLoss.get(cat)[1]++;

            // Singles vs Team
            if (cat.contains("团")) {
                if (won) teamWins++; else teamLosses++;
            } else {
                if (won) singlesWins++; else singlesLosses++;
            }

            // Per competition
            if (match.getCompetitionId() != null) {
                compStats.computeIfAbsent(match.getCompetitionId(), k -> new int[3]); // [total, wins, losses]
                compStats.get(match.getCompetitionId())[0]++;
                if (won) compStats.get(match.getCompetitionId())[1]++;
                else compStats.get(match.getCompetitionId())[2]++;
            }
        }

        // --- Competition participation details ---
        List<Map<String, Object>> competitionDetails = new ArrayList<>();
        for (Map.Entry<Long, int[]> entry : compStats.entrySet()) {
            Long compId = entry.getKey();
            int[] stats = entry.getValue();
            Competition comp = compMap.get(compId);
            // Collect categories the player participated in for this competition
            Set<String> compCats = new LinkedHashSet<>();
            for (Match m : playerMatches) {
                if (compId.equals(m.getCompetitionId()) && m.getCategory() != null) {
                    compCats.add(m.getCategory());
                }
            }
            Map<String, Object> cd = new LinkedHashMap<>();
            cd.put("competitionId", compId);
            cd.put("competitionName", comp != null ? comp.getName() : "未知赛事");
            cd.put("competitionYear", comp != null ? comp.getCompetitionYear() : null);
            cd.put("matches", stats[0]);
            cd.put("wins", stats[1]);
            cd.put("losses", stats[2]);
            cd.put("winRate", stats[0] > 0 ? Math.round((double) stats[1] / stats[0] * 10000.0) / 100.0 : 0.0);
            cd.put("categories", new ArrayList<>(compCats));
            competitionDetails.add(cd);
        }
        competitionDetails.sort((a, b) -> {
            Integer ya = (Integer) a.getOrDefault("competitionYear", 0);
            Integer yb = (Integer) b.getOrDefault("competitionYear", 0);
            return yb - ya;
        });

        // --- Championships detection ---
        // A player wins a championship if they won a "决赛" match in a category for a competition
        List<Map<String, Object>> championships = new ArrayList<>();
        // Group matches by competition + category looking for finals
        for (Match match : playerMatches) {
            String rn = match.getRoundNumber();
            if (rn == null) continue;
            if (!rn.contains("决赛") && !rn.contains("Final") && !rn.contains("final")) continue;
            if (rn.contains("半") || rn.contains("1/")) continue; // exclude semi-finals, quarter-finals

            boolean isPlayer1 = playerName.equals(match.getPlayer1Name());
            int p1Total = match.getPlayer1Total() != null ? match.getPlayer1Total() : 0;
            int p2Total = match.getPlayer2Total() != null ? match.getPlayer2Total() : 0;
            boolean won = isPlayer1 ? p1Total > p2Total : p2Total > p1Total;
            if (!won) continue; // player didn't win this final

            Competition comp = match.getCompetitionId() != null ? compMap.get(match.getCompetitionId()) : null;
            Map<String, Object> ch = new LinkedHashMap<>();
            ch.put("competitionId", match.getCompetitionId());
            ch.put("competitionName", comp != null ? comp.getName() : "未知赛事");
            ch.put("competitionYear", comp != null ? comp.getCompetitionYear() : null);
            ch.put("category", match.getCategory());
            ch.put("opponent", isPlayer1 ? match.getPlayer2Name() : match.getPlayer1Name());
            championships.add(ch);
        }

        // Aggregate championship counts by category
        Map<String, Integer> champByCategory = new LinkedHashMap<>();
        for (Map<String, Object> ch : championships) {
            String cat = (String) ch.getOrDefault("category", "其他");
            champByCategory.merge(cat, 1, Integer::sum);
        }
        List<Map<String, Object>> championshipCategoryBreakdown = new ArrayList<>();
        champByCategory.forEach((cat, cnt) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("category", cat);
            item.put("count", cnt);
            championshipCategoryBreakdown.add(item);
        });

        // --- Build response ---
        int singlesTotal = singlesWins + singlesLosses;
        int teamTotal = teamWins + teamLosses;

        List<Map<String, Object>> categoryBreakdown = new ArrayList<>();
        categoryWinLoss.forEach((cat, wl) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("category", cat);
            item.put("totalMatches", wl[0] + wl[1]);
            item.put("wins", wl[0]);
            item.put("losses", wl[1]);
            item.put("winRate", (wl[0] + wl[1]) > 0
                    ? Math.round((double) wl[0] / (wl[0] + wl[1]) * 10000.0) / 100.0 : 0.0);
            categoryBreakdown.add(item);
        });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("playerId", id);
        result.put("playerName", playerName);
        result.put("totalMatches", wins + losses);
        result.put("wins", wins);
        result.put("losses", losses);
        result.put("winRate", (wins + losses) > 0
                ? Math.round((double) wins / (wins + losses) * 10000.0) / 100.0 : 0.0);
        // Singles vs Team
        result.put("singlesCount", singlesTotal);
        result.put("singlesWins", singlesWins);
        result.put("singlesLosses", singlesLosses);
        result.put("singlesWinRate", singlesTotal > 0
                ? Math.round((double) singlesWins / singlesTotal * 10000.0) / 100.0 : 0.0);
        result.put("teamCount", teamTotal);
        result.put("teamWins", teamWins);
        result.put("teamLosses", teamLosses);
        result.put("teamWinRate", teamTotal > 0
                ? Math.round((double) teamWins / teamTotal * 10000.0) / 100.0 : 0.0);
        // Competition details
        result.put("competitionDetails", competitionDetails);
        // Championships
        result.put("championships", championships);
        result.put("championshipCategoryBreakdown", championshipCategoryBreakdown);
        // Category breakdown
        result.put("categoryBreakdown", categoryBreakdown);

        return ResponseEntity.ok(result);
    }

    // ========== Overall Overview ==========

    /**
     * Comprehensive overall analysis: score distribution, most active players,
     * monthly win rate, competition type distribution, country championships.
     */
    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        List<Match> allCompleted = matchRepository.findAll().stream()
                .filter(m -> "completed".equals(m.getStatus()))
                .filter(m -> !isByeMatch(m))
                .collect(Collectors.toList());

        Map<Long, Competition> compMap = new HashMap<>();
        competitionRepository.findAll().forEach(c -> compMap.put(c.getId(), c));

        ObjectMapper om = new ObjectMapper();
        Map<String, Integer> scoreDist = new LinkedHashMap<>();
        int maxScoreDiff = 0;

        // Collect all distinct names and their match/win counts
        Map<String, int[]> playerMatchCount = new LinkedHashMap<>(); // name -> [matches, wins]

        for (Match match : allCompleted) {
            String p1 = match.getPlayer1Name();
            String p2 = match.getPlayer2Name();
            int p1Total = match.getPlayer1Total() != null ? match.getPlayer1Total() : 0;
            int p2Total = match.getPlayer2Total() != null ? match.getPlayer2Total() : 0;
            boolean p1Won = p1Total > p2Total;

            // Player match counts
            if (p1 != null && !p1.isBlank() && p1.length() <= 20) {
                playerMatchCount.computeIfAbsent(p1, k -> new int[2])[0]++;
                if (p1Won) playerMatchCount.get(p1)[1]++;
            }
            if (p2 != null && !p2.isBlank() && p2.length() <= 20) {
                playerMatchCount.computeIfAbsent(p2, k -> new int[2])[0]++;
                if (!p1Won) playerMatchCount.get(p2)[1]++;
            }

            // Score distribution (global)
            String scoresJson = match.getScores();
            if (scoresJson != null && !scoresJson.isBlank()) {
                try {
                    List<Map<String, Object>> scores = om.readValue(scoresJson,
                            new TypeReference<List<Map<String, Object>>>() {});
                    if (scores != null) {
                        for (Map<String, Object> s : scores) {
                            int sp1 = ((Number) s.getOrDefault("p1", 0)).intValue();
                            int sp2 = ((Number) s.getOrDefault("p2", 0)).intValue();
                            if (sp1 == 0 && sp2 == 0) continue;
                            int diff = Math.abs(sp1 - sp2);
                            if (diff > maxScoreDiff) maxScoreDiff = diff;
                            String key = (sp1 > sp2 ? sp1 + "-" + sp2 : sp2 + "-" + sp1);
                            scoreDist.merge(key, 1, Integer::sum);
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        // --- 1. Global score distribution ---
        List<Map<String, Object>> scoreDistribution = new ArrayList<>();
        scoreDist.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(20)
                .forEach(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("score", e.getKey());
                    item.put("count", e.getValue());
                    scoreDistribution.add(item);
                });

        // --- 2. Most active players ---
        List<Map<String, Object>> mostActivePlayers = new ArrayList<>();
        playerMatchCount.entrySet().stream()
                .sorted(Map.Entry.<String, int[]>comparingByValue(Comparator.comparingInt(a -> a[0])).reversed())
                .limit(20)
                .forEach(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", e.getKey());
                    item.put("matches", e.getValue()[0]);
                    item.put("wins", e.getValue()[1]);
                    item.put("winRate", e.getValue()[0] > 0
                            ? Math.round((double) e.getValue()[1] / e.getValue()[0] * 10000.0) / 100.0 : 0.0);
                    mostActivePlayers.add(item);
                });

        // --- 3. Monthly win rate ---
        // Recompute: for each month, count matches and who won
        Map<String, int[]> monthlyWinStats = new TreeMap<>();
        for (Match match : allCompleted) {
            if (match.getMatchDate() == null) continue;
            String ym = match.getMatchDate().getYear() + "-"
                    + String.format("%02d", match.getMatchDate().getMonthValue());
            int p1Total = match.getPlayer1Total() != null ? match.getPlayer1Total() : 0;
            int p2Total = match.getPlayer2Total() != null ? match.getPlayer2Total() : 0;
            monthlyWinStats.computeIfAbsent(ym, k -> new int[2]);
            monthlyWinStats.get(ym)[0]++; // total matches
            if (p1Total > p2Total) monthlyWinStats.get(ym)[1]++; // player1 wins count
            // Note: for overall win%, we count matches won by player1 as the indicator
        }
        List<Map<String, Object>> monthlyWinRate = new ArrayList<>();
        monthlyWinStats.forEach((ym, stats) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", ym);
            item.put("matches", stats[0]);
            item.put("wins", stats[1]);
            item.put("losses", stats[0] - stats[1]);
            item.put("winRate", stats[0] > 0
                    ? Math.round((double) stats[1] / stats[0] * 10000.0) / 100.0 : 0.0);
            monthlyWinRate.add(item);
        });

        // --- 4. Competition type distribution (aggregated) ---
        Map<String, Integer> compTypeAgg = new LinkedHashMap<>();
        Map<String, int[]> typeOrderMap = new LinkedHashMap<>();
        List<String> typeOrder = Arrays.asList("大满贯赛", "冠军赛", "球星挑战赛", "常规挑战赛", "总决赛",
                "世乒赛", "世界杯", "奥运会", "亚运会", "亚锦赛", "青少年赛", "其他");
        typeOrder.forEach(t -> typeOrderMap.put(t, new int[]{typeOrder.indexOf(t)}));

        for (Competition comp : compMap.values()) {
            String type = inferCompetitionType(comp.getName());
            compTypeAgg.merge(type, 1, Integer::sum);
        }
        List<Map<String, Object>> compTypeDistribution = new ArrayList<>();
        compTypeAgg.forEach((type, count) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("type", type);
            item.put("count", count);
            compTypeDistribution.add(item);
        });
        compTypeDistribution.sort(Comparator.comparingInt(t -> {
            int idx = typeOrder.indexOf(t.get("type"));
            return idx < 0 ? 999 : idx;
        }));

        // --- 5. Country championships ---
        // Detect finals winners and group by country
        Map<String, Integer> countryChamps = new LinkedHashMap<>();
        for (Match match : allCompleted) {
            String rn = match.getRoundNumber();
            if (rn == null) continue;
            if (!rn.contains("决赛") && !rn.contains("Final") && !rn.contains("final")) continue;
            if (rn.contains("半") || rn.contains("1/")) continue;

            int p1Total = match.getPlayer1Total() != null ? match.getPlayer1Total() : 0;
            int p2Total = match.getPlayer2Total() != null ? match.getPlayer2Total() : 0;
            String winnerCountry;
            if (p1Total > p2Total) {
                winnerCountry = match.getPlayer1Country();
            } else if (p2Total > p1Total) {
                winnerCountry = match.getPlayer2Country();
            } else {
                continue; // draw (unlikely for completed)
            }
            if (winnerCountry != null && !winnerCountry.isBlank()) {
                countryChamps.merge(winnerCountry.trim(), 1, Integer::sum);
            }
        }
        List<Map<String, Object>> countryChampionships = new ArrayList<>();
        countryChamps.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .forEach(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("country", e.getKey());
                    item.put("championships", e.getValue());
                    countryChampionships.add(item);
                });

        // --- 6. Upsets (low rank beats high rank) ---
        // Requires Player table rankingPoints. Only for singles matches.
        List<Map<String, Object>> upsets = new ArrayList<>();
        Map<String, Integer> playerRankingMap = new HashMap<>();
        // Player ranking points from DB (most recent per player)
        playerRepository.findAll().forEach(p -> {
            if (p.getName() != null && p.getRankingPoints() != null) {
                // Keep highest points if duplicate names (shouldn't happen)
                playerRankingMap.merge(p.getName(), p.getRankingPoints(), Math::max);
            }
        });

        for (Match match : allCompleted) {
            String p1 = match.getPlayer1Name();
            String p2 = match.getPlayer2Name();
            if (p1 == null || p2 == null) continue;

            // Only consider singles matches (no /, 、, &, + in names)
            if (p1.contains("/") || p1.contains("、") || p1.contains(",") || p1.contains("&") || p1.contains("+") ||
                p2.contains("/") || p2.contains("、") || p2.contains(",") || p2.contains("&") || p2.contains("+")) continue;

            Integer rp1 = playerRankingMap.get(p1);
            Integer rp2 = playerRankingMap.get(p2);
            if (rp1 == null || rp2 == null) continue;

            int p1Total = match.getPlayer1Total() != null ? match.getPlayer1Total() : 0;
            int p2Total = match.getPlayer2Total() != null ? match.getPlayer2Total() : 0;
            boolean p1Won = p1Total > p2Total;

            // Upset: lower points player beats higher points player
            boolean isUpset = (rp1 < rp2 && p1Won) || (rp2 < rp1 && !p1Won);
            if (!isUpset) continue;

            Map<String, Object> item = new LinkedHashMap<>();
            String winner = p1Won ? p1 : p2;
            String loser = p1Won ? p2 : p1;
            int wp = p1Won ? rp1 : rp2;
            int lp = p1Won ? rp2 : rp1;
            item.put("winner", winner);
            item.put("loser", loser);
            item.put("winnerPoints", wp);
            item.put("loserPoints", lp);
            item.put("diff", lp - wp);
            Competition comp = match.getCompetitionId() != null ? compMap.get(match.getCompetitionId()) : null;
            item.put("competition", comp != null ? comp.getName() : "未知赛事");
            upsets.add(item);
        }
        upsets.sort((a, b) -> (Integer) b.get("diff") - (Integer) a.get("diff"));
        List<Map<String, Object>> upsetsFinal = upsets.size() > 20
                ? new ArrayList<>(upsets.subList(0, 20)) : upsets;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scoreDistribution", scoreDistribution);
        result.put("maxScoreDiff", maxScoreDiff);
        result.put("mostActivePlayers", mostActivePlayers);
        result.put("monthlyWinRate", monthlyWinRate);
        result.put("compTypeDistribution", compTypeDistribution);
        result.put("countryChampionships", countryChampionships);
        result.put("upsets", upsetsFinal);

        return ResponseEntity.ok(result);
    }
}
