<template>
  <div class="page-card">
    <div class="charts-section">
      <div class="chart-block">
        <h3 class="chart-heading">相关性热力图</h3>
        <div ref="heatmapRef" class="chart-box"></div>
      </div>

      <div class="chart-block">
        <h3 class="chart-heading">特征散点图</h3>
        <div class="scatter-controls">
          <label>
            X 轴：
            <select v-model="scatterX">
              <option v-for="f in multiFields" :key="f" :value="f">{{ fieldLabel(f) }}</option>
            </select>
          </label>
          <label>
            Y 轴：
            <select v-model="scatterY">
              <option v-for="f in multiFields" :key="f" :value="f">{{ fieldLabel(f) }}</option>
            </select>
          </label>
        </div>
        <div ref="scatterRef" class="chart-box"></div>
      </div>

      <div class="chart-block">
        <h3 class="chart-heading">STL 时序分解</h3>
        <div class="stl-controls">
          <label>
            选择特征：
            <select v-model="stlField">
              <option v-for="f in multiFields" :key="f" :value="f">{{ fieldLabel(f) }}</option>
            </select>
          </label>
        </div>
        <div ref="stlRef" class="chart-box-tall"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { fetchMultiFeatures } from '../api'

const FIELD_LABELS = {
  vibration: '振动（vibration）',
  rpm: '转速（rpm）',
  heart_rate: '心率（heart_rate）',
  blood_pressure: '血压（blood_pressure）',
  voltage: '电压（voltage）',
  current: '电流（current）',
  capacitance: '电容（capacitance）',
  temperature: '温度（temperature）'
}

function fieldLabel(field) {
  if (!field) return ''
  return FIELD_LABELS[field] || field
}

const heatmapRef = ref(null)
const scatterRef = ref(null)
const stlRef = ref(null)

let heatmapChart = null
let scatterChart = null
let stlChart = null

const multiFields = ref([])
const multiData = ref([])

const scatterX = ref('')
const scatterY = ref('')
const stlField = ref('')

function computeCorrelation(data, fieldA, fieldB) {
  const pairs = []
  for (const row of data) {
    const a = parseFloat(row[fieldA])
    const b = parseFloat(row[fieldB])
    if (!isNaN(a) && !isNaN(b)) pairs.push([a, b])
  }
  const n = pairs.length
  if (n === 0) return 0
  const meanA = pairs.reduce((s, p) => s + p[0], 0) / n
  const meanB = pairs.reduce((s, p) => s + p[1], 0) / n
  let cov = 0, varA = 0, varB = 0
  for (const [a, b] of pairs) {
    cov += (a - meanA) * (b - meanB)
    varA += Math.pow(a - meanA, 2)
    varB += Math.pow(b - meanB, 2)
  }
  if (varA === 0 || varB === 0) return 0
  return cov / Math.sqrt(varA * varB)
}

function renderHeatmap() {
  if (!heatmapRef.value || multiFields.value.length === 0) return
  if (!heatmapChart) heatmapChart = echarts.init(heatmapRef.value)

  const fields = multiFields.value
  const labels = fields.map(fieldLabel)
  const matrix = []
  for (let i = 0; i < fields.length; i++) {
    for (let j = 0; j < fields.length; j++) {
      const corr = computeCorrelation(multiData.value, fields[i], fields[j])
      matrix.push([j, i, parseFloat(corr.toFixed(3))])
    }
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      formatter: (p) => `${labels[p.data[1]]} vs ${labels[p.data[0]]}<br/>相关系数: ${p.data[2]}`
    },
    grid: { left: 120, right: 40, top: 20, bottom: 90 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#9fb3d6', fontSize: 11, rotate: 30 },
      axisLine: { lineStyle: { color: '#334155' } }
    },
    yAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#9fb3d6', fontSize: 11 },
      axisLine: { lineStyle: { color: '#334155' } }
    },
    visualMap: {
      min: -1,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 10,
      textStyle: { color: '#9fb3d6' },
      inRange: {
        color: ['#2b6cb0', '#63b3ed', '#f7fafc', '#fc8181', '#c53030']
      }
    },
    series: [{
      name: '相关系数',
      type: 'heatmap',
      data: matrix,
      label: {
        show: true,
        color: '#1a202c',
        fontSize: 10,
        formatter: (p) => p.data[2]
      },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' }
      },
      itemStyle: {
        borderColor: '#0f172a',
        borderWidth: 1
      }
    }]
  }

  heatmapChart.setOption(option, true)
}

