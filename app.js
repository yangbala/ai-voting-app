/**
 * AI.VOTE - Core Application Logic
 * Implements local storage state, Chart.js rendering, tab navigation,
 * custom form element interactivity, and data management.
 */

// --- Default Seed/Mock Data ---
// Seed data provides a high-quality visualization immediately on first load.
const DEFAULT_SEED_DATA = [
    { platform: "ChatGPT", application: "Writing", frequency: "Daily", satisfaction: 5, comment: "ChatGPT 已經是我寫作與翻譯的每日必備助手，速度非常快。" },
    { platform: "Claude", application: "Coding", frequency: "Daily", satisfaction: 5, comment: "Claude 3.5 Sonnet 的程式編寫能力非常驚人，邏輯完整度很高。" },
    { platform: "Gemini", application: "Research", frequency: "DailyOnce", satisfaction: 4, comment: "Gemini 與 Google 文件的整合很方便，搜尋最新資料的能力也很準確。" },
    { platform: "ChatGPT", application: "Coding", frequency: "Daily", satisfaction: 4, comment: "常用來寫腳本和重構代碼，縮短了至少一半的開發時間。" },
    { platform: "Copilot", application: "Coding", frequency: "Daily", satisfaction: 4, comment: "在 VS Code 中自動補全很流暢，但有時會有些笨拙。" },
    { platform: "Midjourney/SD", application: "Design", frequency: "Weekly", satisfaction: 5, comment: "Midjourney v6 畫出來的效果非常精緻，對創意發想很有幫助！" },
    { platform: "Claude", application: "Writing", frequency: "DailyOnce", satisfaction: 5, comment: "在分析文章語氣與長文摘要上，目前 Claude 還是我的最愛。" },
    { platform: "Local/OS", application: "Coding", frequency: "Weekly", satisfaction: 4, comment: "使用 Ollama 在本機跑 DeepSeek-Coder，保護專案隱私非常完美。" },
    { platform: "ChatGPT", application: "Business", frequency: "DailyOnce", satisfaction: 4, comment: "用來寫電子郵件與合約範本，大幅提升行政效率。" },
    { platform: "Gemini", application: "Assistant", frequency: "Weekly", satisfaction: 3, comment: "語音對話功能滿好玩的，但在複雜任務上還是稍微有些理解錯誤。" },
    { platform: "Midjourney/SD", application: "Design", frequency: "Weekly", satisfaction: 4, comment: "Stable Diffusion 雖然學習曲線較陡峭，但控圖自由度最高。" },
    { platform: "ChatGPT", application: "Research", frequency: "Weekly", satisfaction: 4, comment: "用來整理論文大綱與跨領域概念學習，幫助非常大。" },
    { platform: "Claude", application: "Coding", frequency: "Daily", satisfaction: 5, comment: "基本上它已經是我的全職 Pair Programmer 了。" },
    { platform: "Copilot", application: "Business", frequency: "DailyOnce", satisfaction: 3, comment: "在 Microsoft 365 中的整合尚有優化空間，但未來很值得期待。" }
];

