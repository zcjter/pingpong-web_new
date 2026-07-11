        // ========== 赛事冠军 ==========
        let allCompetitionsForChampions = [];

        async function loadChampionsPage() {
            try {
                const res = await fetch(`${API_BASE}/competitions`);
                allCompetitionsForChampions = await res.json();

                // 按年份降序排序（从高到低）
                allCompetitionsForChampions.sort((a, b) => (b.competitionYear || 0) - (a.competitionYear || 0));

                // 按年份分组
                const yearGrouped = {};
                allCompetitionsForChampions.forEach(c => {
                    const year = c.competitionYear || '未知年份';
                    if (!yearGrouped[year]) yearGrouped[year] = [];
                    yearGrouped[year].push(c);
                });

                let html = '';
                Object.keys(yearGrouped).sort((a, b) => b - a).forEach(year => {
                    // 每年份内按月份分组
                    const monthGrouped = {};
                    yearGrouped[year].forEach(c => {
                        let month = '未知月份';
                        if (c.startDate) {
                            const m = new Date(c.startDate).getMonth() + 1;
                            month = m + '月';
                        }
                        if (!monthGrouped[month]) monthGrouped[month] = [];
                        monthGrouped[month].push(c);
                    });

                    html += `<h4 style="margin: 20px 0 10px; color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 5px;">${year}年</h4>`;

                    // 月份排序：1-12月在前，未知月份在最后
                    const monthKeys = Object.keys(monthGrouped).sort((a, b) => {
                        const ma = parseInt(a);
                        const mb = parseInt(b);
                        if (!isNaN(ma) && !isNaN(mb)) return ma - mb;
                        if (!isNaN(ma)) return -1;
                        if (!isNaN(mb)) return 1;
                        return 0;
                    });

                    monthKeys.forEach(month => {
                        // 月份内按开始日期升序（最早的在前）
                        monthGrouped[month].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

                        html += `<h5 style="margin: 12px 0 8px; color: #555; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px;">📅 ${month}</h5>`;
                        monthGrouped[month].forEach(c => {
                            const dateRange = c.startDate && c.endDate
                                ? `${new Date(c.startDate).toLocaleDateString()} - ${new Date(c.endDate).toLocaleDateString()}`
                                : c.startDate
                                    ? `${new Date(c.startDate).toLocaleDateString()}`
                                    : '-';
                            html += `
                                <div class="competition-card" onclick="showCompetitionChampions(${c.id})">
                                    <div class="competition-info">
                                        <h4>${c.name}</h4>
                                        <p>📅 ${dateRange} | 📍 ${c.location || '-'}</p>
                                    </div>
                                </div>
                            `;
                        });
                    });
                });

                document.getElementById('champions-competitions-list').innerHTML = html || '<div class="empty-state">暂无赛事</div>';
            } catch (e) {
                console.error(e);
            }
        }

        function showChampionsList() {
            showPage('champions');
        }

        // 带国旗的冠军渲染
        function renderChampionCard(cat, r) {
            // 并列季军：每个国家单独显示国旗+名字
            const thirdCountries = Array.isArray(r.thirdCountries) ? r.thirdCountries : [];
            const thirdNames = Array.isArray(r.thirdPlaces) ? r.thirdPlaces : [r.thirdPlace].filter(Boolean);
            const third3Label = thirdNames.length > 1 ? '季军(并列)' : '季军';

            let thirdContent = '';
            if (thirdNames.length > 0) {
                thirdContent = thirdNames.map((name, i) => {
                    const flag = thirdCountries[i] ? getFlagForMatch(thirdCountries[i]) : '';
                    return `<div class="champion-name">${flag}${name}</div>`;
                }).join('');
            } else {
                thirdContent = `<div class="champion-name">-</div>`;
            }

            return `
                <div class="champion-cat-section">
                    <div class="champion-cat-title">${cat}</div>
                    <div class="champion-podium">
                        <div class="champion-slot">
                            <div class="champion-medal">🥇</div>
                            <div class="champion-name">${getFlagForMatch(r.championCountry)}${r.champion || '-'}</div>
                            <div class="champion-label">冠军</div>
                        </div>
                        <div class="champion-slot">
                            <div class="champion-medal">🥈</div>
                            <div class="champion-name">${getFlagForMatch(r.runnerUpCountry)}${r.runnerUp || '-'}</div>
                            <div class="champion-label">亚军</div>
                        </div>
                        <div class="champion-slot">
                            <div class="champion-medal">🥉</div>
                            ${thirdContent}
                            <div class="champion-label">${third3Label}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        function getMedalWinnersWithFlags(matches, category) {
            const base = getMedalWinners(matches, category);
            if (!base) return null;
            const matchByName = {};
            matches.forEach(m => {
                if (m.player1Name) matchByName[m.player1Name] = m.player1Country || '';
                if (m.player2Name) matchByName[m.player2Name] = m.player2Country || '';
            });
            const thirdCountries = Array.isArray(base.thirdPlaces)
                ? base.thirdPlaces.map(name => matchByName[name] || '')
                : [(matchByName[base.thirdPlace] || '')];
            return {
                ...base,
                championCountry: matchByName[base.champion] || '',
                runnerUpCountry: matchByName[base.runnerUp] || '',
                thirdCountries: thirdCountries
            };
        }

        async function showCompetitionChampions(competitionId) {
            try {
                const compRes = await fetch(`${API_BASE}/competitions/${competitionId}`);
                const comp = await compRes.json();

                const matchRes = await fetch(`${API_BASE}/matches/competition/${competitionId}`);
                const matches = await matchRes.json();

                const yearStr = comp.competitionYear ? `${comp.competitionYear}年 ` : '';
                document.getElementById('champions-competition-title').textContent = yearStr + comp.name;

                const dateRange = comp.startDate && comp.endDate
                    ? `${new Date(comp.startDate).toLocaleDateString()} - ${new Date(comp.endDate).toLocaleDateString()}`
                    : comp.startDate
                        ? `${new Date(comp.startDate).toLocaleDateString()}`
                        : '';

                // 按项目分组
                const categories = ['u11男单', 'u11女单', 'u13男单', 'u13女单', 'u15男单', 'u15女单', 'u15男双', 'u15女双', 'u15混双', 'u15男团', 'u15女团', 'u17男单', 'u17女单', 'u17男双', 'u17女双', 'u17混双', 'u19男单', 'u19女单', 'u19男双', 'u19女双', 'u19混双', 'u19男团', 'u19女团', '男单', '女单', '男双', '女双', '混双', '男团', '女团'];
                const grouped = {};
                matches.forEach(m => {
                    const cat = m.category || '其他';
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(m);
                });

                let html = `<p style="color:#666; margin-bottom:20px;">📅 ${dateRange} | 📍 ${comp.location || '-'}</p>`;

                // 只显示冠亚季军（带国旗）
                categories.forEach(cat => {
                    if (grouped[cat] && grouped[cat].length > 0) {
                        const results = getMedalWinnersWithFlags(grouped[cat], cat);
                        if (results) {
                            html += renderChampionCard(cat, results);
                        }
                    }
                });

                if (html === `<p style="color:#666; margin-bottom:20px;">📅 ${dateRange} | 📍 ${comp.location || '-'}</p>`) {
                    html += '<div class="empty-state">暂无冠亚季军信息（需完成决赛轮次）</div>';
                }

                // 其他项目
                Object.keys(grouped).forEach(cat => {
                    if (!categories.includes(cat)) {
                        const results = getMedalWinnersWithFlags(grouped[cat], cat);
                        if (results) {
                            html += renderChampionCard(cat, results);
                        }
                    }
                });

                if (html === `<p style="color:#666; margin-bottom:20px;">📅 ${dateRange} | 📍 ${comp.location || '-'}</p>`) {
                    html += '<div class="empty-state">暂无比赛记录</div>';
                }

                document.getElementById('champions-detail-content').innerHTML = html;

                document.getElementById('page-champions').style.display = 'none';
                document.getElementById('page-champions-detail').style.display = 'block';
            } catch (e) {
                console.error(e);
            }
        }

        function getMedalWinners(matches, category) {
            console.log('=== getMedalWinners called ===');
            console.log('All matches:', matches.map(m => ({ id: m.id, round: m.roundNumber, status: m.status, p1: m.player1Name })));

            // 只处理已完成比赛（兼容多种状态值）
            const completedMatches = matches.filter(m => {
                const status = (m.status || '').toLowerCase();
                return status === 'completed' || status === 'finished' || status === '已完成' || status === '已结束';
            });

            console.log('All matches:', matches.map(m => ({ id: m.id, round: m.roundNumber, status: m.status, p1: m.player1Name })));
            console.log('Completed matches:', completedMatches.map(m => ({ id: m.id, round: m.roundNumber, p1: m.player1Name })));

            if (completedMatches.length === 0) return null;

            // 找决赛（必须包含"决赛"或"Final"，且不是1/Xx决赛格式）
            const allFinals = completedMatches.filter(m => {
                const r = m.roundNumber || '';
                const isFinal = (r.includes('决赛') || r.toLowerCase().includes('final'))
                    && !/1\/\d+决赛/.test(r) && !r.includes('半');
                return isFinal;
            });

            // 按日期排序，取最晚的决赛
            allFinals.sort((a, b) => new Date(b.matchDate || 0) - new Date(a.matchDate || 0));

            const finalMatch = allFinals.length > 0 ? allFinals[0] : null;

            console.log('Final match:', finalMatch ? { id: finalMatch.id, p1: finalMatch.player1Name, p2: finalMatch.player2Name } : 'none');

            // 没有决赛，不显示冠亚季军
            if (!finalMatch) {
                console.log('No final match, returning null');
                return null;
            }

            let champion = null;
            let runnerUp = null;
            let thirdPlace = null;
            let thirdPlaces = [];

            // 计算总分
            let p1Total = finalMatch.player1Total || 0;
            let p2Total = finalMatch.player2Total || 0;

            // 从scores计算
            if ((p1Total === 0 && p2Total === 0) && finalMatch.scores) {
                try {
                    const scores = JSON.parse(finalMatch.scores);
                    scores.forEach(s => {
                        if (s.p1 > s.p2) p1Total++;
                        else if (s.p2 > s.p1) p2Total++;
                    });
                } catch (e) { }
            }

            console.log('Final scores:', p1Total, p2Total);

            if (p1Total > p2Total) {
                champion = finalMatch.player1Name;
                runnerUp = finalMatch.player2Name;
            } else if (p2Total > p1Total) {
                champion = finalMatch.player2Name;
                runnerUp = finalMatch.player1Name;
            } else {
                console.log('Final match is a tie, cannot determine champion');
                return null;
            }

            console.log('Champion:', champion, 'Runner up:', runnerUp);

            // 查找所有半决（用于确定季军）- 支持多种格式
            console.log('===== DEBUG: All completed matches roundNumbers =====');
            completedMatches.forEach(m => {
                console.log(`Match ${m.id}: roundNumber="${m.roundNumber}", p1=${m.player1Name}, p2=${m.player2Name}`);
            });

            const semiFinals = completedMatches.filter(m => {
                const r = m.roundNumber || '';
                const isSemi = r.includes('半') || r.toLowerCase().includes('semi') || r.includes('准决') || r.includes('4强') || r.includes('半决赛') || r.includes('初赛');
                console.log('Checking match for semi:', m.id, m.roundNumber, 'isSemi:', isSemi);
                return isSemi;
            });

            console.log('===== Semi-finals found:', semiFinals.length);
            semiFinals.forEach((semi, i) => {
                console.log(`Semi ${i + 1}:`, { p1: semi.player1Name, p2: semi.player2Name, scores: semi.scores });
            });

            console.log('===== Processing semi-finals for third places =====');

            // 铜牌赛
            const bronzeMatch = completedMatches.find(m => (m.roundNumber || '').includes('铜牌'));

            if (bronzeMatch) {
                let bP1Total = bronzeMatch.player1Total || 0;
                let bP2Total = bronzeMatch.player2Total || 0;

                if ((bP1Total === 0 && bP2Total === 0) && bronzeMatch.scores) {
                    try {
                        const scores = JSON.parse(bronzeMatch.scores);
                        scores.forEach(s => {
                            if (s.p1 > s.p2) bP1Total++;
                            else if (s.p2 > s.p1) bP2Total++;
                        });
                    } catch (e) { }
                }

                if (bP1Total > bP2Total) {
                    thirdPlace = bronzeMatch.player1Name;
                    thirdPlaces = [bronzeMatch.player1Name];
                } else if (bP2Total > bP1Total) {
                    thirdPlace = bronzeMatch.player2Name;
                    thirdPlaces = [bronzeMatch.player2Name];
                }
            } else if (semiFinals.length > 0) {
                console.log('===== Processing', semiFinals.length, 'semifinals for third places');
                // 没有铜牌赛时，使用所有半决输的两队作为季军
                for (const semi of semiFinals) {
                    let sP1Total = 0;
                    let sP2Total = 0;

                    // 从scores计算总分
                    if (semi.scores) {
                        try {
                            const scores = JSON.parse(semi.scores);
                            console.log('Semi scores:', semi.player1Name, 'vs', semi.player2Name, scores);
                            scores.forEach(s => {
                                if (s.p1 > s.p2) sP1Total++;
                                else if (s.p2 > s.p1) sP2Total++;
                            });
                            console.log('Semi totals:', sP1Total, 'vs', sP2Total);
                        } catch (e) { }
                    }

                    console.log('Semi match:', semi.player1Name, sP1Total, 'vs', semi.player2Name, sP2Total);
                    console.log('Winner is:', sP1Total > sP2Total ? semi.player1Name : (sP2Total > sP1Total ? semi.player2Name : 'tie'));

                    console.log('===== DEBUG: Adding third place =====');
                    console.log('Condition 1 (player1 wins): sP1Total=' + sP1Total + ', sP2Total=' + sP2Total + ', result=' + (sP1Total > sP2Total && sP1Total > 0));
                    console.log('Condition 2 (player2 wins): sP2Total=' + sP2Total + ', sP1Total=' + sP1Total + ', result=' + (sP2Total > sP1Total && sP2Total > 0));

                    // 输的一方加入季军列表（忽略0-0的比分）
                    if (sP1Total > sP2Total && sP1Total > 0) {
                        console.log('Adding loser (player2 won):', semi.player2Name);
                        if (!thirdPlaces.includes(semi.player2Name)) {
                            thirdPlaces.push(semi.player2Name);
                            console.log('Added third place:', semi.player2Name);
                        }
                    }
                    if (sP2Total > sP1Total && sP2Total > 0) {
                        console.log('Adding loser (player1 won):', semi.player1Name);
                        if (!thirdPlaces.includes(semi.player1Name)) {
                            thirdPlaces.push(semi.player1Name);
                            console.log('Added third place:', semi.player1Name);
                        }
                    }
                }
            }

            console.log('===== Final thirdPlaces array:', thirdPlaces);

            console.log('Third place:', thirdPlace);
            console.log('Third places (array):', thirdPlaces);

            if (!champion) return null;

            const result = {
                champion: champion || '-',
                runnerUp: runnerUp || '-',
                thirdPlace: thirdPlace || '-',
                thirdPlaces: thirdPlaces.length > 0 ? thirdPlaces : null,
                _debug: {
                    semiFinalsCount: semiFinals.length,
                    semiFinals: semiFinals.map(s => ({ id: s.id, round: s.roundNumber, p1: s.player1Name, p2: s.player2Name })),
                    thirdPlacesRaw: thirdPlaces
                }
            };
            console.log('===== FINAL RESULT:', result);
            return result;
        }

        function getRoundOrder(roundNumber) {
            if (!roundNumber) return 999;
            if (roundNumber.includes('决赛') || roundNumber.includes('Final')) return 1;
            if (roundNumber.includes('半决') || roundNumber.includes('Semi')) return 2;
            if (roundNumber.includes('1/4') || roundNumber.includes('Quarter')) return 3;
            if (roundNumber.includes('1/8')) return 4;
            if (roundNumber.includes('1/16')) return 5;
            if (roundNumber.includes('1/32')) return 6;
            if (roundNumber.includes('1/64')) return 7;
            if (roundNumber.includes('1/128')) return 8;
            return 9;
        }