function renderScatter() {
  if (!scatterRef.value || !scatterX.value || !scatterY.value) return
  if (!scatterChart) scatterChart = echarts.init(scatterRef.value)

  const points = []
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const row of multiData.value) {
    const x = parseFloat(row[scatterX.value])
    const y = parseFloat(row[scatterY.value])
    if (!isNaN(x) && !isNaN(y)) {
      points.push([x, y])
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  const padX = (maxX - minX) * 0.1 || 1
  const padY = (maxY - minY) * 0.1 || 1

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: (p) => `${fieldLabel(scatterX.value)}: ${p.data[0]}<br/>${fieldLabel(scatterY.value)}: ${p.data[1]}`
    },
    grid: { left: 70, right: 40, top: 45, bottom: 55 },
    xAxis: {
      type: 'value',
      name: fieldLabel(scatterX.value),
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: '#9fb3d6' },
      min: parseFloat((minX - padX).toFixed(2)),
      max: parseFloat((maxX + padX).toFixed(2)),
      axisLabel: { color: '#9fb3d6' },
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b' } }
    },
    yAxis: {
      type: 'value',
      name: fieldLabel(scatterY.value),
      nameLocation: 'end',
      nameGap: 15,
      nameTextStyle: { color: '#9fb3d6', align: 'left' },
      min: parseFloat((minY - padY).toFixed(2)),
      max: parseFloat((maxY + padY).toFixed(2)),
      axisLabel: { color: '#9fb3d6' },
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b' } }
    },
    series: [{
      type: 'scatter',
      data: points,
      symbolSize: 8,
      itemStyle: { color: '#38bdf8', opacity: 0.7 }
    }]
  }

  scatterChart.setOption(option, true)
}

function movingAverage(data, windowSize) {
  const result = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(data.length - 1, i + Math.floor(windowSize / 2))
    let sum = 0, count = 0
    for (let j = start; j <= end; j++) {
      sum += data[j]
      count++
    }
    result.push(sum / count)
  }
  return result
}

function stlDecompose(data, period = 12) {
  const trend = movingAverage(data, period * 2 + 1)
  const detrended = data.map((v, i) => v - trend[i])
  const seasonal = new Array(data.length).fill(0)
  for (let i = 0; i < period; i++) {
    let sum = 0, count = 0
    for (let j = i; j < detrended.length; j += period) {
      sum += detrended[j]
      count++
    }
    const avg = count > 0 ? sum / count : 0
    for (let j = i; j < seasonal.length; j += period) {
      seasonal[j] = avg
    }
  }
  const residual = data.map((v, i) => v - trend[i] - seasonal[i])
  return { trend, seasonal, residual }
}

function getRange(arr, padRatio = 0.2) {
  const min = Math.min(...arr)
  const max = Math.max(...arr)
  const pad = (max - min) * padRatio || 1
  return {
    min: parseFloat((min - pad).toFixed(4)),
    max: parseFloat((max + pad).toFixed(4))
  }
}

