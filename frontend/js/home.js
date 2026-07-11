        // ========== 首页数据 ==========
        async function loadHomeData() {
            try {
                const annRes = await fetch(`${API_BASE}/announcements/published`);
                const announcements = await annRes.json();

                // --- 公告列表 ---
                const annHtml = announcements.length ? announcements.map(a => `
                    <div class="announcement-item" onclick="showAnnouncementDetail(${a.id})">
                        <div class="announcement-title">${a.title}</div>
                        <div>${a.content.substring(0, 100)}${a.content.length > 100 ? '...' : ''}</div>
                        <div class="announcement-date">${a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-')}</div>
                    </div>
                    `).join('') : '<div class="empty-state">暂无公告</div>';
                document.getElementById('announcements-list').innerHTML = annHtml;

                // --- 加载实时排名 TOP 3（带国旗）---
                await loadHomeRanking();
            } catch (e) {
                console.error(e);
            }
        }

        // 实时排名 TOP 3（带国旗）
        async function loadHomeRanking() {
            const currentYear = new Date().getFullYear();
            let rankHtml = '';
            try {
                const res = await fetch(`${API_BASE}/rankings/year/${currentYear}`);
                const rankings = await res.json();
                if (!rankings || rankings.length === 0) {
                    rankHtml = '<div class="empty-state">暂无排名数据</div>';
                } else {
                    const grouped = {};
                    rankings.forEach(r => {
                        const cat = r.category || '其他';
                        if (!grouped[cat]) grouped[cat] = [];
                        grouped[cat].push(r);
                    });
                    const categories = ['u11男单', 'u11女单', 'u13男单', 'u13女单', 'u15男单', 'u15女单', 'u15男双', 'u15女双', 'u15混双', 'u15男团', 'u15女团', 'u17男单', 'u17女单', 'u17男双', 'u17女双', 'u17混双', 'u19男单', 'u19女单', 'u19男双', 'u19女双', 'u19混双', 'u19男团', 'u19女团', '男单', '女单', '男双', '女双', '混双', '男团', '女团'];
                    categories.forEach(cat => {
                        if (grouped[cat] && grouped[cat].length > 0) {
                            const top3 = grouped[cat].slice(0, 3).sort((a, b) => (a.ranking || 999) - (b.ranking || 999));
                            rankHtml += `
                    <div class="home-ranking-cat">
                        <h4 class="home-ranking-cat-title">${cat} TOP 3</h4>
                        <table class="ranking-table ranking-table--clean">
                            <tbody>
                                ${top3.map((p, i) => `
                                                <tr class="rank-${i + 1}">
                                                    <td><span class="rank-num rank-num--${i + 1}">${p.ranking || i + 1}</span></td>
                                                    <td><span class="player-flag">${getFlag(p.country)}</span>${p.playerName}</td>
                                                    <td class="country-cell">${(p.country || '').includes('/') || (p.country || '').includes('+') || (p.country || '').includes('&') ? '-' : (p.country || '-')}</td>
                                                    <td class="points">${p.points}</td>
                                                </tr>
                                            `).join('')}
                            </tbody>
                        </table>
                    </div>
                    `;
                        }
                    });
                }
            } catch (e) {
                console.error(e);
                rankHtml = '<div class="empty-state">暂无排名数据</div>';
            }
            document.getElementById('home-ranking').innerHTML = rankHtml;
        }
