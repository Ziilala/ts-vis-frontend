<template>
  <div class="model-predict">
    <div class="action-bar">
      <h2>模型预测</h2>
      <div class="actions">
        <button class="btn-primary">+ 新建预测任务</button>
        <button class="btn-secondary">刷新任务</button>
      </div>
    </div>

    <div class="task-cards">
      <div class="task-card">
        <div class="task-header">
          <h4>电流 (A) 24h预测</h4>
          <span class="status-badge completed">训练完成</span>
        </div>
        <div class="task-actions">
          <button class="btn-sm" @click="viewResult">查看结果</button>
          <button class="btn-sm">重新训练</button>
          <button class="btn-sm danger">删除</button>
        </div>
      </div>
    </div>

    <div v-if="showPredictionView" class="prediction-view">
      <div class="view-header">
        <h3>电流 (A) 24h预测 - 预测结果</h3>
        <div class="metrics">
          <div class="metric-card">
            <span class="metric-label">{{ hoverLabel }}</span>
            <span class="metric-value">{{ hoverValue }}℃</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">置信上限</span>
            <span class="metric-value upper">{{ hoverUpper }}℃</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">置信下限</span>
            <span class="metric-value lower">{{ hoverLower }}℃</span>
          </div>
        </div>
      </div>

      <div class="chart-container" ref="chartContainer">
        <canvas id="predictionChart"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const showPredictionView = ref(false);

const hoverLabel = ref('预测值');
const hoverValue = ref('__.__');
const hoverUpper = ref('__.__');
const hoverLower = ref('__.__');

let currentChartData = [];

