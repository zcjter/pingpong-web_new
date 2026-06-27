// ========== �������飺��������չʾ ==========
let currentDetailCategory = '';
let currentDetailPhase = 'elim';
let currentDetailCategory = '';

function renderDetailRounds(container, matches) {
    const categories = ['u11男单', 'u11女单', 'u13男单', 'u13女单', 'u15男单', 'u15女单', 'u15男双', 'u15女双', 'u15混双', 'u15男团', 'u15女团', 'u17男单', 'u17女单', 'u17男双', 'u17女双', 'u17混双', 'u19男单', 'u19女单', 'u19男双', 'u19女双', 'u19混双', 'u19男团', 'u19女团', '男单', '女单', '男双', '女双', '混双', '男团', '女团'];
    const roundOrder = ['资格�?, '小组�?, '第一�?, '第二�?, '第三�?, '第四�?, '1/128', '1/64', '1/32', '1/16', '1/8', '1/4', '四分之一决赛', '四分之一', '半决', '半决�?, '决赛', '铜牌', '冠军', '亚军'];
    const grouped = {};
    matches.forEach(m => {
        const cat = m.category || '其他';
        if (!grouped[cat]) grouped[cat] = {};
        const key = m.roundNumber || '其他';
        if (!grouped[cat][key]) grouped[cat][key] = [];
        grouped[cat][key].push(m);
    });

    const availableCategories = categories.filter(cat => grouped[cat]);
    if (availableCategories.length === 0) {
        container.innerHTML = '<div class="empty-state" style="background:#f5f5f5;color:#999;">暂无比赛记录</div>';
        return;
    }

    // Reset phase to 淘汰�?on each render
    currentDetailPhase = 'elim';

    // Default category: prefer 男单 > 男团 > first available
    var defaultCat = availableCategories[0];
    var msPref = availableCategories.filter(function(c){ return c.indexOf('男单') >= 0; });
    var mtPref = availableCategories.filter(function(c){ return c.indexOf('男团') >= 0; });
    if (msPref.length > 0) defaultCat = msPref[0];
    else if (mtPref.length > 0) defaultCat = mtPref[0];
    if (currentDetailCategory && grouped[currentDetailCategory]) defaultCat = currentDetailCategory;
    currentDetailCategory = defaultCat;

    let tabsHtml = '';

    // Determine which phases have data
    var hasGroup = false, hasQualify = false, hasElim = false;
    availableCategories.forEach(function(cat){
        var catData = grouped[cat];
        Object.keys(catData).forEach(function(k){
            if (k.includes('�?)) hasGroup = true;
            else if (k.includes('资格')) hasQualify = true;
            else hasElim = true;
        });
    });

    // Category tabs row (top)
    tabsHtml += `<div class="bracket-toggle-btns" style="margin-bottom:8px;">`;
    availableCategories.forEach((cat, i) => {
        tabsHtml += `<button class="bracket-category-tab ${cat === defaultCat ? 'active' : ''}" onclick="switchDetailCategory('${cat}', this)">${cat}</button>`;
    });
    tabsHtml += `</div>`;

    // Phase tabs row (below category tabs, same style)
    // Auto-switch phase if current has no data
    if ((currentDetailPhase === 'group' && !hasGroup) ||
        (currentDetailPhase === 'qualify' && !hasQualify) ||
        (currentDetailPhase === 'elim' && !hasElim)) {
        currentDetailPhase = hasElim ? 'elim' : (hasGroup ? 'group' : 'qualify');
    }
    tabsHtml += `<div class="bracket-toggle-btns" style="margin-bottom:12px;">`;
    if (hasElim) tabsHtml += `<button class="detail-phase-tab bracket-category-tab ${currentDetailPhase === 'elim' ? 'active' : ''}" onclick="switchDetailPhase('elim', this)">淘汰�?/button>`;
    if (hasGroup) tabsHtml += `<button class="detail-phase-tab bracket-category-tab ${currentDetailPhase === 'group' ? 'active' : ''}" onclick="switchDetailPhase('group', this)">小组�?/button>`;
    if (hasQualify) tabsHtml += `<button class="detail-phase-tab bracket-category-tab ${currentDetailPhase === 'qualify' ? 'active' : ''}" onclick="switchDetailPhase('qualify', this)">资格�?/button>`;
    tabsHtml += `</div>`;

    let contentHtml = '';
    var globalDetailIdx = 0;
    availableCategories.forEach((cat, i) => {
        const catData = grouped[cat];
        const roundKeys = Object.keys(catData).sort((a, b) => {
            const ia = roundOrder.findIndex(k => a.includes(k));
            const ib = roundOrder.findIndex(k => b.includes(k));
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return 1;
            if (ib !== -1) return -1;
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            if (!isNaN(numA)) return 1;
            if (!isNaN(numB)) return -1;
            return a.localeCompare(b, 'zh');
        });
        if (roundKeys.length === 0) return;

        contentHtml += `<div id="detail-cat-${cat}" class="detail-category-content" style="display:${cat === defaultCat ? 'block' : 'none'};">`;
        contentHtml += `<div class="round-cat">`;
        roundKeys.forEach(key => {
            const roundMatches = catData[key];
            const isGroup = key.includes('�?);
            var roundPhase = 'elim';
            if (key.includes('�?)) roundPhase = 'group';
            else if (key.includes('资格')) roundPhase = 'qualify';
            contentHtml += `<div class="round-section${isGroup ? ' is-group' : ''}" data-phase="${roundPhase}">`;
            contentHtml += `<div class="round-header"><span class="round-header-dot"></span>${key}</div>`;
            if (isGroup) {
                // --- 小组赛：矩阵布局 ---
                const isTeamGroup = roundMatches.some(function(mx){ return mx.category && mx.category.indexOf('�?) >= 0; });

                // Extract unique participants
                var participants = [];
                if (isTeamGroup) {
                    var countrySet = {};
                    roundMatches.forEach(function(mx){
                        if (mx.player1Country) countrySet[mx.player1Country] = true;
                        if (mx.player2Country) countrySet[mx.player2Country] = true;
                    });
                    participants = Object.keys(countrySet);
                } else {
                    var nameSet = {};
                    roundMatches.forEach(function(mx){
                        if (mx.player1Name) nameSet[mx.player1Name] = true;
                        if (mx.player2Name) nameSet[mx.player2Name] = true;
                    });
                    participants = Object.keys(nameSet);
                }
                participants.sort();

                // Build participant -> matches lookup
                var matchLookup = {};
                var allMatchDetails = []; // collect all matches for bottom detail section
                roundMatches.forEach(function(mx){
                    var a = isTeamGroup ? (mx.player1Country||'') : (mx.player1Name||'');
                    var b = isTeamGroup ? (mx.player2Country||'') : (mx.player2Name||'');
                    if (!a || !b) return;
                    var key = [a, b].sort().join('|||');
                    matchLookup[key] = mx;
                    allMatchDetails.push({ p1: a, p2: b, match: mx });
                });

                // Helper: extract athlete names from team roster string
                // Format: "张禹珍，安宰贤，林钟勋，朴康贤，李尚�? or "张三,李四"
                function extractTeamRoster(str) {
                    if (!str) return null;
                    var parts = null;
                    if (str.indexOf('�?) >= 0) parts = str.split('�?);
                    else if (str.indexOf(',') >= 0) parts = str.split(',');
                    if (!parts || parts.length < 2) return null;
                    var result = [];
                    for (var ei = 0; ei < parts.length; ei++) {
                        var name = parts[ei].trim();
                        if (name) result.push(name);
                    }
                    return result.length > 0 ? result : null;
                }

                // Aggregate all athletes per country across ALL group matches
                var countryAthletes = {};
                if (isTeamGroup) {
                    roundMatches.forEach(function(mx){
                        // Primary: parse teamScores sub-match data
                        if (mx.teamScores) {
                            try {
                                var ts = JSON.parse(mx.teamScores);
                                ts.forEach(function(sub){
                                    if (sub.p1 && sub.p1Country) {
                                        if (!countryAthletes[sub.p1Country]) countryAthletes[sub.p1Country] = [];
                                        if (countryAthletes[sub.p1Country].indexOf(sub.p1) < 0) countryAthletes[sub.p1Country].push(sub.p1);
                                    }
                                    if (sub.p2 && sub.p2Country) {
                                        if (!countryAthletes[sub.p2Country]) countryAthletes[sub.p2Country] = [];
                                        if (countryAthletes[sub.p2Country].indexOf(sub.p2) < 0) countryAthletes[sub.p2Country].push(sub.p2);
                                    }
                                });
                            } catch(e) {}
                        }
                        // Fallback: try to extract roster from player1Name/player2Name
                        var c1 = mx.player1Country ? mx.player1Country.trim() : '';
                        var c2 = mx.player2Country ? mx.player2Country.trim() : '';
                        var r1 = extractTeamRoster(mx.player1Name);
                        var r2 = extractTeamRoster(mx.player2Name);
                        if (r1 && c1) {
                            if (!countryAthletes[c1]) countryAthletes[c1] = [];
                            r1.forEach(function(n){ if (countryAthletes[c1].indexOf(n) < 0) countryAthletes[c1].push(n); });
                        }
                        if (r2 && c2) {
                            if (!countryAthletes[c2]) countryAthletes[c2] = [];
                            r2.forEach(function(n){ if (countryAthletes[c2].indexOf(n) < 0) countryAthletes[c2].push(n); });
                        }
                    });
                }

                function gmDisplay(p){
                    return isTeamGroup ? (getFlagForMatch(p) + p) : p;
                }

                var matrixHtml = '<div class="group-matrix-wrap"><table class="group-matrix"><thead><tr>';
                matrixHtml += '<th class="gm-corner"></th>';
                participants.forEach(function(p){
                    matrixHtml += '<th>' + gmDisplay(p) + '</th>';
                });
                matrixHtml += '</tr></thead><tbody>';

                participants.forEach(function(p1, i){
                    matrixHtml += '<tr>';
                    matrixHtml += '<td class="gm-side">' + gmDisplay(p1) + '</td>';
                    participants.forEach(function(p2, j){
                        if (i === j) {
                            matrixHtml += '<td class="gm-cell gm-cell--empty">-</td>';
                        } else {
                            var key = [p1, p2].sort().join('|||');
                            var match = matchLookup[key];
                            if (match) {
                                var mp1Total = 0, mp2Total = 0;
                                try { if (match.scores) { var ms = JSON.parse(match.scores); ms.forEach(function(s){ if (s.p1 > s.p2) mp1Total++; else if (s.p2 > s.p1) mp2Total++; }); } } catch(e) {}
                                if (mp1Total === 0 && mp2Total === 0 && match.teamScores && match.player1Total != null) {
                                    mp1Total = match.player1Total; mp2Total = match.player2Total;
                                }
                                // Determine which participant in this cell maps to the row/column
                                // For cell (i,j): row player = p1, col player = p2
                                // We need to check if the match's actual p1 equals the row's p1
                                var actualP1 = isTeamGroup ? (match.player1Country||'') : (match.player1Name||'');
                                var actualP2 = isTeamGroup ? (match.player2Country||'') : (match.player2Name||'');
                                // Scores from row's perspective: rowScore:colScore
                                var displayScore;
                                if (actualP1 === p1) { displayScore = mp1Total + ':' + mp2Total; }
                                else { displayScore = mp2Total + ':' + mp1Total; }
                                var bigScore = (mp1Total > 0 || mp2Total > 0)
                                    ? '<div style="font-size:17px;font-weight:800;letter-spacing:0.5px;color:#2e7d32;">' + displayScore + '</div>'
                                    : '<div style="color:#bbb;font-size:11px;padding:4px 0;">未赛</div>';
                                matrixHtml += '<td class="gm-cell">' + bigScore + '</td>';
                            } else {
                                matrixHtml += '<td class="gm-cell gm-cell--empty">-</td>';
                            }
                        }
                    });
                    matrixHtml += '</tr>';
                });
                matrixHtml += '</tbody></table></div>';

                // Global detail toggle button + hidden detail area
                var groupDetailId = 'gmAll_' + (globalDetailIdx++);
                // Build all matches detail HTML
                var allDetailHtml = '';
                allMatchDetails.forEach(function(item, idx){
                    var mx = item.match;
                    var mp1D = item.p1.trim(), mp2D = item.p2.trim();
                    var mp1Total = 0, mp2Total = 0;
                    try { if (mx.scores) { var ms = JSON.parse(mx.scores); ms.forEach(function(s){ if (s.p1 > s.p2) mp1Total++; else if (s.p2 > s.p1) mp2Total++; }); } } catch(e) {}
                    if (mp1Total === 0 && mp2Total === 0 && mx.teamScores && mx.player1Total != null) { mp1Total = mx.player1Total; mp2Total = mx.player2Total; }
                    var detailHtml = buildGroupDetailContent(mx);
                    // For team groups: if no detail scores, generate fallback matchups from athlete lists
                    if (isTeamGroup && (!detailHtml || detailHtml.indexOf('暂无比分') >= 0)) {
                        var t1 = countryAthletes[mp1D] || [];
                        var t2 = countryAthletes[mp2D] || [];
                        // Debug: check if player1Name has roster data
                        if (t1.length === 0 && t2.length === 0) {
                            console.log('No countryAthletes for', mp1D, mp2D, 'player1Name=', mx.player1Name, 'player2Name=', mx.player2Name, 'teamScores=', mx.teamScores);
                        }
                        if (t1.length > 0 || t2.length > 0) {
                            var fbHtml = '';
                            var maxLen = Math.max(t1.length, t2.length);
                            for (var fi = 0; fi < maxLen; fi++) {
                                var fp1 = t1[fi] || '待定';
                                var fp2 = t2[fi] || '待定';
                                fbHtml += '<div style="border-top:1px solid #eee;padding:6px 0;">' +
                                    '<div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#444;margin-bottom:4px;">' +
                                    '<span style="color:#333;">' + (mp1D ? getFlagForMatch(mp1D) : '') + fp1 + '</span>' +
                                    '<span style="color:#999;font-weight:400;">vs</span>' +
                                    '<span style="color:#333;">' + (mp2D ? getFlagForMatch(mp2D) : '') + fp2 + '</span></div></div>';
                            }
                            detailHtml = fbHtml;
                        }
                    }
                    var bigScoreStr = (mp1Total > 0 || mp2Total > 0) ? mp1Total + ':' + mp2Total : '-';
                    var p1Won = mp1Total > mp2Total;
                    var mcVenueInfo = mx.venue ? '🏟�?' + mx.venue : '';
                    var mcDateStr = mx.matchDate ? new Date(mx.matchDate).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
                    var mp1Display = isTeamGroup ? (getFlagForMatch(mp1D) + mp1D) : (mx.player1Country ? getFlagForMatch(mx.player1Country) : '') + mp1D;
                    var mp2Display = isTeamGroup ? (getFlagForMatch(mp2D) + mp2D) : (mx.player2Country ? getFlagForMatch(mx.player2Country) : '') + mp2D;
                    // For team groups, append athlete names from aggregate
                    if (isTeamGroup) {
                        var t1List = countryAthletes[mp1D];
                        var t2List = countryAthletes[mp2D];
                        if (t1List && t1List.length > 0) mp1Display += ' (' + t1List.join(', ') + ')';
                        if (t2List && t2List.length > 0) mp2Display += ' (' + t2List.join(', ') + ')';
                    }
                    // Format scores grid with big score (same as elimination)
                    var scScoresGrid = '';
                    var hasTeams = detailHtml.indexOf('border-top:1px') >= 0;
                    var hasSingles = detailHtml.indexOf('match-scores-grid') >= 0;
                    if (hasSingles || hasTeams) {
                        if (hasTeams) {
                            // Team sub-matches layout: wrap in flex container
                            scScoresGrid = '<div style="display:flex;align-items:stretch;gap:10px;">' +
                                '<div style="flex:1;min-width:0;padding:4px 0;">' + detailHtml + '</div>' +
                                '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;margin-left:auto;">' +
                                '<span class="gm-bigscore gm-bigscore--win">' + bigScoreStr + '</span></div></div>';
                        } else {
                            // Singles/doubles
                            scScoresGrid = '<div style="display:flex;align-items:stretch;gap:10px;">' +
                                detailHtml +
                                '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;margin-left:auto;">' +
                                '<span class="gm-bigscore gm-bigscore--win">' + bigScoreStr + '</span></div></div>';
                        }
                    } else {
                        // No scores
                        scScoresGrid = detailHtml;
                    }
                    allDetailHtml += '<div class="match-card">' +
                        '<div class="match-card-top">' +
                            '<span class="match-card-venue">' + mcVenueInfo + '</span>' +
                        '</div>' +
                        '<div class="match-card-body">' +
                            '<div class="match-player-row">' +
                                '<span class="match-player-name ' + (p1Won ? 'match-player-name--win' : '') + '">' + mp1Display + '</span>' +
                                '<div style="display:flex;align-items:center;gap:10px;margin-left:auto;">' +
                                    '<div class="match-card-actions">' +
                                        '<button class="btn btn-warning btn-sm" onclick="event.stopPropagation();editMatch(' + mx.id + ')">编辑</button>' +
                                        '<button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteMatch(' + mx.id + ')">删除</button>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            scScoresGrid +
                            '<div class="match-player-row">' +
                                '<span class="match-player-name ' + (!p1Won ? 'match-player-name--win' : '') + '">' + mp2Display + '</span>' +
                                (mcDateStr ? '<span class="match-player-time" style="margin-left:auto;">' + mcDateStr + '</span>' : '') +
                            '</div>' +
                        '</div>' +
                    '</div>';
                });
                matrixHtml += '<div style="margin-top:2px;text-align:center;">' +
                        '<button class="gm-detail-toggle" onclick="toggleGroupAllDetail(\'' + groupDetailId + '\',this)">📋 查看所有对局详细比分</button>' +
                        '</div>' +
                        '<div id="' + groupDetailId + '" class="gm-detail-area">' + (allDetailHtml || '<div style="padding:16px;text-align:center;color:#999;font-size:13px;">暂无详细比分数据</div>') + '</div>';
                contentHtml += matrixHtml;
            } else {
                // --- 非小组赛：原有卡片样�?---
                roundMatches.forEach(function(m) {
                let scores = [];
                let p1Total = 0, p2Total = 0;
                try { if (m.scores) { scores = JSON.parse(m.scores); scores.forEach(s => { if (s.p1 > s.p2) p1Total++; else if (s.p2 > s.p1) p2Total++; }); } } catch (e) { }
                // 团体赛但没有scores时使用存储的player1Total/player2Total
                if (p1Total === 0 && p2Total === 0 && m.teamScores && m.player1Total != null) {
                    p1Total = m.player1Total;
                    p2Total = m.player2Total;
                }
                const p1Name = m.player1Name || '-';
                const p2Name = m.player2Name || '-';
                const p1Country = m.player1Country || '';
                const p2Country = m.player2Country || '';
                const p1Won = p1Total > p2Total && p1Total > 0;
                const p2Won = p2Total > p1Total && p2Total > 0;
                const isTeamMatch = m.category && m.category.includes('�?);
                const isDoublesMatch = m.category === '男双' || m.category === '女双' || m.category === '混双';
                const maxLen = isDoublesMatch ? 15 : (isTeamMatch ? 20 : 999);
                const p1DisplayName = (maxLen < 999 && p1Name.length > maxLen ? p1Name.substring(0, maxLen) + '...' : p1Name) || '-';
                const p2DisplayName = (maxLen < 999 && p2Name.length > maxLen ? p2Name.substring(0, maxLen) + '...' : p2Name) || '-';
                const p1Title = `title="${p1Name}"`;
                const p2Title = `title="${p2Name}"`;
                const p1FlagHtml = getFlagForMatch(p1Country);
                const p2FlagHtml = getFlagForMatch(p2Country);
                const matchDateStr = m.matchDate ? new Date(m.matchDate).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
                const venueInfo = m.venue || '-';
                const statusMap = { scheduled: '已安�?, ongoing: '进行�?, completed: '已完�?, cancelled: '已取�? };
                const isCompleted = m.status === 'completed';

                // Big score
                const bigScore = (p1Total > 0 || p2Total > 0)
                    ? `<span class="match-card-bigscore">${p1Total}:${p2Total}</span>`
                    : '';

                // Two-row scores (each game: p1 score on p1 row, p2 score on p2 row)
                // Big score and time on the far right, parallel to detailed scores
                let scoresGridHtml = '';
                if (!isTeamMatch) {
                    const validScores = scores.filter(s => !(s.p1 === 0 && s.p2 === 0));
                    if (validScores.length > 0) {
                        let p1RowHtml = '';
                        let p2RowHtml = '';
                        validScores.forEach(s => {
                            const p1Win = s.p1 > s.p2;
                            p1RowHtml += `<span class="match-score-item ${p1Win ? 'match-score-item--win' : 'match-score-item--lose'}">${s.p1}</span>`;
                            p2RowHtml += `<span class="match-score-item ${!p1Win ? 'match-score-item--win' : 'match-score-item--lose'}">${s.p2}</span>`;
                        });
                        scoresGridHtml = `
                            <div class="match-scores-grid">
                                <div class="match-scores-row">${p1RowHtml}</div>
                                <div class="match-scores-row">${p2RowHtml}</div>
                            </div>
                            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;margin-left:auto;">
                                ${bigScore}
                            </div>
                        `;
                        // Wrap in a flex container with same gap as other rows
                        scoresGridHtml = `<div style="display:flex;align-items:stretch;gap:10px;">${scoresGridHtml}</div>`;
                    }
                } else if (!m.teamScores) {
                    // Team match without sub-match data: show big score only (backward compatible)
                    scoresGridHtml = `
                        <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:4px 0;">
                            ${bigScore}
                        </div>
                    `;
                } else {
                    // Team match with sub-match data
                    try {
                        const teamScores = JSON.parse(m.teamScores);
                        let subHtml = '';
                        teamScores.forEach((sub, si) => {
                            const subP1Won = sub.p1Total > sub.p2Total;
                            // 去掉尾部连续�?0:0（后面没打的局不展示）
                            const rawScores = sub.scores || [];
                            let lastNonZero = rawScores.length - 1;
                            while (lastNonZero >= 0 && rawScores[lastNonZero].p1 === 0 && rawScores[lastNonZero].p2 === 0) lastNonZero--;
                            const subScores = rawScores.slice(0, lastNonZero + 1);
                            // 如果两名选手都为空，跳过整场（如 5 场只打了 3 场）
                            if (!sub.p1 && !sub.p2) return;
                            let subScoresHtml = '';
                            if (subScores.length > 0) {
                                let subP1Row = '', subP2Row = '';
                                subScores.forEach(s => {
                                    const win = s.p1 > s.p2;
                                    subP1Row += `<span class="match-score-item ${win ? 'match-score-item--win' : 'match-score-item--lose'}">${s.p1}</span>`;
                                    subP2Row += `<span class="match-score-item ${!win ? 'match-score-item--win' : 'match-score-item--lose'}">${s.p2}</span>`;
                                });
                                subScoresHtml = `
                                    <div class="match-scores-grid" style="margin-top:4px;">
                                        <div class="match-scores-row">${subP1Row}</div>
                                        <div class="match-scores-row">${subP2Row}</div>
                                    </div>
                                `;
                            }
                            const subResult = `<span style="color:#d4a017;font-weight:700;font-size:13px;">${sub.p1Total}:${sub.p2Total}</span>`;
                            const p1Flag = sub.p1Country ? getFlagForMatch(sub.p1Country) : '';
                            const p2Flag = sub.p2Country ? getFlagForMatch(sub.p2Country) : '';
                            subHtml += `
                                <div style="border-top:1px solid #eee;padding:6px 0;${si === 0 ? 'border-top:none;' : ''}">
                                    <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#444;margin-bottom:4px;">
                                        <span style="${subP1Won ? 'color:#2e7d32;' : 'color:#333;'}">${p1Flag}${sub.p1 || '?'}</span>
                                        <span style="color:#999;font-weight:400;">vs</span>
                                        <span style="${!subP1Won ? 'color:#2e7d32;' : 'color:#333;'}">${p2Flag}${sub.p2 || '?'}</span>
                                        <span style="margin-left:auto;">${subResult}</span>
                                    </div>
                                    ${subScoresHtml ? `<div style="padding-left:4px;">${subScoresHtml}</div>` : ''}
                                </div>
                            `;
                        });
                        scoresGridHtml = `
                            <div style="flex:1;min-width:0;padding:4px 0;">${subHtml}</div>
                            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;margin-left:auto;">
                                ${bigScore}
                            </div>
                        `;
                        scoresGridHtml = `<div style="display:flex;align-items:stretch;gap:10px;">${scoresGridHtml}</div>`;
                    } catch (e) {
                        // Fallback: show big score only
                        scoresGridHtml = `
                            <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:4px 0;">
                                ${bigScore}
                            </div>
                        `;
                    }
                }

                // Status badge (hidden for completed)
                const statusBadge = isCompleted ? '' : `<span class="match-status-badge match-status--${m.status}">${statusMap[m.status] || m.status}</span>`;

                contentHtml += `
                    <div class="match-card" ondblclick="editMatch(${m.id})">
                        <div class="match-card-top">
                            <span class="match-card-venue">🏟�?${venueInfo}</span>
                            ${statusBadge}
                        </div>
                        <div class="match-card-body">
                            <div class="match-player-row">
                                <span class="match-player-name ${p1Won ? 'match-player-name--win' : ''}" ${p1Title}>${p1FlagHtml}${p1DisplayName}</span>
                                <div style="display:flex;align-items:center;gap:10px;margin-left:auto;">
                                    <div class="match-card-actions">
                                        <button class="btn btn-warning btn-sm" onclick="event.stopPropagation();editMatch(${m.id})">编辑</button>
                                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteMatch(${m.id})">删除</button>
                                    </div>
                                </div>
                            </div>
                            ${scoresGridHtml}
                            <div class="match-player-row">
                                <span class="match-player-name ${p2Won ? 'match-player-name--win' : ''}" ${p2Title}>${p2FlagHtml}${p2DisplayName}</span>
                                ${matchDateStr ? `<span class="match-player-time" style="margin-left:auto;">${matchDateStr}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                }); // end roundMatches.forEach (non-group)
            } // end if/else isGroup
            contentHtml += `</div>`;
        });
        contentHtml += `</div></div>`;
    });

    container.innerHTML = tabsHtml + contentHtml;
    applyDetailPhaseFilter();
}

/** Helper: build detailed scores HTML for group detail area. */
function buildGroupDetailContent(match) {
    var detailHtml = '';
    var isTeamMatch = match.category && match.category.indexOf('�?) >= 0;

    if (!isTeamMatch) {
        var scores = [];
        try { if (match.scores) scores = JSON.parse(match.scores); } catch(e) {}
        if (!scores || scores.length === 0) return '<span style="color:#999;font-size:11px;">暂无比分</span>';
        scores = scores.filter(function(s){ return !(s.p1 === 0 && s.p2 === 0); });
        if (scores.length === 0) return '<span style="color:#999;font-size:11px;">暂无比分</span>';

        var p1Row = '', p2Row = '';
        scores.forEach(function(s){
            var p1Win = s.p1 > s.p2;
            p1Row += '<span class="match-score-item ' + (p1Win ? 'match-score-item--win' : 'match-score-item--lose') + '">' + s.p1 + '</span>';
            p2Row += '<span class="match-score-item ' + (!p1Win ? 'match-score-item--win' : 'match-score-item--lose') + '">' + s.p2 + '</span>';
        });
        detailHtml = '<div class="match-scores-grid"><div class="match-scores-row">' + p1Row + '</div><div class="match-scores-row">' + p2Row + '</div></div>';
    } else if (match.teamScores) {
        try {
            var teamScores = JSON.parse(match.teamScores);
            var subHtml = '';
            teamScores.forEach(function(sub, si){
                if (!sub.p1 && !sub.p2) return;
                var subP1Won = sub.p1Total > sub.p2Total;
                var rawScores = sub.scores || [];
                var lastNonZero = rawScores.length - 1;
                while (lastNonZero >= 0 && rawScores[lastNonZero].p1 === 0 && rawScores[lastNonZero].p2 === 0) lastNonZero--;
                var subScores = rawScores.slice(0, lastNonZero + 1);
                var subScoresHtml = '';
                if (subScores.length > 0) {
                    var sP1Row = '', sP2Row = '';
                    subScores.forEach(function(s){
                        var win = s.p1 > s.p2;
                        sP1Row += '<span class="match-score-item ' + (win ? 'match-score-item--win' : 'match-score-item--lose') + '">' + s.p1 + '</span>';
                        sP2Row += '<span class="match-score-item ' + (!win ? 'match-score-item--win' : 'match-score-item--lose') + '">' + s.p2 + '</span>';
                    });
                    subScoresHtml = '<div class="match-scores-grid" style="margin-top:4px;"><div class="match-scores-row">' + sP1Row + '</div><div class="match-scores-row">' + sP2Row + '</div></div>';
                }
                var subResult = (sub.p1Total > 0 || sub.p2Total > 0)
                    ? '<span style="color:#d4a017;font-weight:700;font-size:13px;">' + sub.p1Total + ':' + sub.p2Total + '</span>'
                    : '';
                var p1Flag = sub.p1Country ? getFlagForMatch(sub.p1Country) : '';
                var p2Flag = sub.p2Country ? getFlagForMatch(sub.p2Country) : '';
                subHtml += '<div style="border-top:1px solid #eee;padding:6px 0;' + (si === 0 ? 'border-top:none;' : '') + '">' +
                    '<div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#444;margin-bottom:4px;">' +
                    '<span style="' + (subP1Won ? 'color:#2e7d32;' : 'color:#333;') + '">' + p1Flag + (sub.p1||'?') + '</span>' +
                    '<span style="color:#999;font-weight:400;">vs</span>' +
                    '<span style="' + (!subP1Won ? 'color:#2e7d32;' : 'color:#333;') + '">' + p2Flag + (sub.p2||'?') + '</span>' +
                    '<span style="margin-left:auto;">' + subResult + '</span></div>' +
                    (subScoresHtml ? '<div style="padding-left:4px;">' + subScoresHtml + '</div>' : '') + '</div>';
            });
            detailHtml = subHtml;
        } catch(e) {
            detailHtml = '<span style="color:#999;font-size:11px;">暂无比分</span>';
        }
    } else {
        detailHtml = '<span style="color:#999;font-size:11px;">暂无比分</span>';
    }
    return detailHtml;
}

/** Toggle global group detail area. */
function toggleGroupAllDetail(detailId, btn) {
    var el = document.getElementById(detailId);
    if (!el) return;
    el.classList.toggle('open');
    btn.classList.toggle('active');
    btn.innerHTML = el.classList.contains('open') ? '📋 收起所有详细比�? : '📋 查看所有对局详细比分';
}

// Phase tabs for detail rounds: group/qualify/elim
let currentDetailPhase = 'elim';

function switchDetailPhase(phase, btn) {
    currentDetailPhase = phase;
    document.querySelectorAll('.detail-phase-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyDetailPhaseFilter();
}

function applyDetailPhaseFilter() {
    document.querySelectorAll('.round-section').forEach(el => {
        el.style.display = el.dataset.phase === currentDetailPhase ? '' : 'none';
    });
}

function switchDetailCategory(cat, btn) {
    currentDetailCategory = cat;
    document.querySelectorAll('.detail-category-content').forEach(el => el.style.display = 'none');
    var catEl = document.getElementById('detail-cat-' + cat);
    if (catEl) catEl.style.display = 'block';
    document.querySelectorAll('.bracket-toggle-btns .bracket-category-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyDetailPhaseFilter();
}

// ========== 对阵图视图切�?==========

// ========== ����ͼ��ͼ�л� ==========
let currentMatchView = 'table';
let currentBracketCategory = '';
let currentBracketPhase = 'main';
let currentMatchView = 'table';
let currentBracketCategory = '';
let currentBracketPhase = 'main'; // 'qualify' or 'main'

function switchMatchView(view) {
    currentMatchView = view;
    document.getElementById('btn-view-table').classList.toggle('active', view === 'table');
    document.getElementById('btn-view-bracket').classList.toggle('active', view === 'bracket');
    document.getElementById('detail-rounds-content').style.display = view === 'table' ? 'block' : 'none';
    document.getElementById('bracket-view').style.display = view === 'bracket' ? 'block' : 'none';

    if (view === 'bracket' && currentCompetitionMatches && currentCompetitionMatches.length > 0) {
        initBracketView(currentCompetitionMatches);
    }
}

function initBracketView(matches) {
    const categories = ['u11男单', 'u11女单', 'u13男单', 'u13女单', 'u15男单', 'u15女单', 'u15男双', 'u15女双', 'u15混双', 'u15男团', 'u15女团', 'u17男单', 'u17女单', 'u17男双', 'u17女双', 'u17混双', 'u19男单', 'u19女单', 'u19男双', 'u19女双', 'u19混双', 'u19男团', 'u19女团', '男单', '女单', '男双', '女双', '混双', '男团', '女团'];
    const categoryMatches = {};
    matches.forEach(m => {
        const cat = m.category || '其他';
        if (!categoryMatches[cat]) categoryMatches[cat] = [];
        categoryMatches[cat].push(m);
    });

    const availableCategories = categories.filter(cat => categoryMatches[cat] && categoryMatches[cat].length > 0);

    if (availableCategories.length === 0) {
        document.getElementById('bracket-container').innerHTML = '<div class="bracket-no-data">暂无淘汰赛数�?/div>';
        document.getElementById('bracket-categories').innerHTML = '';
        document.getElementById('bracket-phases').innerHTML = '';
        return;
    }

    if (!currentBracketCategory || !availableCategories.includes(currentBracketCategory)) {
        currentBracketCategory = availableCategories[0];
    }

    // Render phase tabs
    let phaseHtml = '';
    var hasQualify = categoryMatches[currentBracketCategory] && categoryMatches[currentBracketCategory].some(function(m){ return String(m.roundNumber||'').includes('资格'); });
    if (!hasQualify && currentBracketPhase === 'qualify') currentBracketPhase = 'main';
    phaseHtml += '<button class="bracket-category-tab ' + (currentBracketPhase === 'main' ? 'active' : '') + '" onclick="selectBracketPhase(\'main\')">正赛</button>';
    phaseHtml += '<button class="bracket-category-tab ' + (currentBracketPhase === 'qualify' ? 'active' : '') + '" onclick="selectBracketPhase(\'qualify\')" style="' + (!hasQualify ? 'display:none;' : '') + '">资格�?/button>';
    document.getElementById('bracket-phases').innerHTML = phaseHtml;

    // Render category tabs
    let tabsHtml = '';
    availableCategories.forEach(cat => {
        tabsHtml += `<button class="bracket-category-tab ${cat === currentBracketCategory ? 'active' : ''}" onclick="selectBracketCategory('${cat}')">${cat}</button>`;
    });
    document.getElementById('bracket-categories').innerHTML = tabsHtml;

    renderBracket(categoryMatches[currentBracketCategory], currentBracketCategory);
}

function selectBracketCategory(category) {
    currentBracketCategory = category;
    document.querySelectorAll('#bracket-categories .bracket-category-tab').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === category);
    });
    const categories = ['u11男单', 'u11女单', 'u13男单', 'u13女单', 'u15男单', 'u15女单', 'u15男双', 'u15女双', 'u15混双', 'u15男团', 'u15女团', 'u17男单', 'u17女单', 'u17男双', 'u17女双', 'u17混双', 'u19男单', 'u19女单', 'u19男双', 'u19女双', 'u19混双', 'u19男团', 'u19女团', '男单', '女单', '男双', '女双', '混双', '男团', '女团'];
    const categoryMatches = {};
    currentCompetitionMatches.forEach(m => {
        const cat = m.category || '其他';
        if (!categoryMatches[cat]) categoryMatches[cat] = [];
        categoryMatches[cat].push(m);
    });
    // Update phase tab visibility for new category
    var hasQualify = categoryMatches[category] && categoryMatches[category].some(function(m){ return String(m.roundNumber||'').includes('资格'); });
    var qualBtn = document.querySelector('#bracket-phases .bracket-category-tab:last-child');
    if (qualBtn) qualBtn.style.display = hasQualify ? '' : 'none';
    if (!hasQualify && currentBracketPhase === 'qualify') {
        currentBracketPhase = 'main';
        document.querySelectorAll('#bracket-phases .bracket-category-tab').forEach(function(btn){
            btn.classList.toggle('active', btn.textContent === '正赛');
        });
    }
    renderBracket(categoryMatches[category], category);
}

function selectBracketPhase(phase) {
    currentBracketPhase = phase;
    document.querySelectorAll('#bracket-phases .bracket-category-tab').forEach(function(btn){
        var isActive = btn.textContent === (phase === 'main' ? '正赛' : '资格�?);
        btn.classList.toggle('active', isActive);
    });
    const categories = ['u11男单', 'u11女单', 'u13男单', 'u13女单', 'u15男单', 'u15女单', 'u15男双', 'u15女双', 'u15混双', 'u15男团', 'u15女团', 'u17男单', 'u17女单', 'u17男双', 'u17女双', 'u17混双', 'u19男单', 'u19女单', 'u19男双', 'u19女双', 'u19混双', 'u19男团', 'u19女团', '男单', '女单', '男双', '女双', '混双', '男团', '女团'];
    const categoryMatches = {};
    currentCompetitionMatches.forEach(m => {
        const cat = m.category || '其他';
        if (!categoryMatches[cat]) categoryMatches[cat] = [];
        categoryMatches[cat].push(m);
    });
    renderBracket(categoryMatches[currentBracketCategory], currentBracketCategory);
}

function renderBracket(matches, category) {
    if (!matches || matches.length === 0) {
        document.getElementById('bracket-container').innerHTML = '<div class="bracket-no-data">暂无比赛数据</div>';
        return;
    }

    const isTeamCategory = category && category.includes('�?);
    const eliminationRounds = matches.filter(m => {
        const rn = String(m.roundNumber || '');
        if (!rn || rn.trim() === '') return currentBracketPhase === 'main';
        if (rn.includes('小组')) return false;
        if (rn.includes('�?)) return false;
        var isQualify = rn.includes('资格');
        if (currentBracketPhase === 'qualify') return isQualify;
        return !isQualify;
    });

    if (eliminationRounds.length === 0) {
        document.getElementById('bracket-container').innerHTML = '<div class="bracket-no-data">暂无淘汰赛数�?/div>';
        return;
    }

    const roundOrder = ['资格赛决�?, '资格�?, '1/128', '1/64', '1/32', '1/16', '1/8', '1/4', '四分之一', '半决', '半决�?];
    eliminationRounds.sort((a, b) => {
        const ra = String(a.roundNumber || '');
        const rb = String(b.roundNumber || '');
        const isBronzeA = ra.includes('�?);
        const isBronzeB = rb.includes('�?);
        const isFinalA = ra.includes('�?);
        const isFinalB = rb.includes('�?);
        if (isBronzeA && isFinalB) return 1;
        if (isBronzeB && isFinalA) return -1;
        const ia = roundOrder.findIndex(r => ra.includes(r));
        const ib = roundOrder.findIndex(r => rb.includes(r));
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return ra.localeCompare(rb);
    });

    const rounds = {};
    eliminationRounds.forEach(m => {
        let rn = m.roundNumber || '其他';
        if (rn.includes('�?)) rn = '决赛';
        if (!rounds[rn]) rounds[rn] = [];
        rounds[rn].push(m);
    });

    Object.keys(rounds).forEach(key => {
        rounds[key].sort((a, b) => (a.id || 0) - (b.id || 0));
    });

    const sortedRoundKeys = Object.keys(rounds).sort((a, b) => {
        const isBronzeA = a.includes('�?);
        const isBronzeB = b.includes('�?);
        const isFinalA = a.includes('�?);
        const isFinalB = b.includes('�?);
        if (isBronzeA && isFinalB) return 1;
        if (isBronzeB && isFinalA) return -1;
        const ia = roundOrder.findIndex(r => a.includes(r));
        const ib = roundOrder.findIndex(r => b.includes(r));
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b, 'zh');
    });

    console.log('=== 原始数据 ===');
    sortedRoundKeys.forEach(key => {
        console.log(`轮次 ${key} (${rounds[key].length}�?:`, rounds[key].map(m => `${m.id}:${m.player1Name} vs ${m.player2Name}`).join(', '));
    });

    // 按ID排序
    Object.keys(rounds).forEach(key => {
        rounds[key].sort((a, b) => (a.id || 0) - (b.id || 0));
    });

    function nameEq(n1, n2) {
        if (!n1 || !n2) return false;
        const a = String(n1).replace(/[·.]/g, '.').replace(/[�?Ｚａ-ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).trim();
        const b = String(n2).replace(/[·.]/g, '.').replace(/[�?Ｚａ-ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).trim();
        return a === b || a.includes(b) || b.includes(a);
    }

    // 对所有轮次从后向前重�?
    for (let roundIdx = sortedRoundKeys.length - 1; roundIdx > 0; roundIdx--) {
        const currKey = sortedRoundKeys[roundIdx];
        const prevKey = sortedRoundKeys[roundIdx - 1];
        const currMatches = rounds[currKey];
        const prevMatches = rounds[prevKey];

        if (!currMatches || !prevMatches || currMatches.length < 1) continue;

        const newOrder = [];
        const used = new Set();

        for (let i = 0; i < currMatches.length; i++) {
            const p1 = currMatches[i].player1Name;
            const p2 = currMatches[i].player2Name;

            const matched = [];
            for (let k = 0; k < prevMatches.length; k++) {
                if (used.has(k)) continue;
                const m = prevMatches[k];
                if (nameEq(m.player1Name, p1) || nameEq(m.player2Name, p1) ||
                    nameEq(m.player1Name, p2) || nameEq(m.player2Name, p2)) {
                    matched.push({ m, k });
                }
            }

            if (matched.length >= 2) {
                newOrder.push(matched[0].m);
                newOrder.push(matched[1].m);
                used.add(matched[0].k);
                used.add(matched[1].k);
            } else if (matched.length === 1) {
                newOrder.push(matched[0].m);
                used.add(matched[0].k);
            }
        }

        for (let k = 0; k < prevMatches.length; k++) {
            if (!used.has(k)) newOrder.push(prevMatches[k]);
        }

        rounds[prevKey] = newOrder;
    }

    // 其他轮次按正常逻辑重排
    for (let i = sortedRoundKeys.length - 2; i >= 0; i--) {
        const currKey = sortedRoundKeys[i];
        const nextKey = sortedRoundKeys[i + 1];

        if (currKey.includes('1/32')) continue;

        const currMatches = rounds[currKey];
        const nextMatches = rounds[nextKey];

        if (!currMatches || !nextMatches || currMatches.length < 2) continue;

        const newOrder = [];
        const used = new Set();

        for (let j = 0; j < nextMatches.length; j++) {
            const nextMatch = nextMatches[j];
            const p1 = nextMatch.player1Name;
            const p2 = nextMatch.player2Name;

            const matched = [];
            for (let k = 0; k < currMatches.length; k++) {
                if (used.has(k)) continue;
                const m = currMatches[k];
                if (nameEq(m.player1Name, p1) || nameEq(m.player2Name, p1) ||
                    nameEq(m.player1Name, p2) || nameEq(m.player2Name, p2)) {
                    matched.push({ m, k });
                }
            }

            if (matched.length >= 2) {
                newOrder.push(matched[0].m);
                newOrder.push(matched[1].m);
                used.add(matched[0].k);
                used.add(matched[1].k);
            }
        }

        for (let k = 0; k < currMatches.length; k++) {
            if (!used.has(k)) newOrder.push(currMatches[k]);
        }

        rounds[currKey] = newOrder;
    }

    console.log('=== 重排后数�?===');

    const sortedRoundKeysFinal = Object.keys(rounds).sort((a, b) => {
        const isBronzeA = a.includes('�?);
        const isBronzeB = b.includes('�?);
        const isFinalA = a.includes('�?);
        const isFinalB = b.includes('�?);
        if (isBronzeA && isFinalB) return 1;
        if (isBronzeB && isFinalA) return -1;
        const ia = roundOrder.findIndex(r => a.includes(r));
        const ib = roundOrder.findIndex(r => b.includes(r));
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b, 'zh');
    });

    const roundCount = sortedRoundKeysFinal.length;
    const matchBoxWidth = 150;
    const matchBoxHeight = 45;
    const roundGap = 80;
    const padding = 30;
    const headerHeight = 30;
    const baseSpacing = 60;

    const maxMatches = rounds[sortedRoundKeysFinal[0]].length;
    const svgHeight = padding * 2 + headerHeight + maxMatches * baseSpacing + 30;
    const svgWidth = padding * 2 + roundCount * (matchBoxWidth + roundGap);

    const roundPositions = {};

    for (let roundIdx = 0; roundIdx < roundCount; roundIdx++) {
        const key = sortedRoundKeysFinal[roundIdx];
        const roundMatches = rounds[key];
        const matchesInRound = roundMatches.length;
        const unit = maxMatches / matchesInRound;

        roundPositions[key] = [];
        roundMatches.forEach((m, matchIdx) => {
            const unitHeight = maxMatches * baseSpacing / matchesInRound;
            const y = padding + headerHeight + matchIdx * unitHeight + (unitHeight - matchBoxHeight) / 2;

            roundPositions[key].push({
                match: m,
                x: padding + roundIdx * (matchBoxWidth + roundGap),
                y: y
            });
        });
    }

    let svg = `<svg class="bracket-svg" width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;

    svg += `<text x="${svgWidth / 2}" y="18" text-anchor="middle" class="bracket-round-label" style="font-size:13px;font-weight:700;">${category}</text>`;

    sortedRoundKeysFinal.forEach((key, roundIdx) => {
        const roundLabel = key;
        const roundX = padding + roundIdx * (matchBoxWidth + roundGap) + matchBoxWidth / 2;
        svg += `<text x="${roundX}" y="${headerHeight - 2}" text-anchor="middle" class="bracket-round-label" style="font-size:9px;font-weight:600;fill:#0077b6;">${roundLabel}</text>`;
    });

    function namesMatchForLine(name1, name2) {
        if (!name1 || !name2) return false;
        const n1 = String(name1).replace(/[·.]/g, '.').replace(/[�?Ｚａ-ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/\s+/g, '').trim();
        const n2 = String(name2).replace(/[·.]/g, '.').replace(/[�?Ｚａ-ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/\s+/g, '').trim();
        return n1 === n2 || n1.includes(n2) || n2.includes(n1);
    }

    for (let r = 0; r < sortedRoundKeysFinal.length - 1; r++) {
        const currentKey = sortedRoundKeysFinal[r];
        const nextKey = sortedRoundKeysFinal[r + 1];
        const currentPos = roundPositions[currentKey];
        const nextPos = roundPositions[nextKey];

        if (currentKey.includes('小组�?) || nextKey.includes('小组�?)) continue;

        for (let i = 0; i < currentPos.length; i++) {
            const match = currentPos[i];
            let targetMatch;

            const p1Name = match.match.player1Name;
            const p2Name = match.match.player2Name;
            const p1Total = match.match.player1Total || 0;
            const p2Total = match.match.player2Total || 0;

            // 检查是否轮空（对手为空或为"轮空"�?
            const isP1Bye = !p1Name || p1Name === '轮空' || p1Name === 'BYE' || p1Name === '待定';
            const isP2Bye = !p2Name || p2Name === '轮空' || p2Name === 'BYE' || p2Name === '待定';

            // 确定晋级选手
            let winnerName = null;
            if (isP1Bye && !isP2Bye) {
                winnerName = p2Name; // p2直接晋级
            } else if (isP2Bye && !isP1Bye) {
                winnerName = p1Name; // p1直接晋级
            } else if (p1Total > p2Total) {
                winnerName = p1Name;
            } else if (p2Total > p1Total) {
                winnerName = p2Name;
            }

            if (winnerName) {
                for (let j = 0; j < nextPos.length; j++) {
                    const nm = nextPos[j].match;
                    if (namesMatchForLine(nm.player1Name, winnerName) || namesMatchForLine(nm.player2Name, winnerName)) {
                        targetMatch = nextPos[j];
                        break;
                    }
                }
            }

            if (!targetMatch) {
                continue;
            }

            const y1 = match.y + matchBoxHeight / 2;
            const y2 = targetMatch.y + matchBoxHeight / 2;
            const x1 = match.x + matchBoxWidth;
            const x2 = targetMatch.x;
            const midX = (x1 + x2) / 2;

            svg += `<line x1="${x1}" y1="${y1}" x2="${midX}" y2="${y1}" stroke="#0077b6" stroke-width="1.5"/>`;
            svg += `<line x1="${midX}" y1="${y1}" x2="${midX}" y2="${y2}" stroke="#0077b6" stroke-width="1.5"/>`;
            svg += `<line x1="${midX}" y1="${y2}" x2="${x2}" y2="${y2}" stroke="#0077b6" stroke-width="1.5"/>`;
        }
    }

    sortedRoundKeysFinal.forEach(key => {
        roundPositions[key].forEach(pos => {
            const m = pos.match;
            const isTeam = category && category.includes('�?);
            const p1 = isTeam ? (m.player1Country || m.player1Name || '') : (m.player1Name || '');
            const p2 = isTeam ? (m.player2Country || m.player2Name || '') : (m.player2Name || '');

            const matchDateStr = m.matchDate ? new Date(m.matchDate).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

            let p1Score = m.player1Total || 0;
            let p2Score = m.player2Total || 0;

            if (!p1Score && !p2Score) {
                try {
                    if (m.scores) {
                        const scores = JSON.parse(m.scores);
                        scores.forEach(s => {
                            if (s.p1 > s.p2) p1Score++;
                            else if (s.p2 > s.p1) p2Score++;
                        });
                    }
                } catch (e) { }
            }

            const p1Class = p1Score > p2Score && p1Score > 0 ? 'bracket-player-name--winner' : (p1 ? '' : 'bracket-player-name--empty');
            const p2Class = p2Score > p1Score && p2Score > 0 ? 'bracket-player-name--winner' : (p2 ? '' : 'bracket-player-name--empty');

            const truncateName = (name, maxLen) => {
                if (!name) return '待定';
                return name.length > maxLen ? name.substring(0, maxLen - 1) + '�? : name;
            };

            const p1Display = truncateName(p1, 10);
            const p2Display = truncateName(p2, 10);
            const p1TitleEl = p1.length > 10 ? `<title>${p1}</title>` : '';
            const p2TitleEl = p2.length > 10 ? `<title>${p2}</title>` : '';
            const scoreText = (p1Score > 0 || p2Score > 0) ? `${p1Score} - ${p2Score}` : '';

            svg += `<rect x="${pos.x}" y="${pos.y}" width="${matchBoxWidth}" height="${matchBoxHeight}" rx="6" class="bracket-match-box"/>`;
            svg += `<line x1="${pos.x}" y1="${pos.y + matchBoxHeight / 2}" x2="${pos.x + matchBoxWidth}" y2="${pos.y + matchBoxHeight / 2}" class="bracket-divider"/>`;
            svg += `<g>${p1TitleEl}<text x="${pos.x + 8}" y="${pos.y + 14}" class="bracket-player-name ${p1Class}" font-size="10">${p1Display}</text></g>`;
            svg += `<text x="${pos.x + matchBoxWidth - 8}" y="${pos.y + 14}" class="bracket-player-name ${p1Class}" text-anchor="end" font-size="10">${p1Score}</text>`;
            svg += `<g>${p2TitleEl}<text x="${pos.x + 8}" y="${pos.y + 34}" class="bracket-player-name ${p2Class}" font-size="10">${p2Display}</text></g>`;
            svg += `<text x="${pos.x + matchBoxWidth - 8}" y="${pos.y + 34}" class="bracket-player-name ${p2Class}" text-anchor="end" font-size="10">${p2Score}</text>`;
            if (matchDateStr) {
                svg += `<text x="${pos.x + 8}" y="${pos.y + matchBoxHeight + 10}" font-size="9" fill="#e53935" font-weight="700">${matchDateStr}</text>`;
            }
        });
    });

    svg += '</svg>';
    document.getElementById('bracket-container').innerHTML = svg;
}

// 公告详情
async function showAnnouncementDetail(id) {

// ========== ���¹��� ==========
let allCompetitions = [];

async function loadCompetitions() {
    console.log('Loading competitions...');
    try {
        const res = await fetch(`${API_BASE}/competitions`);
        console.log('Response status:', res.status);
        if (!res.ok) {
            const error = await res.text();
            console.error('Error loading competitions:', error);
            return;
        }
        allCompetitions = await res.json();
        console.log('Competitions loaded:', allCompetitions);

        // 提取年份列表
        const years = [...new Set(allCompetitions.map(c => c.competitionYear).filter(y => y))].sort((a, b) => a - b);
        const yearOptions = years.map(y => `<option value="${y}">${y}�?/option>`).join('');
        document.getElementById('competition-year-select').innerHTML = '<option value="">全部年份</option>' + yearOptions;

        filterCompetitions();
    } catch (e) {
        console.error('Error loading competitions:', e);
    }
}

function filterCompetitions() {
    const selectedYear = document.getElementById('competition-year-select').value;
    const selectedMonth = document.getElementById('competition-month-select').value;
    let filtered = allCompetitions;

    if (selectedYear) {
        filtered = filtered.filter(c => c.competitionYear == selectedYear);
    }

    if (selectedMonth) {
        filtered = filtered.filter(c => {
            if (!c.startDate) return false;
            const month = new Date(c.startDate).getMonth() + 1;
            return month == selectedMonth;
        });
    }

    // 按年份降序排序（从高到低�?
    filtered.sort((a, b) => (b.competitionYear || 0) - (a.competitionYear || 0));

    // 按年份分组显�?
    const yearGrouped = {};
    filtered.forEach(c => {
        const year = c.competitionYear || '未知年份';
        if (!yearGrouped[year]) yearGrouped[year] = [];
        yearGrouped[year].push(c);
    });

    let html = '';
    Object.keys(yearGrouped).sort((a, b) => b - a).forEach(year => {
        // 每年份内按月份分�?
        const monthGrouped = {};
        yearGrouped[year].forEach(c => {
            let month = '未知月份';
            if (c.startDate) {
                const m = new Date(c.startDate).getMonth() + 1;
                month = m + '�?;
            }
            if (!monthGrouped[month]) monthGrouped[month] = [];
            monthGrouped[month].push(c);
        });

        html += `<h4 style="margin: 20px 0 10px; color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 5px;">${year}�?/h4>`;

        // 月份排序�?-12月在前，未知月份在最�?
        const monthKeys = Object.keys(monthGrouped).sort((a, b) => {
            const ma = parseInt(a);
            const mb = parseInt(b);
            if (!isNaN(ma) && !isNaN(mb)) return ma - mb;
            if (!isNaN(ma)) return -1;
            if (!isNaN(mb)) return 1;
            return 0;
        });

        monthKeys.forEach(month => {
            // 月份内按开始日期升序（最早的在前�?
            monthGrouped[month].sort((a, b) => {
                const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
                const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
                return dateA - dateB;
            });

            html += `<h5 style="margin: 12px 0 8px; color: #555; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px;">📅 ${month}</h5>`;
            monthGrouped[month].forEach(c => {
                html += `
                    <div class="competition-card" onclick="showCompetitionDetail(${c.id})">
                        <div class="competition-info">
                            <h4>${c.name}</h4>
                            <p>📍 ${c.location || '-'} | 📅 ${c.startDate && c.endDate ? new Date(c.startDate).toLocaleDateString() + ' - ' + new Date(c.endDate).toLocaleDateString() : c.startDate ? new Date(c.startDate).toLocaleDateString() : '-'}</p>
                        </div>
                        <div>
                            <button class="btn btn-warning" onclick="event.stopPropagation(); editCompetition(${c.id})">编辑</button>
                            <button class="btn btn-danger" onclick="event.stopPropagation(); deleteCompetition(${c.id})">删除</button>
                        </div>
                    </div>
                `;
            });
        });
    });

    document.getElementById('competitions-list').innerHTML = html || '<div class="empty-state">暂无赛事</div>';
}

let currentCompetitionMatches = null; // 存储当前赛事比赛数据

async function showCompetitionDetail(id) {
    currentCompetitionId = id;
    try {
        const [compRes, matchRes] = await Promise.all([
            fetch(`${API_BASE}/competitions/${id}`),
            fetch(`${API_BASE}/matches/competition/${id}`)
        ]);
        const comp = await compRes.json();
        const matches = await matchRes.json();
        currentCompetitionMatches = matches;

        const dateRange = comp.startDate && comp.endDate
            ? `${new Date(comp.startDate).toLocaleDateString()} - ${new Date(comp.endDate).toLocaleDateString()}`
            : comp.startDate
                ? new Date(comp.startDate).toLocaleDateString()
                : '';

        const yearStr = comp.competitionYear ? `${comp.competitionYear}�?` : '';
        document.getElementById('competition-title').innerHTML = yearStr + comp.name + (dateRange ? ` <span style="font-weight:400;font-size:14px;color:#666;">${dateRange}</span>` : '');

        // 重置对阵图视图为表格模式
        currentMatchView = 'table';
        document.getElementById('detail-rounds-content').style.display = 'block';
        document.getElementById('bracket-view').style.display = 'none';
        document.getElementById('btn-view-table').classList.add('btn-view-active');
        document.getElementById('btn-view-bracket').classList.remove('btn-view-active');

        // 比赛信息（默认显示）
        renderDetailRounds(document.getElementById('detail-rounds-content'), matches);

        document.getElementById('competitions-list-view').style.display = 'none';
        document.getElementById('competition-detail-view').style.display = 'block';
    } catch (e) {
        console.error(e);
    }
}

function selectMatchCategory(btn, cat) {
    document.querySelectorAll('#match-modal .category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('match-category').value = cat;
    const isTeam = cat && cat.includes('�?);
    document.getElementById('team-match-section').style.display = isTeam ? 'block' : 'none';
    document.getElementById('match-regular-score-section').style.display = isTeam ? 'none' : 'block';
    // 切换时去掉选手1/选手2的required，避免提交时报错
    document.getElementById('match-player1').required = !isTeam;
    document.getElementById('match-player2').required = !isTeam;
    if (isTeam) {
        renderTeamSubMatches();
    }
}

function showCompetitionsList() {
    document.getElementById('competitions-list-view').style.display = 'block';
    document.getElementById('competition-detail-view').style.display = 'none';
    currentCompetitionId = null;
}

function showCompetitionModal(id = null) {
    console.log('Opening competition modal, id:', id);
    document.getElementById('competition-modal').classList.add('show');
    document.getElementById('competition-modal-title').textContent = id ? '编辑赛事' : '添加赛事';
    document.getElementById('competition-form').reset();
    document.getElementById('competition-id').value = id || '';
    document.getElementById('competition-year').value = new Date().getFullYear();
    console.log('Modal should be visible now');
    if (id) {
        fetch(`${API_BASE}/competitions/${id}`).then(r => r.json()).then(c => {
            document.getElementById('competition-name').value = c.name;
            document.getElementById('competition-year').value = c.competitionYear || new Date().getFullYear();
            document.getElementById('competition-location').value = c.location || '';
            document.getElementById('competition-start').value = c.startDate ? c.startDate.slice(0, 10) : '';
            document.getElementById('competition-end').value = c.endDate ? c.endDate.slice(0, 10) : '';
            document.getElementById('competition-desc').value = c.description || '';
        }).catch(e => console.error('Error loading competition:', e));
    }
}

document.getElementById('competition-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('competition-id').value;
    const comp = {
        name: document.getElementById('competition-name').value,
        competitionYear: parseInt(document.getElementById('competition-year').value) || new Date().getFullYear(),
        location: document.getElementById('competition-location').value,
        startDate: document.getElementById('competition-start').value ? document.getElementById('competition-start').value + 'T00:00:00' : null,
        endDate: document.getElementById('competition-end').value ? document.getElementById('competition-end').value + 'T00:00:00' : null,
        description: document.getElementById('competition-desc').value,
        isActive: true
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/competitions/${id}` : `${API_BASE}/competitions`;

    console.log('Saving competition:', comp);

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(comp)
        });

        if (!response.ok) {
            const error = await response.text();
            alert('保存失败: ' + error);
            return;
        }

        const result = await response.json();
        console.log('Competition saved:', result);
    } catch (error) {
        console.error('Error:', error);
        alert('保存失败: ' + error.message);
        return;
    }

    closeModal('competition-modal');
    loadCompetitions();
});

async function editCompetition(id) { showCompetitionModal(id); }

async function deleteCompetition(id) {
    if (confirm('确定要删除这个赛事吗？该赛事下的所有比赛记录也将被删除�?)) {
        try {
            const response = await fetch(`${API_BASE}/competitions/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const error = await response.text();
                alert('删除失败: ' + error);
                return;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('删除失败: ' + error.message);
            return;
        }
        loadCompetitions();
    }
}

// ========== 比赛管理 ==========

// ========== �������� ==========
function renderScoreInputs() {
    const games = parseInt(document.getElementById('match-games').value);
    const container = document.getElementById('score-inputs-container');
    let html = '';
    for (let i = 1; i <= games; i++) {
        html += `
            <div class="score-input-row">
                <span>�?{i}局:</span>
                <input type="number" class="score-p1" placeholder="选手1" min="0" max="30">
                <span>:</span>
                <input type="number" class="score-p2" placeholder="选手2" min="0" max="30">
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderTeamSubMatchScores(selectEl) {
    const idx = selectEl.getAttribute('data-idx');
    const games = parseInt(selectEl.value);
    const container = document.querySelector(`.tsm-scores[data-idx="${idx}"]`);
    if (!container) return;
    let html = '';
    for (let i = 1; i <= games; i++) {
        html += `<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
            <span style="font-size:11px;color:#999;min-width:32px;">�?{i}局</span>
            <input type="number" class="tsm-score-p1" data-idx="${idx}" min="0" max="30" placeholder="-" style="width:40px;text-align:center;font-size:12px;border:1px solid #ddd;border-radius:3px;padding:2px;">
            <span style="color:#bbb;">:</span>
            <input type="number" class="tsm-score-p2" data-idx="${idx}" min="0" max="30" placeholder="-" style="width:40px;text-align:center;font-size:12px;border:1px solid #ddd;border-radius:3px;padding:2px;">
        </div>`;
    }
    container.innerHTML = html;
}

function renderTeamSubMatches() {
    const count = parseInt(document.getElementById('team-match-count').value);
    const container = document.getElementById('team-sub-matches-container');
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="team-sub-match" style="border:1px solid #d0d0d0;border-radius:8px;padding:12px;margin-bottom:10px;background:#fafafa;">
                <div style="font-size:12px;font-weight:700;color:#444;margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid #1a73e8;display:inline-block;">�?{i+1}�?/div>
                <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
                    <div style="flex:1;display:flex;gap:4px;align-items:center;min-width:0;max-width:45%;">
                        <input type="text" class="tsm-p1" placeholder="选手1" style="width:100px;border:1px solid #ddd;border-radius:4px;padding:5px 8px;font-size:13px;" data-idx="${i}">
                        <input type="text" class="tsm-p1-country" placeholder="国家" style="width:70px;border:1px solid #ddd;border-radius:4px;padding:5px 8px;font-size:12px;" data-idx="${i}">
                    </div>
                    <span style="font-weight:700;color:#bbb;font-size:12px;flex-shrink:0;">VS</span>
                    <div style="flex:1;display:flex;gap:4px;align-items:center;min-width:0;max-width:45%;">
                        <input type="text" class="tsm-p2" placeholder="选手2" style="width:100px;border:1px solid #ddd;border-radius:4px;padding:5px 8px;font-size:13px;" data-idx="${i}">
                        <input type="text" class="tsm-p2-country" placeholder="国家" style="width:70px;border:1px solid #ddd;border-radius:4px;padding:5px 8px;font-size:12px;" data-idx="${i}">
                    </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
                    <label style="font-size:11px;color:#666;font-weight:500;">局�?</label>
                    <select class="tsm-games" data-idx="${i}" onchange="renderTeamSubMatchScores(this)" style="font-size:12px;border:1px solid #ddd;border-radius:4px;padding:3px 6px;">
                        <option value="3">3局2�?/option>
                        <option value="5" selected>5局3�?/option>
                        <option value="7">7局4�?/option>
                    </select>
                </div>
                <div class="tsm-scores" data-idx="${i}"></div>
            </div>
        `;
    }
    container.innerHTML = html;
    // 初始化每场的比分输入
    container.querySelectorAll('.tsm-games').forEach(el => renderTeamSubMatchScores(el));
}

let playerNameMap = {}; // 名字到ID的映�?

async function showMatchModal(id = null) {
    // 加载选手列表到datalist
    const playerRes = await fetch(`${API_BASE}/players`);
    const players = await playerRes.json();

    // 构建名字映射
    playerNameMap = {};
    players.forEach(p => {
        playerNameMap[p.name] = p.id;
    });

    // 填充datalist
    const options = players.map(p => `<option value="${p.name}">`).join('');
    document.getElementById('player-suggestions').innerHTML = options;

    renderScoreInputs();

    document.getElementById('match-modal').classList.add('show');
    document.getElementById('match-modal-title').textContent = id ? '编辑比赛' : '添加比赛';
    document.getElementById('match-form').reset();
    document.getElementById('match-id').value = id || '';

    // 新增比赛时，默认使用当前选中的分�?
    if (!id && currentDetailCategory) {
        document.getElementById('match-category').value = currentDetailCategory;
        // 同步tab按钮状�?
        document.querySelectorAll('#match-modal .category-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-cat') === currentDetailCategory);
        });
        const isTeamNew = currentDetailCategory && currentDetailCategory.includes('�?);
        document.getElementById('team-match-section').style.display = isTeamNew ? 'block' : 'none';
        document.getElementById('match-regular-score-section').style.display = isTeamNew ? 'none' : 'block';
        document.getElementById('match-player1').required = !isTeamNew;
        document.getElementById('match-player2').required = !isTeamNew;
        if (isTeamNew) renderTeamSubMatches();
    } else if (!id) {
        // 新增时同步tab按钮状�?
        const cat = '男单';
        document.querySelectorAll('#match-modal .category-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-cat') === cat);
        });
        // 如果默认类别是团体赛，显示团体表�?
        const isTeamDef = cat && cat.includes('�?);
        document.getElementById('team-match-section').style.display = isTeamDef ? 'block' : 'none';
        document.getElementById('match-regular-score-section').style.display = isTeamDef ? 'none' : 'block';
        document.getElementById('match-player1').required = !isTeamDef;
        document.getElementById('match-player2').required = !isTeamDef;
        if (isTeamDef) renderTeamSubMatches();
    }

    if (id) {
        fetch(`${API_BASE}/matches/${id}`).then(r => r.json()).then(m => {
            // 使用保存的选手信息，如果不存在则从players表查�?
            const p1Name = m.player1Name || players.find(p => p.id === m.player1Id)?.name || '';
            const p2Name = m.player2Name || players.find(p => p.id === m.player2Id)?.name || '';
            const p1Country = m.player1Country || players.find(p => p.id === m.player1Id)?.country || '';
            const p2Country = m.player2Country || players.find(p => p.id === m.player2Id)?.country || '';

            document.getElementById('match-player1').value = p1Name;
            document.getElementById('match-player2').value = p2Name;
            document.getElementById('match-player1-country').value = p1Country;
            document.getElementById('match-player2-country').value = p2Country;
            document.getElementById('match-venue').value = m.venue || '';
            document.getElementById('match-status').value = m.status || 'scheduled';
            document.getElementById('match-category').value = m.category || '男单';
            // 更新tab按钮状�?
            const cat = m.category || '男单';
            document.querySelectorAll('#match-modal .category-btn').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-cat') === cat);
            });
            document.getElementById('match-round').value = m.roundNumber || '';
            document.getElementById('match-remark').value = m.remark || '';
            if (m.matchDate) {
                document.getElementById('match-date').value = m.matchDate.slice(0, 16);
            }

            // 处理团体赛子场次
            const isTeam = cat && cat.includes('�?);
            document.getElementById('team-match-section').style.display = isTeam ? 'block' : 'none';
            document.getElementById('match-regular-score-section').style.display = isTeam ? 'none' : 'block';
            document.getElementById('match-player1').required = !isTeam;
            document.getElementById('match-player2').required = !isTeam;
            if (isTeam && m.teamScores) {
                try {
                    const teamScores = JSON.parse(m.teamScores);
                    document.getElementById('team-match-count').value = teamScores.length;
                    renderTeamSubMatches();
                    // 填充子场次数�?
                    teamScores.forEach((sub, i) => {
                        const p1Input = document.querySelector(`.tsm-p1[data-idx="${i}"]`);
                        const p1cInput = document.querySelector(`.tsm-p1-country[data-idx="${i}"]`);
                        const p2Input = document.querySelector(`.tsm-p2[data-idx="${i}"]`);
                        const p2cInput = document.querySelector(`.tsm-p2-country[data-idx="${i}"]`);
                        if (p1Input) p1Input.value = sub.p1 || '';
                        if (p1cInput) p1cInput.value = sub.p1Country || '';
                        if (p2Input) p2Input.value = sub.p2 || '';
                        if (p2cInput) p2cInput.value = sub.p2Country || '';
                        // 设置局数并填入比分
                        if (sub.scores && sub.scores.length) {
                            const gamesSelect = document.querySelector(`.tsm-games[data-idx="${i}"]`);
                            if (gamesSelect) {
                                gamesSelect.value = sub.scores.length;
                                renderTeamSubMatchScores(gamesSelect);
                                const p1ScoreInputs = document.querySelectorAll(`.tsm-score-p1[data-idx="${i}"]`);
                                const p2ScoreInputs = document.querySelectorAll(`.tsm-score-p2[data-idx="${i}"]`);
                                sub.scores.forEach((s, j) => {
                                    if (p1ScoreInputs[j]) p1ScoreInputs[j].value = s.p1;
                                    if (p2ScoreInputs[j]) p2ScoreInputs[j].value = s.p2;
                                });
                            }
                        }
                    });
                } catch (e) { }
            }

            // 加载比分（非团体赛）
            if (m.scores && !isTeam) {
                try {
                    const scores = JSON.parse(m.scores);
                    document.getElementById('match-games').value = scores.length;
                    renderScoreInputs();
                    const p1Inputs = document.querySelectorAll('.score-p1');
                    const p2Inputs = document.querySelectorAll('.score-p2');
                    scores.forEach((s, i) => {
                        if (p1Inputs[i]) p1Inputs[i].value = s.p1;
                        if (p2Inputs[i]) p2Inputs[i].value = s.p2;
                    });
                } catch (e) { }
            }
        });
    }
}

document.getElementById('match-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('match-id').value;
    const category = document.getElementById('match-category').value;
    const isTeam = category && category.includes('�?);

    let match;

    if (isTeam) {
        // ===== 团体赛：收集子场次数�?=====
        const subMatchEls = document.querySelectorAll('.team-sub-match');
        const teamScores = [];
        let teamP1Total = 0, teamP2Total = 0;

        subMatchEls.forEach((el, i) => {
            const p1Name = el.querySelector('.tsm-p1').value.trim();
            const p2Name = el.querySelector('.tsm-p2').value.trim();
            const p1Country = el.querySelector('.tsm-p1-country').value.trim();
            const p2Country = el.querySelector('.tsm-p2-country').value.trim();

            const p1ScoreInputs = el.querySelectorAll('.tsm-score-p1');
            const p2ScoreInputs = el.querySelectorAll('.tsm-score-p2');
            const subScores = [];
            let subP1Total = 0, subP2Total = 0;

            p1ScoreInputs.forEach((inp, j) => {
                const p1 = parseInt(inp.value) || 0;
                const p2 = parseInt(p2ScoreInputs[j].value) || 0;
                subScores.push({ p1, p2 });
                if (p1 > p2) subP1Total++;
                else if (p2 > p1) subP2Total++;
            });

            teamScores.push({
                p1: p1Name,
                p1Country: p1Country,
                p2: p2Name,
                p2Country: p2Country,
                scores: subScores,
                p1Total: subP1Total,
                p2Total: subP2Total
            });

            if (subP1Total > subP2Total) teamP1Total++;
            else if (subP2Total > subP1Total) teamP2Total++;
        });

        match = {
            competitionId: currentCompetitionId,
            player1Name: document.getElementById('match-player1').value.trim() || category,
            player2Name: document.getElementById('match-player2').value.trim() || category,
            player1Country: document.getElementById('match-player1-country').value || '',
            player2Country: document.getElementById('match-player2-country').value || '',
            teamScores: JSON.stringify(teamScores),
            scores: null,
            player1Total: teamP1Total,
            player2Total: teamP2Total,
            venue: document.getElementById('match-venue').value,
            matchDate: document.getElementById('match-date').value || null,
            status: document.getElementById('match-status').value,
            roundNumber: document.getElementById('match-round').value || null,
            category: category,
            remark: document.getElementById('match-remark').value
        };
    } else {
        // ===== 非团体赛：原有逻辑 =====
        const p1Name = document.getElementById('match-player1').value.trim();
        const p2Name = document.getElementById('match-player2').value.trim();

        if (!p1Name || !p2Name) {
            alert('请输入选手姓名');
            return;
        }

        if (p1Name === p2Name) {
            alert('不能选择同一名选手');
            return;
        }

        const player1Id = playerNameMap[p1Name] || null;
        const player2Id = playerNameMap[p2Name] || null;

        const p1Inputs = document.querySelectorAll('.score-p1');
        const p2Inputs = document.querySelectorAll('.score-p2');
        const scores = [];
        let p1Total = 0, p2Total = 0;

        p1Inputs.forEach((input, j) => {
            const p1 = parseInt(input.value) || 0;
            const p2 = parseInt(p2Inputs[j].value) || 0;
            scores.push({ p1, p2 });
            if (p1 > p2) p1Total++;
            else if (p2 > p1) p2Total++;
        });

        match = {
            competitionId: currentCompetitionId,
            player1Id: player1Id,
            player1Name: p1Name,
            player1Country: document.getElementById('match-player1-country').value || '',
            player2Id: player2Id,
            player2Name: p2Name,
            player2Country: document.getElementById('match-player2-country').value || '',
            scores: JSON.stringify(scores),
            teamScores: null,
            player1Total: p1Total,
            player2Total: p2Total,
            venue: document.getElementById('match-venue').value,
            matchDate: document.getElementById('match-date').value || null,
            status: document.getElementById('match-status').value,
            roundNumber: document.getElementById('match-round').value || null,
            category: category,
            remark: document.getElementById('match-remark').value
        };
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/matches/${id}` : `${API_BASE}/matches`;

    console.log('Saving match:', match);

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(match)
        });

        if (!response.ok) {
            const error = await response.text();
            alert('保存失败: ' + error);
            return;
        }

        const result = await response.json();
        console.log('Match saved:', result);
    } catch (error) {
        console.error('Error:', error);
        alert('保存失败: ' + error.message);
        return;
    }

    closeModal('match-modal');
    if (currentCompetitionId) {
        const savedCategory = document.getElementById('match-category').value;
        const savedRound = document.getElementById('match-round').value || '';
        // Determine phase from round number
        var savedPhase = 'elim';
        if (savedRound.indexOf('�?) >= 0) savedPhase = 'group';
        else if (savedRound.indexOf('资格') >= 0) savedPhase = 'qualify';
        await showCompetitionDetail(currentCompetitionId);
        if (savedCategory && currentDetailCategory) {
            setTimeout(() => {
                const btn = document.querySelector(`#detail-rounds-content .bracket-category-tab[onclick*="${savedCategory}"]`);
                if (btn) {
                    switchDetailCategory(savedCategory, btn);
                    // Also switch to the matching phase tab
                    var phaseBtn = document.querySelector(`.detail-phase-tab[onclick*="${savedPhase}"]`);
                    if (phaseBtn) switchDetailPhase(savedPhase, phaseBtn);
                }
            }, 100);
        }
    }
});

async function editMatch(id) { showMatchModal(id); }

async function deleteMatch(id) {
    if (confirm('确定要删除这条比赛记录吗�?)) {
        await fetch(`${API_BASE}/matches/${id}`, { method: 'DELETE' });
        if (currentCompetitionId) {
            showCompetitionDetail(currentCompetitionId);
        }
    }
}

// ========== 排名管理 ==========
