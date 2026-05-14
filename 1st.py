import pandas as pd
import plotly.express as px

# 1. 資料處理精簡：直接用 fillna 處理預設值
df = pd.read_json('data.json')
if 'text_position' not in df.columns:
    df['text_position'] = 'top center'
df['text_position'] = df['text_position'].fillna('top center')
df[['x', 'y']] = df[['x', 'y']].astype(float)

# 2. 繪圖與基本配置
fig = px.scatter(df, x="x", y="y", text="ideology", hover_name="ideology", 
                 hover_data=["category", "description", "history"])

fig.update_traces(textposition=df['text_position'], 
                  hovertemplate="<b>%{hovertext}</b><br><br><b>分類：</b>%{customdata[0]}<br><b>簡介：</b>%{customdata[1]}<br><b>歷史：</b>%{customdata[2]}<br><br><b>經濟評分：</b>%{x} | <b>權力評分：</b>%{y}<extra></extra>")

# 3. 循環處理背景色塊 (避免重複寫 4 次 add_shape)
quadrants = [
    (-9999, 0, 0, 9999, "#FADBD8"), # 左上-紅
    (0, 0, 9999, 9999, "#D6EAF8"),  # 右上-藍
    (-9999, -9999, 0, 0, "#D5F5E3"),# 左下-綠
    (0, -9999, 9999, 0, "#FCF3CF")  # 右下-黃
]
for x0, y0, x1, y1, color in quadrants:
    fig.add_shape(type="rect", x0=x0, y0=y0, x1=x1, y1=y1, fillcolor=color, layer="below", line_width=0)

# 4. 合併 Layout 更新 (集中管理美化參數)
fig.update_layout(
    xaxis=dict(range=[-105, 105], title="← 經濟光譜 →", dtick=20, zeroline=True, zerolinewidth=2, zerolinecolor='rgba(0,0,0,0.3)', title_standoff=40), # 稍微增加 standoff 把標題往下推
    yaxis=dict(range=[-105, 105], title="← 權力光譜 →", dtick=20, zeroline=True, zerolinewidth=2, zerolinecolor='rgba(0,0,0,0.3)', title_standoff=30),
    hoverlabel=dict(bgcolor="rgba(255, 255, 255, 0.95)", bordercolor="rgba(0,0,0,0)", font_size=13, font_color="#333"),
    modebar=dict(bgcolor="rgba(255, 255, 255, 0.7)", color="#888", activecolor="#333"),
    margin=dict(l=50, r=50, t=50, b=80), # 增加底部留白以容納標籤與軸標題，避免被裁切
    dragmode='pan' # 預設改為平移，避免單指誤觸框選放大，提昇手機滑動體驗
)

# 5. 集中標籤設定
annotations = [
    (0.5, 1, "威權 (Authoritarian)", 0, 20),
    (0.5, 0, "自由 (Libertarian)", 0, -30), # 將 yshift 改為 -30，安插在刻度與經濟光譜之間
    (0, 0.5, "左派 (Left)", -90, -35),
    (1, 0.5, "右派 (Right)", -90, 20)
]
for x, y, text, angle, shift in annotations:
    # 簡化標籤邏輯，統一設定 anchor
    anchor_opts = {'xanchor': 'right' if x == 0 else 'left' if x == 1 else 'center',
                   'yanchor': 'bottom' if y == 1 else 'top' if y == 0 else 'middle'}
    fig.add_annotation(x=x, y=y, text=text, showarrow=False, font=dict(size=14), 
                       xref="paper", yref="paper", textangle=angle, 
                       **anchor_opts, xshift=shift if angle == -90 else 0, yshift=shift if angle != -90 else 0)

# 新增：點擊提示標籤，讓使用者知道可以點擊互動
fig.add_annotation(
    x=0.01, y=0.99, xref="paper", yref="paper",
    text="💡 <b>提示：點擊地圖上的點可查看詳細介紹</b>",
    showarrow=False, font=dict(size=13, color="#d35400"),
    bgcolor="rgba(255, 255, 255, 0.85)", bordercolor="#e67e22",
    borderwidth=1.5, borderpad=6, xanchor="left", yanchor="top"
)

# 設定配置，加入 responsive=True 讓行動裝置能自適應縮放
config_settings = {
    'scrollZoom': True, 'displayModeBar': 'hover', 'displaylogo': False, 
    'modeBarButtonsToRemove': ['zoom2d', 'select2d', 'lasso2d'], 'responsive': True
}

# 注意：fig.show() 產生的預覽畫面不支援自訂 JavaScript 功能！
# 請先註解掉這行，並直接去資料夾打開生成的 index.html 來測試點擊浮窗。
# fig.show(config=config_settings)

# 6. 生成圖表 HTML 區塊並與前端模板整合
# 匯出 Plotly 為一個沒有完整 HTML 結構的獨立區塊 (full_html=False)
plot_html = fig.to_html(config=config_settings, include_plotlyjs="cdn", 
                        full_html=False, default_width="100%", default_height="100vh",
                        div_id="ideology-graph")

# 讀取外部獨立的 HTML 模板檔案
try:
    with open("template.html", "r", encoding="utf-8") as f:
        template = f.read()
except FileNotFoundError:
    print("❌ 找不到 template.html，請確保它在同一個資料夾。")
    exit(1)

# 將圖表注入模板，組裝為最終網頁
final_html = template.replace("{{ PLOTLY_GRAPH }}", plot_html)

with open("map.html", "w", encoding="utf-8") as f:
    f.write(final_html)

print("✅ 已經成功生成 map.html，請用瀏覽器開啟 map.html 來測試點擊浮窗功能！")