const renderChart = () => {
  const canvas = document.getElementById('predictionChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = 400;
  
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);
  
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  const dataPoints = [];
  const centerY = height / 2;
  const amplitude = 50;
  const frequency = 0.05;
  
  for (let i = 0; i <= width / 2; i += 2) {
    const x = i;
    const y = centerY + Math.sin(i * frequency) * amplitude;
    const value = 20 + Math.sin(i * frequency) * 5;
    dataPoints.push({ x, y, value, type: 'history' });
  }
  
  for (let i = width / 2; i <= width; i += 2) {
    const x = i;
    const trend = (i - width / 2) * 0.1;
    const y = centerY + Math.sin(i * frequency) * amplitude + trend;
    const value = 20 + Math.sin(i * frequency) * 5 + trend * 0.5;
    dataPoints.push({ x, y, value, type: 'prediction' });
  }
  
  ctx.beginPath();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  dataPoints.filter(p => p.type === 'history').forEach((point, idx) => {
    if (idx === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  
  ctx.beginPath();
  ctx.strokeStyle = '#facc15';
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 2;
  dataPoints.filter(p => p.type === 'prediction').forEach((point, idx) => {
    if (idx === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
  ctx.beginPath();
  const predPoints = dataPoints.filter(p => p.type === 'prediction');
  for (let i = 0; i < predPoints.length; i++) {
    const point = predPoints[i];
    if (i === 0) ctx.moveTo(point.x, point.y - 30);
    else ctx.lineTo(point.x, point.y - 30);
  }
  for (let i = predPoints.length - 1; i >= 0; i--) {
    const point = predPoints[i];
    ctx.lineTo(point.x, point.y + 30);
  }
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText('历史数据', 50, 30);
  ctx.fillText('预测数据', width - 100, 30);
  ctx.fillText('当前时间', width / 2 - 30, height - 10);
  
  canvas.chartData = dataPoints;
  currentChartData = dataPoints;
};

const handleMouseMove = (e) => {
  const canvas = document.getElementById('predictionChart');
  if (!canvas || !currentChartData.length) return;
  
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  
  let nearestPoint = null;
  let minDistance = Infinity;
  
  for (const point of currentChartData) {
    const distance = Math.abs(point.x - mouseX);
    if (distance < minDistance && distance < 25) {
      minDistance = distance;
      nearestPoint = point;
    }
  }
  
  const existingTooltip = document.getElementById('chartTooltip');
  if (existingTooltip) existingTooltip.remove();
  
  renderChart();
  
  if (nearestPoint) {
    if (nearestPoint.type === 'prediction') {
      hoverLabel.value = '预测值';
      hoverValue.value = nearestPoint.value.toFixed(2);
      hoverUpper.value = (nearestPoint.value + 3).toFixed(2);
      hoverLower.value = (nearestPoint.value - 3).toFixed(2);
    } else {
      hoverLabel.value = '实际值';
      hoverValue.value = nearestPoint.value.toFixed(2);
      hoverUpper.value = '__.__';
      hoverLower.value = '__.__';
    }
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(nearestPoint.x, 0);
    ctx.lineTo(nearestPoint.x, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(nearestPoint.x, nearestPoint.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(nearestPoint.x, nearestPoint.y, 4, 0, Math.PI * 2);
    ctx.stroke();
    
    const tooltip = document.createElement('div');
    tooltip.id = 'chartTooltip';
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid #38bdf8;
      border-radius: 6px;
      padding: 8px 12px;
      color: #e2e8f0;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      left: ${e.clientX + 10}px;
      top: ${e.clientY - 40}px;
      min-width: 160px;
    `;
    
    const timeLabel = nearestPoint.type === 'history' ? '历史时刻' : '预测时刻';
    const valueLabel = nearestPoint.type === 'history' ? '实际值' : '预测值';
    
    tooltip.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px; color: #38bdf8;">${timeLabel}</div>
      <div>${valueLabel}: <span style="color: ${nearestPoint.type === 'history' ? '#38bdf8' : '#facc15'}; font-weight: bold;">${nearestPoint.value.toFixed(3)}℃</span></div>
      ${nearestPoint.type === 'prediction' ? `
        <div style="margin-top: 4px; font-size: 11px; color: #94a3b8;">
          置信区间：${(nearestPoint.value - 3).toFixed(1)} ~ ${(nearestPoint.value + 3).toFixed(1)}℃
        </div>
      ` : ''}
    `;
    
    document.body.appendChild(tooltip);
  } else {
    hoverLabel.value = '预测值';
    hoverValue.value = '__.__';
    hoverUpper.value = '__.__';
    hoverLower.value = '__.__';
  }
};

const handleMouseLeave = () => {
  const existingTooltip = document.getElementById('chartTooltip');
  if (existingTooltip) existingTooltip.remove();
  
  hoverLabel.value = '预测值';
  hoverValue.value = '__.__';
  hoverUpper.value = '__.__';
  hoverLower.value = '__.__';
  
  renderChart();
};

const setupChartEvents = () => {
  const canvas = document.getElementById('predictionChart');
  if (canvas) {
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
  }
};

const viewResult = () => {
  showPredictionView.value = true;
  nextTick(() => {
    renderChart();
    setupChartEvents();
  });
};

onMounted(() => {});

onUnmounted(() => {
  const canvas = document.getElementById('predictionChart');
  if (canvas) {
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
  }
});
</script>

<style scoped>
.model-predict { padding: 20px; color: #e2e8f0; font-family: sans-serif; }
.action-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.actions button { margin-left: 10px; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: 500; }
.btn-primary { background: #0ea5e9; color: white; }
.btn-secondary { background: #475569; color: white; }

.task-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
.task-card { background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; border-radius: 8px; padding: 20px 16px; cursor: pointer; transition: all 0.2s; }
.task-card:hover { border-color: #38bdf8; transform: translateY(-2px); }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.task-header h4 { margin: 0; font-size: 1em; color: #f1f5f9; }
.status-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75em; }
.status-badge.completed { background: #166534; color: #4ade80; }
.task-actions { margin-top: 16px; display: flex; gap: 12px; }
.btn-sm { padding: 6px 16px; font-size: 0.8em; background: transparent; border: 1px solid #38bdf8; color: #38bdf8; border-radius: 4px; cursor: pointer; }
.btn-sm.danger { border-color: #f87171; color: #f87171; }

.prediction-view { background: rgba(30, 41, 59, 0.5); border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-top: 20px; }
.view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
.view-header h3 { margin: 0; color: #f1f5f9; }
.metrics { display: flex; gap: 16px; flex-wrap: wrap; }
.metric-card { background: rgba(15, 23, 42, 0.8); padding: 12px 20px; border-radius: 6px; text-align: center; min-width: 100px; }
.metric-label { display: block; font-size: 0.75em; color: #94a3b8; margin-bottom: 4px; }
.metric-value { font-size: 1.2em; font-weight: bold; color: #f1f5f9; }
.metric-value.upper { color: #facc15; }
.metric-value.lower { color: #38bdf8; }

.chart-container { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.chart-container canvas { width: 100%; height: 400px; }
</style>