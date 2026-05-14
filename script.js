document.addEventListener('DOMContentLoaded', function() {
    var graphDiv = document.getElementById('ideology-graph');
    
    // 1. 處理圖表點擊事件與自訂彈出視窗
    if (graphDiv) {
        graphDiv.on('plotly_click', function(data) {
            if (!data || !data.points || data.points.length === 0) return;
            var pt = data.points[0];
            var ideology = pt.hovertext || pt.text || pt.data.name || '未知';
            var custom = pt.customdata || ['無資料', '無資料', '無資料'];
            var category = custom[0] || '';
            var description = custom[1] || '';
            var history = custom[2] || '';
            var x = pt.x !== undefined ? pt.x : '';
            var y = pt.y !== undefined ? pt.y : '';

            var searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(ideology);
            var popup = document.getElementById('custom-popup');

            // 使用 Template Literals 與已定義好的 CSS classes 結合
            popup.innerHTML = `
                <button class="close-btn" onclick="document.getElementById('custom-popup').style.display='none'">✖</button>
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
    var urlParams = new URLSearchParams(window.location.search);
    var userX = urlParams.get('x');
    var userY = urlParams.get('y');

    if (userX !== null && userY !== null && graphDiv) {
        Plotly.addTraces('ideology-graph', {
            x: [parseFloat(userX)],
            y: [parseFloat(userY)],
            mode: 'markers',
            marker: { size: 24, color: '#FFD700', symbol: 'star', line: {width: 2, color: '#e67e22'} },
            hoverinfo: 'text',
            hovertext: '測驗座標：(' + userX + ', ' + userY + ')'
        });

        var userAnnotation = {
            x: parseFloat(userX), y: parseFloat(userY), text: '<b>⭐ 你的位置</b>',
            font: { size: 15, color: '#d35400', family: '"微軟正黑體", sans-serif' },
            showarrow: true, arrowhead: 2, arrowwidth: 2, arrowcolor: '#e67e22',
            ax: 0, ay: -45, bgcolor: 'rgba(255, 255, 255, 0.95)',
            bordercolor: '#e67e22', borderwidth: 2, borderpad: 6
        };
        
        var annIndex = (graphDiv.layout.annotations || []).length;
        var update = {};
        update['annotations[' + annIndex + ']'] = userAnnotation;
        Plotly.relayout('ideology-graph', update);
    }
});