        // ====================================================================
        //  数据可视化 (新功能)
        // ====================================================================

        // 切换子标签
        function switchVizSub(name, el) {
            document.querySelectorAll('.sub-content').forEach(function(c){ c.classList.remove('active'); });
            document.querySelectorAll('.sub-tab').forEach(function(t){ t.classList.remove('active'); });
            document.getElementById('viz-' + name).classList.add('active');
            el.classList.add('active');
            if (name === 'player') { loadVizPlayerList(); }
            if (name === 'overview') { loadVizOverview(); }
        }

        // --- 运动员分析（输入自动补全搜索）---
        var vizPlayerNames = [];

        function loadVizPlayerList() {
            fetch(API_BASE+'/statistics/players/from-matches').then(function(r){return r.json();}).then(function(players){
                // Filter to individual names only
                var singles = players.filter(function(p){
                    return !/[\/、，,&+]/.test(p.name);
                });
                vizPlayerNames = singles.map(function(p){ return p.name; });
                // Populate hidden select as fallback
                var sel = document.getElementById('v-player-select');
                sel.innerHTML = '<option value="">-- 选择运动员 --</option>' +
                    singles.map(function(p){ return '<option value="'+p.name+'">'+p.name+'</option>'; }).join('');
            }).catch(function(e){console.error(e);});
        }

        function filterPlayerAutocomplete() {
            var q = document.getElementById('v-player-search').value.trim();
            var dd = document.getElementById('v-player-dropdown');
            if (!q) { dd.style.display = 'none'; dd.innerHTML = ''; return; }
            var matched = vizPlayerNames.filter(function(n){
                return n.toLowerCase().indexOf(q.toLowerCase()) >= 0;
            }).slice(0, 50);
            if (matched.length === 0) { dd.style.display = 'none'; dd.innerHTML = ''; return; }
            dd.style.display = 'block';
            dd.innerHTML = matched.map(function(n){
                return '<div onclick="selectPlayerAutocomplete(\''+n.replace(/'/g,"\\'")+'\')" style="padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid #f0f0f0;transition:background .15s;" onmouseover="this.style.background=\'#f5f7fa\'" onmouseout="this.style.background=\'\'">'+n+'</div>';
            }).join('');
        }

        function selectPlayerAutocomplete(name) {
            document.getElementById('v-player-search').value = name;
            document.getElementById('v-player-dropdown').style.display = 'none';
            document.getElementById('v-player-dropdown').innerHTML = '';
            loadVizPlayerDetailed();
        }

        function loadVizPlayerDetailed() {
            var name = document.getElementById('v-player-search').value.trim();
            var cont = document.getElementById('v-player-content');
            var load = document.getElementById('v-player-loading');
            if (!name) { cont.innerHTML = '<div class="empty-state" style="padding:20px;">请选择运动员查看完整数据分析</div>'; return; }
            load.style.display = 'inline-block'; cont.innerHTML = '';

            fetch(API_BASE+'/statistics/player/detailed-by-name?name='+encodeURIComponent(name))
            .then(function(r){return r.json();})
            .then(function(d){
                var html = '';

                // === 基本战绩卡片 ===
                html += '<div class="viz-stats-grid" style="margin-bottom:14px;">' +
                    '<div class="viz-stat-card" style="background:#e8f5e9;"><div class="v-value" style="color:#2e7d32;">'+(d.totalMatches||0)+'</div><div class="v-label">总场次</div></div>' +
                    '<div class="viz-stat-card" style="background:#e8f5e9;"><div class="v-value" style="color:#2e7d32;">'+(d.wins||0)+'</div><div class="v-label">胜</div></div>' +
                    '<div class="viz-stat-card" style="background:#ffebee;"><div class="v-value" style="color:#c62828;">'+(d.losses||0)+'</div><div class="v-label">负</div></div>' +
                    '<div class="viz-stat-card" style="background:#e3f2fd;"><div class="v-value" style="color:#0077b6;">'+(d.winRate||0)+'%</div><div class="v-label">胜率</div></div></div>';

                if (d.totalMatches === 0) html += '<div class="empty-state" style="padding:16px;">暂无比赛记录</div>';
                cont.innerHTML = html; load.style.display = 'none';

                // === Tab 化展示 ===
                var tabSections = [];

                // 参赛赛事
                if (d.competitionDetails && d.competitionDetails.length > 0) {
                    var compHtml = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f5f7fa;">' +
                        '<th style="padding:6px 10px;text-align:left;border-bottom:1px solid #eee;">赛事</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">年份</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">项目</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">场次</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">胜</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">负</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">胜率</th></tr></thead><tbody>';
                    d.competitionDetails.forEach(function(cd){
                        compHtml += '<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-weight:600;">'+(cd.competitionName||'')+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+(cd.competitionYear||'-')+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;font-weight:600;">'+(cd.category||'-')+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+(cd.matches||0)+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;color:#2e7d32;">'+(cd.wins||0)+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;color:#c62828;">'+(cd.losses||0)+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+(cd.winRate||0)+'%</td></tr>';
                    });
                    compHtml += '</tbody></table></div>';
                    // Add comp type breakdown if available
                    if (d.compTypeBreakdown && d.compTypeBreakdown.length > 0) {
                        compHtml += '<h4 style="font-size:12px;color:#888;margin:14px 0 6px;">按赛事类型统计</h4>';
                        compHtml += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f5f7fa;">' +
                            '<th style="padding:6px 10px;text-align:left;border-bottom:1px solid #eee;">类型</th>' +
                            '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">场次</th>' +
                            '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">胜</th>' +
                            '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">负</th>' +
                            '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">胜率</th></tr></thead><tbody>';
                        d.compTypeBreakdown.forEach(function(r){
                            compHtml += '<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-weight:600;">'+r.type+'</td>' +
                                '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+r.matches+'</td>' +
                                '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;color:#2e7d32;">'+r.wins+'</td>' +
                                '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;color:#c62828;">'+r.losses+'</td>' +
                                '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+(r.winRate||0)+'%</td></tr>';
                        });
                        compHtml += '</tbody></table></div>';
                    }
                    tabSections.push({label:'参赛赛事', html:compHtml});
                }

                // 夺冠记录
                if (d.championships && d.championships.length > 0) {
                    var champHtml = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#fff8e1;">' +
                        '<th style="padding:6px 10px;text-align:left;border-bottom:1px solid #eee;">赛事</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">项目</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">类型</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">决赛对手</th></tr></thead><tbody>';
                    var sortedChamps = d.championships.slice().sort(function(a, b){
                        var catCmp = (a.category||'').localeCompare(b.category||'');
                        if (catCmp !== 0) return catCmp;
                        return (b.competitionYear||0) - (a.competitionYear||0);
                    });
                    sortedChamps.forEach(function(ch){
                        var pt = ch.playType || '-';
                        var ptColor = pt==='单打'?'#0077b6':(pt==='双打'?'#43a047':(pt==='团体'?'#fb8c00':'#999'));
                        champHtml += '<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;">'+(ch.competitionName||'')+' ('+(ch.competitionYear||'')+')</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;font-weight:600;">'+ch.category+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;font-weight:600;color:'+ptColor+';">'+pt+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+ch.opponent+'</td></tr>';
                    });
                    champHtml += '</tbody></table></div>';
                    tabSections.push({label:'夺冠记录', html:champHtml});
                }

                // 对手交锋记录
                if (d.opponentRecords && d.opponentRecords.length > 0) {
                    var oppHtml = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f5f7fa;">' +
                        '<th style="padding:6px 10px;text-align:left;border-bottom:1px solid #eee;">对手</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">交手次数</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">胜</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">负</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">胜率</th></tr></thead><tbody>';
                    d.opponentRecords.forEach(function(r){
                        oppHtml += '<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-weight:600;">'+r.opponent+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+r.matches+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;color:#2e7d32;">'+r.wins+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;color:#c62828;">'+r.losses+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+(r.winRate||0)+'%</td></tr>';
                    });
                    oppHtml += '</tbody></table></div>';
                    tabSections.push({label:'对手交锋记录', html:oppHtml});
                }

                // 各轮次胜率
                if (d.roundBreakdown && d.roundBreakdown.length > 0) {
                    var roundHtml = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f5f7fa;">' +
                        '<th style="padding:6px 10px;text-align:left;border-bottom:1px solid #eee;">轮次</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">场次</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">胜</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">负</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">胜率</th></tr></thead><tbody>';
                    d.roundBreakdown.forEach(function(r){
                        if (r.round && r.round.indexOf('组') >= 0) return;
                        roundHtml += '<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-weight:600;">'+r.round+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+r.matches+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;color:#2e7d32;">'+r.wins+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;color:#c62828;">'+r.losses+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+(r.winRate||0)+'%</td></tr>';
                    });
                    roundHtml += '</tbody></table></div>';
                    tabSections.push({label:'各轮次胜率', html:roundHtml});
                }

                // 比分分析
                var hasScoreAnalysis = (d.maxScoreDiff||0) > 0 || d.comebackWins || d.comebackLosses || (d.scoreDistribution && d.scoreDistribution.length > 0);
                if (hasScoreAnalysis) {
                    var scoreHtml = '<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">' +
                        '<div class="viz-stat-card" style="flex:1;min-width:100px;background:#e3f2fd;text-align:center;padding:10px;"><div class="v-value" style="font-size:20px;color:#0077b6;">'+(d.maxScoreDiff||0)+'</div><div class="v-label" style="font-size:11px;">单局最大分差</div></div>' +
                        '<div class="viz-stat-card" style="flex:1;min-width:100px;background:#e8f5e9;text-align:center;padding:10px;"><div class="v-value" style="font-size:20px;color:#2e7d32;">'+(d.comebackWins||0)+'</div><div class="v-label" style="font-size:11px;">逆转获胜</div></div>' +
                        '<div class="viz-stat-card" style="flex:1;min-width:100px;background:#ffebee;text-align:center;padding:10px;"><div class="v-value" style="font-size:20px;color:#c62828;">'+(d.comebackLosses||0)+'</div><div class="v-label" style="font-size:11px;">被逆转告负</div></div>' +
                        '</div>';
                    if (d.scoreDistribution && d.scoreDistribution.length > 0) {
                        scoreHtml += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f5f7fa;">' +
                            '<th style="padding:6px 10px;text-align:left;border-bottom:1px solid #eee;">比分</th>' +
                            '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">出现次数</th></tr></thead><tbody>';
                        var topScores = d.scoreDistribution.slice(0, 15);
                        topScores.forEach(function(s){
                            scoreHtml += '<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-weight:600;">'+s.score+'</td>' +
                                '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+s.count+'</td></tr>';
                        });
                        scoreHtml += '</tbody></table></div>';
                    }
                    tabSections.push({label:'比分分析', html:scoreHtml});
                }

                // 渲染 Tab
                if (tabSections.length > 0) {
                    var tabBar = '<div class="viz-tab-bar" style="display:flex;gap:2px;border-bottom:2px solid #e0e0e0;margin-bottom:12px;flex-wrap:wrap;">';
                    var tabPanels = '';
                    tabSections.forEach(function(ts, i){
                        var active = i === 0 ? ' active' : '';
                        tabBar += '<span class="viz-tab'+active+'" data-idx="'+i+'" style="padding:8px 16px;font-size:13px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .2s;color:'+(i===0?'#0077b6':'#666')+';font-weight:'+(i===0?'600':'400')+';border-bottom-color:'+(i===0?'#0077b6':'transparent')+';">'+ts.label+'</span>';
                        tabPanels += '<div class="viz-tab-panel'+active+'" data-idx="'+i+'" style="display:'+(i===0?'block':'none')+';">'+ts.html+'</div>';
                    });
                    tabBar += '</div>';
                    cont.insertAdjacentHTML('beforeend', tabBar + tabPanels);
                    // Tab switching via click
                    var tabs = cont.querySelectorAll('.viz-tab');
                    var panels = cont.querySelectorAll('.viz-tab-panel');
                    tabs.forEach(function(tab){
                        tab.addEventListener('click', function(){
                            var idx = parseInt(this.getAttribute('data-idx'));
                            tabs.forEach(function(t){
                                t.style.color = '#666';
                                t.style.fontWeight = '400';
                                t.style.borderBottomColor = 'transparent';
                            });
                            panels.forEach(function(p){ p.style.display = 'none'; });
                            this.style.color = '#0077b6';
                            this.style.fontWeight = '600';
                            this.style.borderBottomColor = '#0077b6';
                            var panel = panels[idx];
                            if (panel) panel.style.display = 'block';
                        });
                    });
                }
            })
            .catch(function(e){
                console.error(e);
                cont.innerHTML = '<div class="empty-state" style="padding:16px;color:#e53935;">加载失败</div>';
                load.style.display = 'none';
            });
        }

        // --- 总体分析 ---
        function loadVizOverview() {
            var cont = document.getElementById('v-overview-content');
            var load = document.getElementById('v-overview-loading');
            cont.innerHTML = ''; load.style.display = 'inline-block';

            fetch(API_BASE+'/statistics/overview')
            .then(function(r){ return r.json(); })
            .then(function(d){
                var html = '';

                // 1) 全局比分分布
                if (d.scoreDistribution && d.scoreDistribution.length > 0) {
                    html += '<div style="margin-bottom:20px;">';
                    html += '<h4 style="font-size:14px;color:#333;margin:0 0 8px;">📊 全局比分分布 <span style="font-size:11px;color:#999;font-weight:400;">最大分差: '+(d.maxScoreDiff||0)+'</span></h4>';
                    html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f5f7fa;">' +
                        '<th style="padding:6px 10px;text-align:left;border-bottom:1px solid #eee;">比分</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">出现次数</th></tr></thead><tbody>';
                    d.scoreDistribution.forEach(function(s){
                        html += '<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-weight:600;">'+s.score+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+s.count+'</td></tr>';
                    });
                    html += '</tbody></table></div></div>';
                }

                // 2) 最活跃运动员 Top 20
                if (d.mostActivePlayers && d.mostActivePlayers.length > 0) {
                    html += '<div style="margin-bottom:20px;">';
                    html += '<h4 style="font-size:14px;color:#333;margin:0 0 8px;">👥 最活跃运动员 Top 20</h4>';
                    html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f5f7fa;">' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">#</th>' +
                        '<th style="padding:6px 10px;text-align:left;border-bottom:1px solid #eee;">运动员</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">场次</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">胜</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">胜率</th></tr></thead><tbody>';
                    d.mostActivePlayers.forEach(function(p, i){
                        html += '<tr><td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;color:#999;">'+(i+1)+'</td>' +
                            '<td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-weight:600;">'+p.name+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+p.matches+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;color:#2e7d32;">'+p.wins+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+p.winRate+'%</td></tr>';
                    });
                    html += '</tbody></table></div></div>';
                }

                cont.innerHTML = html; load.style.display = 'none';

                // 3) 各类赛事占比（饼图）
                if (d.compTypeDistribution && d.compTypeDistribution.length > 0) {
                    var pieDiv = document.createElement('div');
                    pieDiv.style.marginBottom = '20px';
                    pieDiv.innerHTML = '<h4 style="font-size:14px;color:#333;margin:0 0 8px;">🏟️ 各类赛事占比</h4><div id="v-ov-comp-type" style="height:260px;"></div>';
                    cont.appendChild(pieDiv);
                    var pieChart = echarts.init(document.getElementById('v-ov-comp-type'));
                    var total = d.compTypeDistribution.reduce(function(s, t){ return s + t.count; }, 0);
                    var pieData = d.compTypeDistribution.map(function(t){
                        return {name: t.type, value: t.count};
                    });
                    pieChart.setOption({
                        tooltip:{trigger:'item',formatter:'{b}: {c} ({d}%)'},
                        series:[{
                            type:'pie',radius:['30%','55%'],center:['50%','55%'],
                            data:pieData,
                            label:{fontSize:11,formatter:'{b}\n{d}%'},
                            emphasis:{itemStyle:{shadowBlur:10,shadowOffsetX:0,shadowColor:'rgba(0,0,0,0.5)'}}
                        }]
                    }, true);
                    window.addEventListener('resize',function(){pieChart.resize();});
                }

                // 4) 各国冠军榜
                if (d.countryChampionships && d.countryChampionships.length > 0) {
                    var champDiv = document.createElement('div');
                    champDiv.style.marginBottom = '20px';
                    champDiv.innerHTML = '<h4 style="font-size:14px;color:#333;margin:0 0 8px;">🏆 各国冠军榜</h4><div id="v-ov-country-chart" style="height:280px;"></div>';
                    cont.appendChild(champDiv);
                    var barChart = echarts.init(document.getElementById('v-ov-country-chart'));
                    var countries = d.countryChampionships.map(function(c){ return c.country; });
                    var champs = d.countryChampionships.map(function(c){ return c.championships; });
                    barChart.setOption({
                        tooltip:{trigger:'axis'},
                        grid:{left:'8%',right:'3%',bottom:'22%',top:'6%',containLabel:false},
                        xAxis:{type:'category',data:countries,axisLabel:{fontSize:11,rotate:45,interval:0}},
                        yAxis:{type:'value',minInterval:1,axisLabel:{fontSize:10}},
                        series:[{
                            type:'bar',barWidth:'50%',data:champs,
                            itemStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#f5af19'},{offset:1,color:'#f12711'}]),
                              borderRadius:[4,4,0,0]},
                            label:{show:true,position:'top',fontSize:11,fontWeight:'bold'}
                        }]
                    }, true);
                    window.addEventListener('resize',function(){barChart.resize();});
                }

                // 5) 冷门对局
                if (d.upsets && d.upsets.length > 0) {
                    var upsetDiv = document.createElement('div');
                    upsetDiv.style.marginBottom = '10px';
                    var upsetHtml = '<h4 style="font-size:14px;color:#333;margin:0 0 8px;">🔥 冷门对局 <span style="font-size:11px;color:#999;font-weight:400;">低排名选手战胜高排名选手</span></h4>';
                    upsetHtml += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f5f7fa;">' +
                        '<th style="padding:6px 10px;text-align:left;border-bottom:1px solid #eee;">胜者</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">胜者积分</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">败者积分</th>' +
                        '<th style="padding:6px 10px;text-align:center;border-bottom:1px solid #eee;">分差</th>' +
                        '<th style="padding:6px 10px;text-align:left;border-bottom:1px solid #eee;">赛事</th></tr></thead><tbody>';
                    d.upsets.forEach(function(u){
                        upsetHtml += '<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#2e7d32;">'+u.winner+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;">'+u.winnerPoints+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;font-weight:600;">'+u.loserPoints+'</td>' +
                            '<td style="padding:6px 10px;text-align:center;border-bottom:1px solid #f0f0f0;color:#e53935;">+'+u.diff+'</td>' +
                            '<td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;color:#666;">'+u.competition+'</td></tr>';
                    });
                    upsetHtml += '</tbody></table></div>';
                    upsetDiv.innerHTML = upsetHtml;
                    cont.appendChild(upsetDiv);
                }

                if (!html && !d.compTypeDistribution && !d.countryChampionships && !d.upsets) {
                    cont.innerHTML = '<div class="empty-state" style="padding:20px;">暂无总体分析数据</div>';
                }
                load.style.display = 'none';
            })
            .catch(function(e){
                console.error(e);
                cont.innerHTML = '<div class="empty-state" style="padding:16px;color:#e53935;">加载失败</div>';
                load.style.display = 'none';
            });
        }

        // Close autocomplete dropdown on outside click
        document.addEventListener('click', function(e) {
            var dd = document.getElementById('v-player-dropdown');
            var search = document.getElementById('v-player-search');
            if (dd && search && !search.contains(e.target) && !dd.contains(e.target)) {
                dd.style.display = 'none';
            }
        });

        // 等 DOM 加载完成后再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadHomeData);
        } else {
            loadHomeData();
        }