function renderStl() {
  if (!stlRef.value || !stlField.value) return
  if (!stlChart) stlChart = echarts.init(stlRef.value)

  const rawData = []
  const times = []
  for (const row of multiData.value) {
    const v = parseFloat(row[stlField.value])
    if (!isNaN(v)) {
      rawData.push(v)
      const t = new Date(row.time)
      times.push(`${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`)
    }
  }

  if (rawData.length < 24) return

  const { trend, seasonal, residual } = stlDecompose(rawData, 12)

  const rawRange = getRange(rawData, 0.2)
  const trendRange = getRange(trend, 0.2)
  const seasonalRange = getRange(seasonal, 0.3)
  const residualRange = getRange(residual, 0.3)

  const fieldName = fieldLabel(stlField.value)

  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      data: [`${fieldName} 原始`, `${fieldName} 趋势`, `${fieldName} 周期`, `${fieldName} 残差`],
      textStyle: { color: '#9fb3d6' },
      top: 0
    },
    grid: [
      { left: 80, right: 40, top: 50, height: '17%' },
      { left: 80, right: 40, top: '33%', height: '17%' },
      { left: 80, right: 40, top: '58%', height: '17%' },
      { left: 80, right: 40, top: '83%', height: '13%' }
    ],
    xAxis: [
      { type: 'category', data: times, gridIndex: 0, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#334155' } }, axisTick: { show: false } },
      { type: 'category', data: times, gridIndex: 1, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#334155' } }, axisTick: { show: false } },
      { type: 'category', data: times, gridIndex: 2, axisLabel: { show: false }, axisLine: { lineStyle: { color: '#334155' } }, axisTick: { show: false } },
      { type: 'category', data: times, gridIndex: 3, axisLabel: { color: '#9fb3d6', fontSize: 10 }, axisLine: { lineStyle: { color: '#334155' } } }
    ],
    yAxis: [
      {
        type: 'value', gridIndex: 0, name: '原始',
        nameLocation: 'end', nameGap: 8,
        nameTextStyle: { color: '#9fb3d6', align: 'left', fontSize: 11 },
        min: rawRange.min, max: rawRange.max,
        axisLabel: { color: '#9fb3d6', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      {
        type: 'value', gridIndex: 1, name: '趋势',
        nameLocation: 'end', nameGap: 8,
        nameTextStyle: { color: '#9fb3d6', align: 'left', fontSize: 11 },
        min: trendRange.min, max: trendRange.max,
        axisLabel: { color: '#9fb3d6', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      {
        type: 'value', gridIndex: 2, name: '周期',
        nameLocation: 'end', nameGap: 8,
        nameTextStyle: { color: '#9fb3d6', align: 'left', fontSize: 11 },
        min: seasonalRange.min, max: seasonalRange.max,
        axisLabel: { color: '#9fb3d6', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      {
        type: 'value', gridIndex: 3, name: '残差',
        nameLocation: 'end', nameGap: 8,
        nameTextStyle: { color: '#9fb3d6', align: 'left', fontSize: 11 },
        min: residualRange.min, max: residualRange.max,
        axisLabel: { color: '#9fb3d6', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b' } }
      }
    ],
    series: [
      { name: `${fieldName} 原始`, type: 'line', data: rawData, xAxisIndex: 0, yAxisIndex: 0, smooth: true, symbol: 'none', lineStyle: { color: '#38bdf8', width: 1.5 } },
      { name: `${fieldName} 趋势`, type: 'line', data: trend, xAxisIndex: 1, yAxisIndex: 1, smooth: true, symbol: 'none', lineStyle: { color: '#facc15', width: 1.5 } },
      { name: `${fieldName} 周期`, type: 'line', data: seasonal, xAxisIndex: 2, yAxisIndex: 2, smooth: true, symbol: 'none', lineStyle: { color: '#4ade80', width: 1.5 } },
      { name: `${fieldName} 残差`, type: 'line', data: residual, xAxisIndex: 3, yAxisIndex: 3, smooth: true, symbol: 'none', lineStyle: { color: '#f87171', width: 1 } }
    ]
  }

  stlChart.setOption(option, true)
}

async function loadMultiFeatures() {
  try {
    const res = await fetchMultiFeatures()
    if (res.data && res.data.length > 0) {
      multiData.value = res.data
      multiFields.value = res.fields || []
      if (multiFields.value.length > 0) {
        scatterX.value = multiFields.value[0]
        scatterY.value = multiFields.value[1] || multiFields.value[0]
        stlField.value = multiFields.value[0]
      }
      nextTick(() => {
        renderHeatmap()
        renderScatter()
        renderStl()
      })
    }
  } catch (e) {
    console.error('加载多特征数据失败:', e)
  }
}

const handleResize = () => {
  if (heatmapChart) heatmapChart.resize()
  if (scatterChart) scatterChart.resize()
  if (stlChart) stlChart.resize()
}

watch([scatterX, scatterY], () => {
  renderScatter()
})

watch(stlField, () => {
  renderStl()
})

onMounted(() => {
  loadMultiFeatures()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (heatmapChart) { heatmapChart.dispose(); heatmapChart = null }
  if (scatterChart) { scatterChart.dispose(); scatterChart = null }
  if (stlChart) { stlChart.dispose(); stlChart = null }
})
</script>

<style scoped>
.page-card {
  background: linear-gradient(180deg, #071528 0%, #071a2a 100%);
  padding: 16px;
  border-radius: 8px;
  min-height: calc(100vh - 60px);
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-block {
  background: rgba(7, 28, 43, 0.6);
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 16px;
}

.chart-heading {
  margin: 0 0 12px 0;
  color: #e2e8f0;
  font-size: 15px;
  font-weight: 600;
}

.chart-box {
  width: 100%;
  height: 380px;
}

.chart-box-tall {
  width: 100%;
  height: 600px;
}

.scatter-controls,
.stl-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.scatter-controls label,
.stl-controls label {
  color: #9fb3d6;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.scatter-controls select,
.stl-controls select {
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}
</style>