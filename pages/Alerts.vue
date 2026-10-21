<template>
  <div class="alerts-page">
    <div class="stats-bar">
      <div class="stat-card critical">
        <span class="stat-label">严重异常 (&gt;25%)</span>
        <span class="stat-value">0</span>
      </div>
      <div class="stat-card warning">
        <span class="stat-label">显著偏差 (15%&lt;x&lt;25%)</span>
        <span class="stat-value">0</span>
      </div>
      <div class="stat-card info">
        <span class="stat-label">轻度偏差 (10%&lt;x&lt;15%)</span>
        <span class="stat-value">0</span>
      </div>
      <div class="stat-card total">
        <span class="stat-label">待处理总数</span>
        <span class="stat-value">0</span>
      </div>
    </div>

    <div class="main-content">
      <div class="alerts-list-container">
        <div class="list-header">
          <h3>实时异常监控</h3>
          <button class="btn-clear">清空</button>
        </div>
        <div class="empty-state">
          <p>系统运行正常，暂无异常</p>
        </div>
      </div>

      <div class="empty-detail">
        <p>请点击左侧列表查看异常详情</p>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.alerts-page {
  padding: 12px;
  color: #e2e8f0;
  font-family: 'Inter', sans-serif;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #020617;
}
.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.stat-card {
  background: rgba(30, 41, 59, 0.6);
  padding: 10px 8px;
  border-radius: 8px;
  text-align: center;
  border-left: 3px solid transparent;
}
.stat-card.critical { border-left-color: #ef4444; }
.stat-card.warning { border-left-color: #f97316; }
.stat-card.info { border-left-color: #3b82f6; }
.stat-card.total { border-left-color: #10b981; }
.stat-label {
  display: block;
  font-size: 0.7em;
  color: #94a3b8;
  margin-bottom: 5px;
}
.stat-value {
  font-size: 1.5em;
  font-weight: 700;
  color: #f1f5f9;
}
.main-content {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
}
.alerts-list-container {
  width: 300px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.list-header h3 {
  margin: 0;
  font-size: 0.85em;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.btn-clear {
  background: transparent;
  border: 1px solid #334155;
  color: #64748b;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.6em;
  white-space: nowrap;
  flex-shrink: 0;
  width: auto;
  min-width: auto;
  letter-spacing: 0;
}
.btn-clear:hover {
  border-color: #ef4444;
  color: #ef4444;
}
.empty-state {
  text-align: center;
  padding: 25px 12px;
  color: #64748b;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px dashed #1e293b;
  border-radius: 8px;
}
.empty-state div {
  font-size: 2em;
  margin-bottom: 8px;
  opacity: 0.5;
}
.empty-state p {
  font-size: 0.8em;
  margin: 0;
}
.empty-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #475569;
  border: 1px dashed #1e293b;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.3);
}
.empty-detail div {
  font-size: 3em;
  margin-bottom: 10px;
}
.empty-detail p {
  font-size: 0.85em;
  margin: 0;
}
</style>