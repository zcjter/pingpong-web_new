        // ========== 运动员管理 ==========
        async function loadPlayers() {
            try {
                const res = await fetch(`${API_BASE}/players`);
                allPlayers = await res.json();
                renderPlayersList(allPlayers);
            } catch (e) {
                console.error(e);
            }
        }

        function renderPlayersList(players) {
            const html = players.map(p => `
                <div class="player-card" ondblclick="showPlayerDetail(${p.id})">
                    <div class="player-avatar">${p.name.charAt(0)}</div>
                    <div class="player-name">${p.name}</div>
                    <div class="player-country">${(p.country || '').includes('/') || (p.country || '').includes('+') || (p.country || '').includes('&') ? '-' : (p.country || '-')}</div>
                    <div class="player-card-actions" onclick="event.stopPropagation()">
                        <button class="btn btn-sm btn-warning" onclick="editPlayer(${p.id})">编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="deletePlayer(${p.id})">删除</button>
                    </div>
                </div>
                `).join('');
            document.getElementById('players-grid').innerHTML = html || '<div class="empty-state">暂无运动员</div>';
        }

        async function showPlayerDetail(id) {
            currentPlayerId = id;
            try {
                const res = await fetch(`${API_BASE}/players/${id}`);
                const p = await res.json();

                document.getElementById('detail-avatar').textContent = p.name.charAt(0);
                document.getElementById('detail-name').textContent = p.name;
                document.getElementById('detail-country').innerHTML = getFlag(p.country) || (p.country || '-');
                let introHtml = p.introduction || '暂无简介';

                try {
                    const m = window.marked;
                    if (m && typeof m.parse === 'function') {
                        const parsed = m.parse(introHtml);
                        introHtml = parsed instanceof Promise ? await parsed : parsed;
                    } else {
                        introHtml = parseMarkdown(introHtml);
                    }
                } catch (e) {
                    introHtml = parseMarkdown(introHtml);
                }
                document.getElementById('detail-intro').innerHTML = introHtml;
                document.getElementById('detail-age').textContent = p.age || '-';
                document.getElementById('detail-gender').textContent = p.gender || '-';
                document.getElementById('detail-points').textContent = p.rankingPoints || 0;

                const rankRes = await fetch(`${API_BASE}/players/ranking`);
                const ranking = await rankRes.json();
                const rank = ranking.findIndex(r => r.id === id) + 1;
                document.getElementById('detail-rank').textContent = rank || '-';

                document.getElementById('players-list-view').style.display = 'none';
                document.getElementById('player-detail-view').style.display = 'block';
            } catch (e) {
                console.error(e);
            }
        }

        function showPlayersList() {
            document.getElementById('players-list-view').style.display = 'block';
            document.getElementById('player-detail-view').style.display = 'none';
            currentPlayerId = null;
        }

        function showPlayerModal(id = null) {
            document.getElementById('player-modal').classList.add('show');
            document.getElementById('player-modal-title').textContent = id ? '编辑运动员' : '添加运动员';
            document.getElementById('player-form').reset();
            document.getElementById('player-id').value = id || '';
            if (id) {
                fetch(`${API_BASE}/players/${id}`).then(r => r.json()).then(p => {
                    document.getElementById('player-name').value = p.name;
                    document.getElementById('player-country').value = p.country || '';
                    document.getElementById('player-age-input').value = p.age || '';
                    document.getElementById('player-gender').value = p.gender || '男';
                    document.getElementById('player-points').value = p.rankingPoints || 0;
                    document.getElementById('player-intro').value = p.introduction || '';
                });
            }
        }

        document.getElementById('player-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            const id = document.getElementById('player-id').value;
            const player = {
                name: document.getElementById('player-name').value,
                country: document.getElementById('player-country').value,
                age: parseInt(document.getElementById('player-age-input').value) || null,
                gender: document.getElementById('player-gender').value,
                rankingPoints: parseInt(document.getElementById('player-points').value) || 0,
                introduction: document.getElementById('player-intro').value
            };

            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_BASE}/players/${id}` : `${API_BASE}/players`;

            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(player)
            });

            closeModal('player-modal');
            loadPlayers();
            if (currentPlayerId && id == currentPlayerId) {
                showPlayerDetail(currentPlayerId);
            }
        });

        async function editPlayer(id) { showPlayerModal(id); }

        async function deletePlayer(id) {
            if (confirm('确定要删除这个运动员吗？')) {
                await fetch(`${API_BASE}/players/${id}`, { method: 'DELETE' });
                showPlayersList();
                loadPlayers();
            }
        }

        async function searchPlayers(keyword) {
            if (!keyword) { loadPlayers(); return; }
            const res = await fetch(`${API_BASE}/players/search?keyword=${keyword}`);
            const players = await res.json();
            renderPlayersList(players);
        }
