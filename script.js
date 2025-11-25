const API_URL = 'https://stocks-rhux.onrender.com/api/prices';
let chartInstance = null;
let currentSymbol = '';
let isCandle = false; // Toggle state

// Map symbols to types for styling
const ASSET_TYPES = {
    'BTC': 'crypto', 'ETH': 'crypto', 'SOL': 'crypto',
    'GOLD': 'metal', 'SILVER': 'metal'
};

// 1. Initialize & Poll Data
document.addEventListener('DOMContentLoaded', () => {
    fetchPrices();
    setInterval(fetchPrices, 3000); // 3s Interval as requested
});

async function fetchPrices() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        renderList(data);
        document.getElementById('loading').style.display = 'none';
    } catch (err) {
        console.error("API Error:", err);
    }
}

// 2. Render the List
function renderList(data) {
    const container = document.getElementById('stockList');
    container.innerHTML = ''; // Clear current list

    Object.entries(data).forEach(([symbol, info]) => {
        const type = ASSET_TYPES[symbol] || 'stock';
        const changeClass = info.change >= 0 ? 'up' : 'down';
        const changeSign = info.change >= 0 ? '+' : '';
        
        // Create Card HTML
        const card = document.createElement('div');
        card.className = `card type-${type}`;
        card.onclick = () => openModal(symbol, info.price, info.change);
        
        card.innerHTML = `
            <div class="symbol-box">
                <h3 class="neon-text">${symbol}</h3>
                <span style="font-size:0.8rem; color:#888;">${type.toUpperCase()}</span>
            </div>
            <div class="price-box">
                <span class="price">$${info.price.toLocaleString()}</span>
                <span class="change ${changeClass}">${changeSign}${info.change.toFixed(2)}%</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. Modal & Chart Logic
function openModal(symbol, price, change) {
    currentSymbol = symbol;
    document.getElementById('modalSymbol').innerText = symbol;
    document.getElementById('chartModal').style.display = 'block';
    
    // Set Analyst Vision (Mock logic based on trend)
    const sentiment = change >= 0 ? "Bullish (Strong Buy)" : "Bearish (Correction)";
    const ltSentiment = change >= -2 ? "Bullish (Above 200 MA)" : "Neutral";
    
    document.getElementById('st-vision').innerText = sentiment;
    document.getElementById('st-vision').className = change >= 0 ? 'up' : 'down';
    document.getElementById('lt-vision').innerText = ltSentiment;

    // Render default 5Y chart
    renderChart('5Y', price);
}

function closeModal() {
    document.getElementById('chartModal').style.display = 'none';
}

function updateTime(btn, timeframe) {
    // Update active button UI
    document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Re-render chart
    // In a real app, we would fetch history here. 
    // For now, we simulate history based on the timeframe.
    renderChart(timeframe); 
}

function toggleChartStyle() {
    isCandle = !isCandle;
    const btn = document.querySelector('.style-btn');
    btn.innerText = isCandle ? '📈 Line' : '🕯 Candles';
    
    const activeTime = document.querySelector('.t-btn.active').innerText;
    renderChart(activeTime);
}

// 4. ApexCharts Rendering (Simulated History)
function renderChart(timeframe, basePrice = 150) {
    // Generate mock data points count
    let count = 50;
    if(timeframe === '1D') count = 24;
    if(timeframe === '5Y') count = 150;
    if(timeframe === '3Y') count = 100;

    const data = generateData(count, basePrice);

    const options = {
        series: [{
            name: currentSymbol,
            data: data
        }],
        chart: {
            type: isCandle ? 'candlestick' : 'area',
            height: 350,
            background: 'transparent', // Glass effect
            toolbar: { show: false },
            animations: { enabled: true }
        },
        theme: { mode: 'dark' },
        colors: [isCandle ? '#00ff9d' : '#00f3ff'], // Green for candles, Cyan for area
        stroke: {
            width: isCandle ? 1 : 2,
            curve: 'smooth'
        },
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1 }
        },
        grid: {
            borderColor: 'rgba(255,255,255,0.1)',
            strokeDashArray: 4
        },
        xaxis: {
            type: 'datetime',
            tooltip: { enabled: false },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            opposite: true,
            tooltip: { enabled: true }
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#00ff9d',
                    downward: '#ff4d4d'
                }
            }
        }
    };

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new ApexCharts(document.querySelector("#chartContainer"), options);
    chartInstance.render();
}

// Helper to generate realistic looking candle/line data
function generateData(count, startPrice = 150) {
    let series = [];
    let date = new Date();
    date.setDate(date.getDate() - count);
    let price = startPrice || 150;

    for (let i = 0; i < count; i++) {
        let open = price;
        let close = price + (Math.random() - 0.5) * 5;
        let high = Math.max(open, close) + Math.random() * 2;
        let low = Math.min(open, close) - Math.random() * 2;

        // ApexCharts format: { x: date, y: [O, H, L, C] }
        // Logic: If Line chart, Apex uses the first or last value automatically, 
        // but for Area we ideally want just 'y: close'. Apex handles array y for area too (uses index 0 usually).
        // To be safe, let's always send OHLC format, Apex handles it.
        
        series.push({
            x: date.getTime(),
            y: [open.toFixed(2), high.toFixed(2), low.toFixed(2), close.toFixed(2)]
        });
        
        price = close;
        date.setDate(date.getDate() + 1);
    }
    return series;
}
