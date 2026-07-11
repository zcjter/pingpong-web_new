        const API_BASE = 'http://localhost:8090/api';
        let currentPlayerId = null;
        let currentCompetitionId = null;
        let currentAnnouncementId = null;
        let allPlayers = [];

        // ========== GLOBAL FLAG MAPPING (country name → flagcdn alpha-2 code) ==========
        const GLOBAL_FLAG_MAP = {
            // 亚洲
            '中国': 'cn', '中国内地': 'cn', '内地': 'cn',
            '中国台北': 'TPE', '中华台北': 'TPE', '台湾': 'TPE', '台北': 'TPE',
            '中国香港': 'hk', '香港': 'hk', '中国澳门': 'mo',
            '澳门': 'mo', '澳門': 'mo',
            '日本': 'jp', '韩国': 'kr', '朝鲜': 'kp', '北朝鲜': 'kp',
            '蒙古': 'mn', '新加坡': 'sg', '马来西亚': 'my', '泰国': 'th', '越南': 'vn',
            '印度尼西亚': 'id', '菲律宾': 'ph', '文莱': 'bn', '东帝汶': 'tl', ' Timor': 'tl',
            '印度': 'in', '巴基斯坦': 'pk', '孟加拉': 'bd', '孟加拉国': 'bd', '巴基斯坦': 'pk',
            '斯里兰卡': 'lk', '尼泊尔': 'np', '不丹': 'bt', '马尔代夫': 'mv',
            '哈萨克斯坦': 'kz', '乌兹别克斯坦': 'uz', '土库曼斯坦': 'tm',
            '吉尔吉斯斯坦': 'kg', '塔吉克斯坦': 'tj', '阿富汗': 'af',
            '伊朗': 'ir', '伊拉克': 'iq', '沙特阿拉伯': 'sa', '也门': 'ye',
            '卡塔尔': 'qa', '阿联酋': 'ae', '阿曼': 'om', '科威特': 'kw',
            '巴林': 'bh', '约旦': 'jo', '黎巴嫩': 'lb', '叙利亚': 'sy',
            '以色列': 'il', '巴勒斯坦': 'ps', '土耳其': 'tr', '塞浦路斯': 'cy',
            '缅甸': 'mm', '老挝': 'la',
            // 欧洲
            '斯诺文尼亚': 'si', '英国': 'gb', '英國': 'gb', '英格兰': 'gb-eng', '苏格兰': 'gb-sct',
            '威尔士': 'gb-wls', '北爱尔兰': 'gb-nir',
            '法国': 'fr', '法國': 'fr', '德国': 'de', '德國': 'de',
            '意大利': 'it', '西班牙': 'es',
            '葡萄牙': 'pt', '荷兰': 'nl', '比利時': 'be', '卢森堡': 'lu',
            '瑞士': 'ch', '奥地利': 'at', '列支敦士登': 'li',
            '瑞典': 'se', '挪威': 'no', '丹麦': 'dk', '芬兰': 'fi', '芬蘭': 'fi', '冰岛': 'is',
            '爱沙尼亚': 'ee', '拉脱维亚': 'lv', '立陶宛': 'lt',
            '波兰': 'pl', '捷克': 'cz', '斯洛伐克': 'sk', '匈牙利': 'hu',
            '罗马尼亚': 'ro', '保加利亚': 'bg', '希腊': 'gr',
            '克罗地亚': 'hr', '斯洛文尼亚': 'si', '塞尔维亚': 'rs',
            '黑山': 'me', '波黑': 'ba', '北马其顿': 'mk', '阿尔巴尼亚': 'al',
            '白俄罗斯': 'by', '乌克兰': 'ua', '摩尔多瓦': 'md', '俄罗斯': 'ru',
            '爱尔兰': 'ie', '马耳他': 'mt', '安道尔': 'ad', '摩纳哥': 'mc',
            '圣马力诺': 'sm', '梵蒂冈': 'va', '比利时': 'be',
            // 美洲
            '美国': 'us', '美國': 'us', '加拿大': 'ca', '墨西哥': 'mx',
            '阿根廷': 'ar', '巴西': 'br', '智利': 'cl', '哥伦比亚': 'co',
            '秘鲁': 'pe', '厄瓜多尔': 'ec', '委内瑞拉': 've', '玻利维亚': 'bo',
            '巴拉圭': 'py', '乌拉圭': 'uy', '圭亚那': 'gy', '苏里南': 'sr',
            '法属圭亚那': 'gf',
            '牙买加': 'jm', '特立尼达和多巴哥': 'tt', '巴巴多斯': 'bb',
            '巴哈马': 'bs', '古巴': 'cu', '海地': 'ht', '多米尼加': 'do',
            '波多黎各': 'pr', '波多里各': 'pr',
            '哥斯达黎加': 'cr', '巴拿马': 'pa', '洪都拉斯': 'hn',
            '尼加拉瓜': 'ni', '萨尔瓦多': 'sv', '危地马拉': 'gt', '伯利兹': 'bz',
            '多米尼克': 'dm', '圣卢西亚': 'lc', '圣文森特和格林纳丁斯': 'vc',
            '格林纳达': 'gd', '圣基茨和尼维斯': 'kn', '安提瓜和巴布达': 'ag',
            // 非洲
            '埃及': 'eg', '南非': 'za', '摩洛哥': 'ma', '突尼斯': 'tn',
            '阿尔及利亚': 'dz', '利比亚': 'ly', '苏丹': 'sd', '埃塞俄比亚': 'et',
            '肯尼亚': 'ke', '坦桑尼亚': 'tz', '乌干达': 'ug', '加纳': 'gh',
            '尼日利亚': 'ng', '喀麦隆': 'cm', '科特迪瓦': 'ci', '塞内加尔': 'sn',
            '马里': 'ml', '布基纳法索': 'bf', '尼日尔': 'ne', '乍得': 'td',
            '安哥拉': 'ao', '莫桑比克': 'mz', '赞比亚': 'zm', '津巴布韦': 'zw',
            '博茨瓦纳': 'bw', '纳米比亚': 'na', '莱索托': 'ls', '斯威士兰': 'sz',
            '马达加斯加': 'mg', '毛里求斯': 'mu', '塞舌尔': 'sc',
            '卢旺达': 'rw', '布隆迪': 'bi', '索马里': 'so', '吉布提': 'dj',
            '赤道几内亚': 'gq', '加蓬': 'ga', '圣多美和普林西比': 'st',
            '佛得角': 'cv', '几内亚': 'gn', '几内亚比绍': 'gw',
            '冈比亚': 'gm', '塞拉利昂': 'sl', '利比里亚': 'lr',
            '多哥': 'tg', '贝宁': 'bj', '毛里塔尼亚': 'mr',
            '尼日尼亚': 'ng', '阿里及利亚': 'dz','拉米比亚':'na',
            // 大洋洲
            '澳大利亚': 'au', '新西兰': 'nz', '巴布亚新几内亚': 'pg',
            '斐济': 'fj', '萨摩亚': 'ws', '汤加': 'to', '瓦努阿图': 'vu',
            '密克罗尼西亚': 'fm', '帕劳': 'pw', '基里巴斯': 'ki',
            '图瓦卢': 'tv', '瑙鲁': 'nr', '马绍尔群岛': 'mh',
            '所罗门群岛': 'sb', '新喀里多尼亚': 'fr','法属波利尼西亚':'pf',
            '塔希提': 'pf', '塔希提岛': 'pf', '大溪地': 'pf',
            // 其他
            '格陵兰': 'gl', '法罗群岛': 'fo'
        };

        function getFlag(country) {
            if (!country) return '';
            const name = country.trim();

            // 跨国组合：国旗 + 国家名
            if (name.includes('/') || name.includes('+') || name.includes('&')) {
                const sep = name.includes('/') ? '/' : (name.includes('+') ? '+' : '&');
                const countries = name.split(sep).map(c => c.trim()).filter(c => c);
                if (countries.length > 1) {
                    return countries.map(c => {
                        const flag = getFlag(c);
                        return flag ? `${flag}<span style="margin-right:3px;">${c}</span>` : c;
                    }).join(`<span style="margin:0 4px;color:#ccc;">${sep}</span>`);
                }
                return getFlag(countries[0] || '');
            }

            // 1. 特殊处理：中华台北/中国台北 (梅花旗)
            // 使用专用的静态图片链接
            const TPE_FLAG = "https://picx.zhimg.com/80/v2-0c2290da259b563d9269af076b1e0ca9_1440w.webp?source=1def8aca";
            const taipeiVariants = ["中华台北", "中国台北", "Chinese Taipei", "TPE"];
            if (taipeiVariants.some(v => name.includes(v))) {
                return `<img src="${TPE_FLAG}" width="24" height="16" style="border-radius:2px;vertical-align:middle;border:1px solid #eee;background:#e3f2fd;padding:1px;" alt="${name}">`;
            }
            const GGGH_FLAG = "https://th.bing.com/th/id/R.24375a00402ca3867081c119fb7625bf?rik=BKMR0UOStMtpWQ&pid=ImgRaw&r=0";
            const ggghVariants = ["刚果民主共和国"];
            if (ggghVariants.some(v => name.includes(v))) {
                return `<img src="${GGGH_FLAG}" width="24" height="16" style="border-radius:2px;vertical-align:middle;border:1px solid #eee;background:#e3f2fd;padding:1px;" alt="${name}">`;
            }
            const GG_FLAG = "https://tse3.mm.bing.net/th/id/OIP.SX_ajduMnw3TMTb3vst0wgHaE8?w=600&h=400&rs=1&pid=ImgDetMain&o=7&rm=3";
            const ggVariants = ["刚果"];
            if (ggVariants.some(v => name.includes(v))) {
                return `<img src="${GG_FLAG}" width="24" height="16" style="border-radius:2px;vertical-align:middle;border:1px solid #eee;background:#e3f2fd;padding:1px;" alt="${name}">`;
            }
            // 2. 精确匹配 GLOBAL_FLAG_MAP
            const code = GLOBAL_FLAG_MAP[name];
            if (code) {
                return `<img src="https://flagcdn.com/w40/${code}.png" width="24" height="16" style="border-radius:2px;vertical-align:middle;background:#e3f2fd;padding:1px;" alt="${name}">`;
            }

            // 3. 模糊匹配
            for (const [key, val] of Object.entries(GLOBAL_FLAG_MAP)) {
                if (name.includes(key) || key.includes(name)) {
                    // 如果模糊匹配中包含"台北"，依然返回梅花旗
                    if (name.includes("台北") || key.includes("台北")) {
                        return `<img src="${TPE_FLAG}" width="24" height="16" style="border-radius:2px;vertical-align:middle;border:1px solid #eee;background:#e3f2fd;padding:1px;" alt="${name}">`;
                    }
                    return `<img src="https://flagcdn.com/w40/${val}.png" width="24" height="16" style="border-radius:2px;vertical-align:middle;background:#e3f2fd;padding:1px;" alt="${name}">`;
                }
            }
            return '';
        }

        // 比赛详情专用：跨国组合只显示国旗
        function getFlagForMatch(country) {
            if (!country) return '';
            const name = country.trim();
            if (name.includes('/') || name.includes('+') || name.includes('&')) {
                const sep = name.includes('/') ? '/' : (name.includes('+') ? '+' : '&');
                const countries = name.split(sep).map(c => c.trim()).filter(c => c);
                if (countries.length > 1) {
                    return countries.map(c => getFlag(c)).join('<span style="margin:0 2px;color:#999;">/</span>');
                }
                return getFlag(countries[0] || '');
            }
            return `<span class="rt-flag">${getFlag(name)}</span>`;
        }

        // 导航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function () {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                const page = this.dataset.page;
                document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
                document.getElementById('page-' + page).style.display = 'block';
                loadPageData(page);
            });
        });

        function showPage(page) {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
            document.getElementById('page-' + page).style.display = 'block';
        }

        function showHome() {
            showPage('home');
            document.querySelector('.nav-item[data-page="home"]').classList.add('active');
            loadHomeData();
        }

        function loadPageData(page) {
            switch (page) {
                case 'home': loadHomeData(); break;
                case 'players': loadPlayers(); break;
                case 'competitions': loadCompetitions(); break;
                case 'ranking-manage': loadRankingManage(); break;
                case 'champions': loadChampionsPage(); break;
                case 'visualization':
                    loadVizPlayerList();
                    break;
            }
        }


        function parseMarkdown(text) {
            if (!text) return text;
            let html = text;
            html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
            html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
            html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
            html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
            html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
            html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
            html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
            html = html.replace(/^---$/gm, '<hr>');

            const tableRegex = /(\|.+\|\n)+/g;
            html = html.replace(tableRegex, (match) => {
                const rows = match.trim().split('\n').filter(row => !row.match(/^\|[\s\-:|]+\|$/));
                if (rows.length === 0) return match;
                let tableHtml = '<table>';
                rows.forEach((row, idx) => {
                    const cells = row.split('|').filter(c => c.trim());
                    if (cells.length > 0) {
                        const tag = idx === 0 ? 'th' : 'td';
                        const cellsHtml = cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('');
                        tableHtml += `<tr>${cellsHtml}</tr>`;
                    }
                });
                tableHtml += '</table>';
                return tableHtml;
            });

            html = html.replace(/\n\n/g, '</p><p>');
            html = '<p>' + html + '</p>';
            html = html.replace(/<p><\/p>/g, '');
            return html;
        }

        function formatDateTime(dateStr) {
            if (!dateStr) return '-';
            const d = new Date(dateStr);
            const date = d.toLocaleDateString();
            const time = d.toTimeString().slice(0, 5);
            return `${date} ${time}`;
        }

        function closeModal(id) {
            document.getElementById(id).classList.remove('show');
        }

// Page module loader
async function loadAllPageModules() {
    const pages = ['home', 'players', 'competitions', 'ranking-manage', 'champions', 'visualization'];
    const container = document.getElementById('container');
    if (!container) return;
    
    for (const page of pages) {
        try {
            const res = await fetch("pages/" + page + ".html?v=" + Date.now());
            if (res.ok) {
                const html = await res.text();
                const div = document.createElement('div');
                div.innerHTML = html;
                container.appendChild(div);
            }
        } catch (e) {
            console.error('Failed to load page:', page, e);
        }
    }
    // Show home page and load data after all pages are ready
    showPage('home');
    document.querySelector('.nav-item[data-page="home"]').classList.add('active');
    loadHomeData();
};

document.addEventListener('DOMContentLoaded', function() {
    loadAllPageModules();
    // Close autocomplete dropdown on outside click
    document.addEventListener('click', function(e) {
        var dd = document.getElementById('v-player-dropdown');
        var search = document.getElementById('v-player-search');
        if (dd && search && !search.contains(e.target) && !dd.contains(e.target)) {
            dd.style.display = 'none';
        }
    });
});
