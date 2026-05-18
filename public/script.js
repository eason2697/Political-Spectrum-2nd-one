document.addEventListener('DOMContentLoaded', function() {
    // 0. 動態新增「返回測驗」按鈕 (優化版)
    // 將樣式注入 <head>，讓 JS 更乾淨，並使用真正的 CSS :hover
    const styleSheet = document.createElement("style");
    styleSheet.innerHTML = `
        .back-to-quiz-btn {
            position: fixed; top: 15px; left: 15px; z-index: 9999;
            background-color: rgba(248, 249, 250, 0.9);
            padding: 8px 12px;
            border: 2px solid #333;
            border-radius: 8px;
            text-decoration: none;
            color: #333;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
            transition: all 0.2s;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px); /* 兼容 Safari */
        }
        .back-to-quiz-btn:hover {
            background-color: rgba(233, 236, 239, 1);
            transform: scale(1.05);
        }
        .reset-zoom-btn {
            position: fixed; bottom: 25px; right: 25px; z-index: 9999;
            background-color: rgba(255, 255, 255, 0.95);
            padding: 12px 18px;
            border: 2px solid #333;
            border-radius: 25px; /* 圓角膠囊狀，適合手機點擊 */
            color: #333;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            transition: all 0.2s;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            cursor: pointer;
        }
        .reset-zoom-btn:hover {
            background-color: rgba(233, 236, 239, 1);
            transform: scale(1.05);
        }
        /* 新增：用來強制隱藏 Plotly 懸浮窗的 CSS */
        .hide-plotly-hover .hoverlayer {
            display: none !important;
        }
    `;
    document.head.appendChild(styleSheet);

    // 建立按鈕並套用 class
    const backBtn = document.createElement('a');
    backBtn.href = 'index.html'; // 假設您的測驗首頁是 index.html，若不同請自行更改
    backBtn.innerHTML = '⬅ 返回測驗';
    backBtn.className = 'back-to-quiz-btn';
    document.body.appendChild(backBtn);

    // 建立「重設縮放」按鈕並套用 class
    const resetBtn = document.createElement('button');
    resetBtn.innerHTML = '🔍 重設縮放';
    resetBtn.className = 'reset-zoom-btn';
    resetBtn.onclick = function() {
        const graph = document.getElementById('ideology-graph');
        if (graph) {
            // 呼叫 Plotly 的 relayout 將視角強制拉回預設範圍
            Plotly.relayout(graph, { 'xaxis.range': [-105, 105], 'yaxis.range': [-105, 105] });
        }
    };
    document.body.appendChild(resetBtn);

    const graphDiv = document.getElementById('ideology-graph');
    
    // NEW: Function to close popup and restore hover functionality
    window.closeCustomPopup = function() {
        const popup = document.getElementById('custom-popup');
        if (popup) {
            popup.style.display = 'none';
        }

        if (graphDiv) {
            // 恢復顯示懸浮提示
            graphDiv.classList.remove('hide-plotly-hover');
        }
    };

    // 1. 處理圖表點擊事件與自訂彈出視窗
    if (graphDiv) {
        graphDiv.on('plotly_click', function(data) {
            if (!data || !data.points || data.points.length === 0) return;

            // 當彈出視窗顯示時，透過 CSS 強制隱藏懸浮提示，避免重疊
            graphDiv.classList.add('hide-plotly-hover');

            var pt = data.points[0];
            var ideology = pt.hovertext || pt.text || pt.data.name || '未知';
            // 使用 ES6 解構賦值，讓程式碼更簡潔
            const [category, description, history] = pt.customdata || ['無資料', '無資料', '無資料'];
            const x = pt.x !== undefined ? pt.x.toFixed(1) : '';
            const y = pt.y !== undefined ? pt.y.toFixed(1) : '';

            var searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(ideology);
            var popup = document.getElementById('custom-popup');

            // 使用 Template Literals 與已定義好的 CSS classes 結合
            popup.innerHTML = `
                <button class="close-btn" onclick="window.closeCustomPopup()">✖</button>
                <h3 style="margin: 0 0 12px 0; font-size: 20px; color: #111;">${ideology}</h3>
                <div class="popup-content">
                    <p><b>分類：</b>${category}</p>
                    <p><b>簡介：</b>${description}</p>
                    <p><b>歷史：</b>${history}</p>
                    <p><b>經濟評分：</b>${x} | <b>權力評分：</b>${y}</p>
                    <p style="color: #666;"><b>註：經濟及權利評分為政府的把持程度，愈高則愈收緊</b></p>
                </div>
                <a href="${searchUrl}" target="_blank" class="search-btn">🔍 查詢相關資訊</a>
            `;
            popup.style.display = 'block';
        });
    }

    // 2. 處理 URL 參數與動態新增使用者標記
    const urlParams = new URLSearchParams(window.location.search);
    const userX = urlParams.get('x');
    const userY = urlParams.get('y');

    if (userX !== null && userY !== null && graphDiv) {
        // 設定一小段延遲，確保 Plotly 圖表已經完全渲染並產生 layout 物件
        setTimeout(function() {
            const x = parseFloat(userX);
            const y = parseFloat(userY);

            // 新增：驗證 URL 傳入的座標是否為有效數字
            if (isNaN(x) || isNaN(y)) {
                console.error("URL 中提供的座標無效:", { userX, userY });
                return; // 如果座標無效，則停止執行
            }

            Plotly.addTraces('ideology-graph', {
                x: [x],
                y: [y],
                mode: 'markers',
                name: '你的位置',
                showlegend: false,
                marker: { size: 24, color: '#FFD700', symbol: 'star', line: {width: 2, color: '#e67e22'} },
                hoverinfo: 'text',
                hovertext: '測驗座標：(' + userX + ', ' + userY + ')'
            });

            var userAnnotation = {
                x: x, y: y, text: '<b>⭐ 你的位置</b>',
                font: { size: 15, color: '#d35400', family: '"微軟正黑體", sans-serif' },
                showarrow: true, arrowhead: 2, arrowwidth: 2, arrowcolor: '#e67e22',
                ax: 0, ay: -45, bgcolor: 'rgba(255, 255, 255, 0.95)',
                bordercolor: '#e67e22', borderwidth: 2, borderpad: 6
            };
            
            // 優化：使用更現代且安全的方式來新增 annotation
            const currentLayout = graphDiv.layout || {};
            const existingAnnotations = currentLayout.annotations || [];
            Plotly.relayout('ideology-graph', { annotations: [...existingAnnotations, userAnnotation] });

        }, 300);
    }
});