// Generate extra statistical filler data to make graphs look rich (e.g. 50+ total votes)
function generateStatFiller() {
    const data = [...DEFAULT_SEED_DATA];
    const platforms = ["ChatGPT", "ChatGPT", "ChatGPT", "Claude", "Claude", "Gemini", "Copilot", "Midjourney/SD", "Local/OS"];
    const applications = ["Coding", "Coding", "Writing", "Writing", "Research", "Design", "Business", "Assistant"];
    const frequencies = ["Daily", "DailyOnce", "Weekly", "Monthly"];
    const ratings = [3, 4, 4, 5, 5];

    for (let i = 0; i < 45; i++) {
        data.push({
            platform: platforms[Math.floor(Math.random() * platforms.length)],
            application: applications[Math.floor(Math.random() * applications.length)],
            frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
            satisfaction: ratings[Math.floor(Math.random() * ratings.length)],
            comment: "",
            date: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return data;
}

// --- App State Management ---
class VotingApp {
    constructor() {
        this.votes = [];
        this.charts = {};
        
        // DOM Elements
        this.tabs = document.querySelectorAll('.nav-tab');
        this.panels = document.querySelectorAll('.panel');
        this.form = document.getElementById('vote-form');
        this.textarea = this.form.querySelector('textarea[name="comment"]');
        this.charCount = this.form.querySelector('.char-count');
        this.ratingInputs = this.form.querySelectorAll('input[name="satisfaction"]');
        this.ratingLabel = this.form.querySelector('.rating-label');
        
        // Results elements
        this.statTotalVotes = document.getElementById('stat-total-votes');
        this.statAvgRating = document.getElementById('stat-avg-rating');
        this.statTopPlatform = document.getElementById('stat-top-platform');
        this.commentsContainer = document.getElementById('comments-container');
        
        // Buttons
        this.btnReset = document.getElementById('btn-reset');
        this.btnVoteAgain = document.getElementById('btn-vote-again');
        
        this.init();
    }

    init() {
        // Initialize Lucide Icons
        lucide.createIcons();

        // Load votes data
        this.loadData();

        // Setup Event Listeners
        this.setupTabs();
        this.setupForm();
        this.setupControls();

        // Render initial statistics and charts
        this.updateDashboard();
    }

    loadData() {
        const stored = localStorage.getItem('ai_votes');
        if (stored) {
            try {
                this.votes = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse local storage data, resetting", e);
                this.resetToDefaults();
            }
        } else {
            this.resetToDefaults();
        }
    }

    saveData() {
        localStorage.setItem('ai_votes', JSON.stringify(this.votes));
    }

    resetToDefaults() {
        this.votes = generateStatFiller();
        this.saveData();
    }

    // --- Tab Navigation ---
    setupTabs() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanelId = tab.getAttribute('aria-controls');
                
                // Update tabs active state
                this.tabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');

                // Update panels active state
                this.panels.forEach(panel => {
                    if (panel.id === targetPanelId) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                });

                // If switching to results, update dashboard charts sizing
                if (targetPanelId === 'panel-results') {
                    this.updateDashboard();
                }
            });
        });
    }

    // --- Interactive Form Elements ---
    setupForm() {
        // Live character counting for textarea
        this.textarea.addEventListener('input', () => {
            const len = this.textarea.value.length;
            this.charCount.textContent = `${len} / 200`;
            if (len >= 200) {
                this.charCount.style.color = '#f43f5e';
            } else {
                this.charCount.style.color = 'var(--txt-muted)';
            }
        });

        // Dynamic label description for Star Ratings
        const ratingTexts = {
            1: "1★ 非常不滿意",
            2: "2★ 不滿意",
            3: "3★ 普通",
            4: "4★ 滿意",
            5: "5★ 非常滿意"
        };
        
        this.ratingInputs.forEach(input => {
            input.addEventListener('change', () => {
                const val = input.value;
                this.ratingLabel.textContent = ratingTexts[val] || `${val}★`;
                this.ratingLabel.style.color = 'var(--clr-warning)';
                this.ratingLabel.style.fontWeight = '700';
            });
        });

        // Form Submit Handler
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect Form Values
            const formData = new FormData(this.form);
            const newVote = {
                platform: formData.get('platform'),
                application: formData.get('application'),
                frequency: formData.get('frequency'),
                satisfaction: parseInt(formData.get('satisfaction')),
                comment: formData.get('comment').trim(),
                date: new Date().toISOString()
            };

            // Save new vote
            this.votes.unshift(newVote); // add to the beginning
            this.saveData();

            // Success feedback animations
            const submitBtn = document.getElementById('btn-submit');
            const originalHTML = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.style.background = 'linear-gradient(135deg, var(--clr-accent) 0%, #059669 100%)';
            submitBtn.innerHTML = `<span>提交成功！正在跳轉結果...</span> <i data-lucide="check-circle" class="btn-icon"></i>`;
            lucide.createIcons();

            setTimeout(() => {
                // Reset button status
                submitBtn.disabled = false;
                submitBtn.style.background = '';
                submitBtn.innerHTML = originalHTML;
                lucide.createIcons();

                // Clear Form
                this.form.reset();
                this.charCount.textContent = `0 / 200`;
                this.ratingLabel.textContent = "請評分";
                this.ratingLabel.style.color = '';
                this.ratingLabel.style.fontWeight = '';

                // Programmatically switch to results tab
                document.getElementById('tab-results').click();
            }, 1200);
        });
    }

    // --- Control Settings Action ---
    setupControls() {
        // Reset local data
        this.btnReset.addEventListener('click', () => {
            if (confirm("確定要重設本機數據嗎？這會清除您目前的新投票，並還原成預設的展示數據。")) {
                this.resetToDefaults();
                this.updateDashboard();
                
                // Brief visual feedback on button
                const btnContent = this.btnReset.innerHTML;
                this.btnReset.innerHTML = `<i data-lucide="check"></i> <span>已重設完成</span>`;
                lucide.createIcons();
                setTimeout(() => {
                    this.btnReset.innerHTML = btnContent;
                    lucide.createIcons();
                }, 1500);
            }
        });

        // Vote Again
        this.btnVoteAgain.addEventListener('click', () => {
            document.getElementById('tab-vote').click();
        });
    }

    // --- Dashboard Visualization & Stats ---
    updateDashboard() {
        const total = this.votes.length;
        this.statTotalVotes.textContent = total;

        if (total === 0) {
            this.statAvgRating.textContent = "0.0";
            this.statTopPlatform.textContent = "無資料";
            this.renderCharts({ platforms: {}, applications: {} });
            this.renderComments();
            return;
        }

        // 1. Calculate Average Rating
        const sumSatisfaction = this.votes.reduce((acc, curr) => acc + curr.satisfaction, 0);
        const avgRating = (sumSatisfaction / total).toFixed(1);
        this.statAvgRating.textContent = avgRating;

        // 2. Count statistics for platforms and applications
        const platformCounts = {};
        const appCounts = {};

        this.votes.forEach(vote => {
            platformCounts[vote.platform] = (platformCounts[vote.platform] || 0) + 1;
            appCounts[vote.application] = (appCounts[vote.application] || 0) + 1;
        });

        // 3. Find top platform
        let topPlatform = "-";
        let maxCount = -1;
        Object.entries(platformCounts).forEach(([name, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topPlatform = name;
            }
        });
        
        // Format Platform Display Name if needed
        const platformNamesMap = {
            "Midjourney/SD": "MJ / SD",
            "Local/OS": "開源/本地",
            "ChatGPT": "ChatGPT",
            "Claude": "Claude",
            "Gemini": "Gemini",
            "Copilot": "Copilot"
        };
        this.statTopPlatform.textContent = platformNamesMap[topPlatform] || topPlatform;

        // 4. Render Charts and Comments
        this.renderCharts(platformCounts, appCounts);
        this.renderComments();
    }

    renderCharts(platformCounts, appCounts) {
        // --- Platform Donut Chart ---
        const platformLabels = ["ChatGPT", "Claude", "Gemini", "Microsoft Copilot", "Midjourney / SD", "開源 / 本地模型"];
        const platformKeys = ["ChatGPT", "Claude", "Gemini", "Copilot", "Midjourney/SD", "Local/OS"];
        const platformColors = ["#10b981", "#f59e0b", "#3b82f6", "#a855f7", "#ec4899", "#94a3b8"];
        const platformValues = platformKeys.map(key => platformCounts[key] || 0);

        if (this.charts.platforms) {
            this.charts.platforms.data.datasets[0].data = platformValues;
            this.charts.platforms.update();
        } else {
            const ctx1 = document.getElementById('chart-platforms').getContext('2d');
            this.charts.platforms = new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: platformLabels,
                    datasets: [{
                        data: platformValues,
                        backgroundColor: platformColors,
                        borderWidth: 2,
                        borderColor: '#1e1b4b',
                        hoverOffset: 12
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#9ca3af',
                                font: {
                                    family: 'Outfit, Noto Sans TC',
                                    size: 11
                                },
                                padding: 12,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const val = context.raw || 0;
                                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                                    return ` ${context.label}: ${val} 票 (${pct}%)`;
                                }
                            }
                        }
                    },
                    cutout: '65%'
                }
            });
        }

        // --- Application Areas Bar Chart ---
        const appLabels = ["程式開發", "寫作創作/翻譯", "學術研究/資料", "影像/設計", "商務企劃/辦公", "個人生活秘書"];
        const appKeys = ["Coding", "Writing", "Research", "Design", "Business", "Assistant"];
        const appValues = appKeys.map(key => appCounts[key] || 0);

        if (this.charts.applications) {
            this.charts.applications.data.datasets[0].data = appValues;
            this.charts.applications.update();
        } else {
            const ctx2 = document.getElementById('chart-applications').getContext('2d');
            this.charts.applications = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: appLabels,
                    datasets: [{
                        label: '得票數',
                        data: appValues,
                        backgroundColor: function(context) {
                            const chart = context.chart;
                            const {ctx, chartArea} = chart;
                            if (!chartArea) return null;
                            
                            // Return horizontal gradient
                            const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                            gradient.addColorStop(0, '#06b6d4');
                            gradient.addColorStop(1, '#8b5cf6');
                            return gradient;
                        },
                        borderRadius: 8,
                        borderWidth: 0,
                        barThickness: 16
                    }]
                },
                options: {
                    indexAxis: 'y', // Makes it a horizontal bar chart
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)'
                            },
                            ticks: {
                                color: '#9ca3af',
                                precision: 0,
                                font: {
                                    family: 'Outfit, Noto Sans TC'
                                }
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#f3f4f6',
                                font: {
                                    family: 'Outfit, Noto Sans TC',
                                    size: 12
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }

    renderComments() {
        this.commentsContainer.innerHTML = '';
        
        // Filter votes with comments
        const commentedVotes = this.votes.filter(vote => vote.comment && vote.comment.length > 0);

        if (commentedVotes.length === 0) {
            this.commentsContainer.innerHTML = `
                <div class="no-comments">
                    <i data-lucide="message-square-off" style="width: 2rem; height: 2rem;"></i>
                    <span>目前尚無使用者看法，快去填寫並送出您的意見吧！</span>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        // Display latest 8 comments
        const displayList = commentedVotes.slice(0, 8);
        
        const platformMap = {
            "ChatGPT": "ChatGPT",
            "Claude": "Claude",
            "Gemini": "Gemini",
            "Copilot": "Copilot",
            "Midjourney/SD": "MJ / SD",
            "Local/OS": "本地開源"
        };

        const appMap = {
            "Coding": "程式開發",
            "Writing": "文字創作",
            "Research": "資料學術",
            "Design": "影像設計",
            "Business": "日常辦公",
            "Assistant": "個人生活"
        };

        displayList.forEach((vote, idx) => {
            const bubble = document.createElement('div');
            bubble.className = 'comment-bubble';
            
            // Build stars string
            let starsHTML = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= vote.satisfaction) {
                    starsHTML += '★';
                } else {
                    starsHTML += '☆';
                }
            }

            bubble.innerHTML = `
                <div class="comment-header">
                    <div class="comment-user-info">
                        <span>#${idx + 1} 匿名使用者</span>
                        <span class="comment-tag tag-platform">${platformMap[vote.platform] || vote.platform}</span>
                        <span class="comment-tag" style="background: rgba(255,255,255,0.05); color: var(--txt-secondary);">${appMap[vote.application] || vote.application}</span>
                    </div>
                    <div class="comment-rating" title="滿意度: ${vote.satisfaction}顆星">${starsHTML}</div>
                </div>
                <div class="comment-text">${this.escapeHTML(vote.comment)}</div>
            `;
            this.commentsContainer.appendChild(bubble);
        });
        
        // Refresh newly rendered icons if any
        lucide.createIcons();
    }

    escapeHTML(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Instantiate the app when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VotingApp();
});
