        // ========== 排名管理 ==========
        let rankingPlayerMap = {};

        async function loadRankingManage() {
            try {
                const yearSelect = document.getElementById('ranking-year-select');
                if (!yearSelect) return console.error('ranking-year-select not found');
                
                const yearsRes = await fetch(`${API_BASE}/rankings/years`);
                const years = await yearsRes.json();

                const currentYear = new Date().getFullYear();
                const yearOptions = years.length ? years.map(y => `<option value="${y}">${y}年</option>`).join('') : `<option value="${currentYear}">${currentYear}年</option>`;
                yearSelect.innerHTML = '<option value="">选择年份</option>' + yearOptions;

                const firstYear = years.length ? years[years.length - 1] : currentYear;
                if (!yearSelect.value) {
                    yearSelect.value = firstYear;
                    await loadRankingsByFilter();
                }
            } catch (e) {
                console.error(e);
            }
        }

        async function loadRankingsByFilter() {
            const year = document.getElementById('ranking-year-select').value;
            const category = document.getElementById('ranking-category-select').value;

            if (!year) {
                document.getElementById('ranking-by-year').innerHTML = '<div class="empty-state">请选择年份</div>';
                return;
            }

            try {
                let url = `${API_BASE}/rankings/year/${year}`;
                if (category) {
                    url = `${API_BASE}/rankings/year/${year}/category/${encodeURIComponent(category)}`;
                }

                const res = await fetch(url);
                const rankings = await res.json();

                rankingPlayerMap = {};
                rankings.forEach(r => {
                    rankingPlayerMap[r.playerName] = r.id;
                });

                // 按项目分组
                const grouped = {};
                rankings.forEach(r => {
                    const cat = r.category || '其他';
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(r);
                });

                // 对每个项目内的排名进行排序
                Object.keys(grouped).forEach(cat => {
                    grouped[cat].sort((a, b) => (a.ranking || 999) - (b.ranking || 999));
                });

                const categories = ['u11男单', 'u11女单', 'u13男单', 'u13女单', 'u15男单', 'u15女单', 'u15男双', 'u15女双', 'u15混双', 'u15男团', 'u15女团', 'u17男单', 'u17女单', 'u17男双', 'u17女双', 'u17混双', 'u19男单', 'u19女单', 'u19男双', 'u19女双', 'u19混双', 'u19男团', 'u19女团', '男单', '女单', '男双', '女双', '混双', '男团', '女团'];
                let html = '';

                categories.forEach(cat => {
                    if (grouped[cat] && grouped[cat].length > 0) {
                        html += `
                            <div style="margin-bottom: 30px;">
                                <h4 style="margin-bottom: 10px; color: #0077b6; font-weight: 700;">${cat}</h4>
                                <table class="ranking-table ranking-table--clean">
                                    <thead>
                                        <tr>
                                            <th>排名</th>
                                            <th>运动员</th>
                                            <th>国家</th>
                                            <th>积分</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${grouped[cat].map((r, i) => `
                                            <tr class="rank-${i + 1}">
                                                <td><span class="rank-num rank-num--${i + 1}">${r.ranking || i + 1}</span></td>
                                                <td>${r.playerName}</td>
                                                <td><span class="player-flag">${getFlag(r.country)}</span>${(r.country || '').includes('/') || (r.country || '').includes('+') || (r.country || '').includes('&') ? '' : (r.country || '-')}</td>
                                                <td class="points">${r.points || 0}</td>
                                                <td>
                                                    <button class="btn btn-warning btn-sm" onclick="editRanking(${r.id})">编辑</button>
                                                    <button class="btn btn-danger btn-sm" onclick="deleteRanking(${r.id})">删除</button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    }
                });

                document.getElementById('ranking-by-year').innerHTML = html || '<div class="empty-state">该年份暂无排名数据</div>';
            } catch (e) {
                console.error(e);
            }
        }

        function showRankingModal(id = null) {
            const yearSelect = document.getElementById('ranking-year-select');
            const year = yearSelect ? yearSelect.value : new Date().getFullYear();
            const categorySelect = document.getElementById('ranking-category-select');
            const category = categorySelect ? categorySelect.value : '男单';

            document.getElementById('ranking-modal').classList.add('show');
            document.getElementById('ranking-modal-title').textContent = id ? '编辑排名' : `添加排名`;
            document.getElementById('ranking-form').reset();
            document.getElementById('ranking-id').value = id || '';
            document.getElementById('ranking-year').value = year;
            document.getElementById('ranking-category').value = category;

            if (id) {
                fetch(`${API_BASE}/rankings/${id}`).then(r => r.json()).then(r => {
                    document.getElementById('ranking-year').value = r.rankingYear;
                    document.getElementById('ranking-category').value = r.category || '男单';
                    document.getElementById('ranking-num').value = r.ranking;
                    document.getElementById('ranking-player-name').value = r.playerName || '';
                    document.getElementById('ranking-country').value = r.country || '';
                    document.getElementById('ranking-points').value = r.points || 0;
                });
            }
        }

        document.getElementById('ranking-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            const id = document.getElementById('ranking-id').value;
            const playerName = document.getElementById('ranking-player-name').value.trim();
            const country = document.getElementById('ranking-country').value.trim();
            const points = parseInt(document.getElementById('ranking-points').value) || 0;
            const ranking = parseInt(document.getElementById('ranking-num').value) || 1;
            const year = parseInt(document.getElementById('ranking-year').value) || new Date().getFullYear();
            const category = document.getElementById('ranking-category').value;

            if (!playerName) {
                alert('请输入运动员姓名');
                return;
            }

            const rankingData = {
                playerName: playerName,
                country: country,
                points: points,
                ranking: ranking,
                rankingYear: year,
                category: category
            };

            let method, url;
            if (id) {
                method = 'PUT';
                url = `${API_BASE}/rankings/${id}`;
            } else {
                method = 'POST';
                url = `${API_BASE}/rankings`;
            }

            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rankingData)
            });

            closeModal('ranking-modal');
            loadRankingsByFilter();
        });

        async function editRanking(id) { showRankingModal(id); }

        async function deleteRanking(id) {
            if (confirm('确定要删除这条排名记录吗？')) {
                await fetch(`${API_BASE}/rankings/${id}`, { method: 'DELETE' });
                loadRankingsByFilter();
            }
        }
