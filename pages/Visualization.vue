<template>
  <div class="page-card">
    <div class="controls">
      <div class="filter-group">
        <label class="filter-item">
          <input type="checkbox" v-model="visibleFields" :value="allFields[0]" />
          <span>{{ fieldLabel(allFields[0]) || '指标1' }}</span>
        </label>
        <label class="filter-item">
          <input type="checkbox" v-model="visibleFields" :value="allFields[1]" />
          <span>{{ fieldLabel(allFields[1]) || '指标2' }}</span>
        </label>
      </div>

      <div class="date-range-group">
        <span class="date-label">自</span>

        <div class="date-picker-wrap">
          <div class="date-btn" @click="toggleCalendar('start')">
            <span>{{ startDate || '请选择日期' }}</span>
            <span class="arrow">▾</span>
          </div>
          <div v-if="showCalendar === 'start'" class="calendar-popup">
            <div class="calendar-header">
              <span class="cal-nav" @click="prevMonth('start')">‹</span>
              <span>{{ calYear }}-{{ String(calMonth+1).padStart(2,'0') }}</span>
              <span class="cal-nav" @click="nextMonth('start')">›</span>
            </div>
            <div class="calendar-weekdays">
              <span v-for="w in ['一','二','三','四','五','六','日']" :key="w">{{ w }}</span>
            </div>
            <div class="calendar-days">
              <span
                v-for="(d, i) in calendarDays"
                :key="i"
                class="cal-day"
                :class="{ 'other-month': !d.current, 'selected': d.dateStr === startDate }"
                @click="pickDate('start', d.dateStr)"
              >{{ d.day }}</span>
            </div>
          </div>
        </div>

        <div class="hour-picker-wrap">
          <div class="hour-btn" @click="toggleHourPicker('start')">{{ startHour }}</div>
          <div v-if="showHourPicker === 'start'" class="hour-popup">
            <div
              v-for="h in 25"
              :key="'s'+h"
              class="hour-option"
              :class="{ active: startHour === h-1 }"
              @click="pickHour('start', h-1)"
            >{{ h-1 }}</div>
          </div>
        </div>
        <span class="date-label">时</span>

        <span class="date-label">到</span>

        <div class="date-picker-wrap">
          <div class="date-btn" @click="toggleCalendar('end')">
            <span>{{ endDate || '请选择日期' }}</span>
            <span class="arrow">▾</span>
          </div>
          <div v-if="showCalendar === 'end'" class="calendar-popup">
            <div class="calendar-header">
              <span class="cal-nav" @click="prevMonth('end')">‹</span>
              <span>{{ calYear }}-{{ String(calMonth+1).padStart(2,'0') }}</span>
              <span class="cal-nav" @click="nextMonth('end')">›</span>
            </div>
            <div class="calendar-weekdays">
              <span v-for="w in ['一','二','三','四','五','六','日']" :key="w">{{ w }}</span>
            </div>
            <div class="calendar-days">
              <span
                v-for="(d, i) in calendarDays"
                :key="i"
                class="cal-day"
                :class="{ 'other-month': !d.current, 'selected': d.dateStr === endDate }"
                @click="pickDate('end', d.dateStr)"
              >{{ d.day }}</span>
            </div>
          </div>
        </div>

        <div class="hour-picker-wrap">
          <div class="hour-btn" @click="toggleHourPicker('end')">{{ endHour }}</div>
          <div v-if="showHourPicker === 'end'" class="hour-popup">
            <div
              v-for="h in 25"
              :key="'e'+h"
              class="hour-option"
              :class="{ active: endHour === h-1 }"
              @click="pickHour('end', h-1)"
            >{{ h-1 }}</div>
          </div>
        </div>
        <span class="date-label">时</span>

        <button class="btn-apply" @click="applyDateFilter">应用</button>
        <button class="btn-clear" @click="clearDateFilter">清除</button>
      </div>

      <div class="spacer"></div>
      <el-button type="primary" @click="exportCSV" class="export-btn">导出 CSV</el-button>
    </div>

    <div ref="chartRef" class="chart-box" />

    <div class="slider-time-labels" v-if="sliderStartTime && sliderEndTime">
      <span class="time-label start">{{ sliderStartTime }}</span>
      <span class="time-label end">{{ sliderEndTime }}</span>
    </div>

    <div class="stats-cards">
      <template v-for="field in statsRowOrder" :key="'row-' + field">
        <div v-if="activeFields.includes(field)" class="stats-row">
          <el-card class="stat">
            <div class="stat-title">当前 {{ fieldLabel(field) }}</div>
            <div class="stat-value">{{ displayValues[field] || '--' }}</div>
          </el-card>
          <el-card class="stat">
            <div class="stat-title">{{ fieldLabel(field) }} 均值</div>
            <div class="stat-value">{{ rangeStats[field]?.mean || '--' }}</div>
          </el-card>
          <el-card class="stat">
            <div class="stat-title">{{ fieldLabel(field) }} 标准差</div>
            <div class="stat-value">{{ rangeStats[field]?.std || '--' }}</div>
          </el-card>
          <el-card class="stat">
            <div class="stat-title">{{ fieldLabel(field) }} 最大</div>
            <div class="stat-value">{{ rangeStats[field]?.max || '--' }}</div>
          </el-card>
          <el-card class="stat">
            <div class="stat-title">{{ fieldLabel(field) }} 最小</div>
            <div class="stat-value">{{ rangeStats[field]?.min || '--' }}</div>
          </el-card>
        </div>
      </template>
    </div>

    <el-table :data="tableData" style="width:100%" size="small" :height="200">
      <el-table-column prop="time" label="时间" width="150"/>
      <el-table-column v-for="field in activeFields" :key="field" :prop="field" :label="fieldLabel(field)" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { fetchAllData, fetchRealtime, fetchFields } from '../api'

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

const chartRef = ref(null)
let chart = null
let realtimeInterval = null
const tableData = ref([])
const realtimeValues = ref({})
const hoverValues = ref({})
const hoverPoint = ref(null)
const rangeStats = ref({})

const sliderStartTime = ref('')
const sliderEndTime = ref('')

let allData = []
let displayData = []
const DEFAULT_SHOW_COUNT = 50
const PIXEL_PER_LABEL = 120

const allFields = ref([])
const visibleFields = ref([])

const startDate = ref('')
const startHour = ref(0)
const endDate = ref('')
const endHour = ref(0)
let dateFilterActive = false

const showCalendar = ref('')
const showHourPicker = ref('')
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth())

let currentFormattedTimes = []

const calendarDays = computed(() => {
  const year = calYear.value
  const month = calMonth.value
  const firstDay = new Date(year, month, 1)
  let startWeekday = firstDay.getDay()
  if (startWeekday === 0) startWeekday = 7
  startWeekday -= 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const result = []
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const date = new Date(year, month - 1, d)
    result.push({ day: d, current: false, dateStr: fmtDate(date) })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    result.push({ day: i, current: true, dateStr: fmtDate(date) })
  }
  const remaining = 42 - result.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    result.push({ day: i, current: false, dateStr: fmtDate(date) })
  }
  return result
})

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const activeFields = computed(() => {
  return allFields.value.filter(f => visibleFields.value.includes(f))
})

const statsRowOrder = computed(() => {
  return [...allFields.value].reverse()
})

const displayValues = computed(() => {
  const hasHover = Object.keys(hoverValues.value).length > 0
  const result = {}
  for (const field of activeFields.value) {
    if (hasHover && hoverValues.value[field] !== undefined) {
      result[field] = hoverValues.value[field]
    } else {
      result[field] = realtimeValues.value[field] || '--'
    }
  }
  return result
})

let currentStartIndex = 0
let currentEndIndex = 0

function formatTime(isoString) {
  const date = new Date(isoString)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

function formatFullTime(isoString) {
  const date = new Date(isoString)
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}:${date.getSeconds().toString().padStart(2,'0')}`
}

function updateTimeLabels() {
  if (!displayData.length || currentStartIndex >= currentEndIndex) {
    sliderStartTime.value = ''
    sliderEndTime.value = ''
    return
  }
  sliderStartTime.value = formatTime(displayData[currentStartIndex].time)
  sliderEndTime.value = formatTime(displayData[currentEndIndex].time)
}

function updateRangeStats() {
  if (!displayData.length || currentStartIndex >= currentEndIndex) {
    rangeStats.value = {}
    return
  }
  const rangeData = displayData.slice(currentStartIndex, currentEndIndex + 1)
  const stats = {}
  for (const field of activeFields.value) {
    const values = rangeData.map(d => d[field]).filter(v => v !== undefined && v !== null && !isNaN(v))
    if (values.length === 0) continue
    const mean = (values.reduce((a,b) => a + b, 0) / values.length).toFixed(3)
    const variance = values.map(v => Math.pow(v - mean, 2)).reduce((a,b) => a + b, 0) / values.length
    const std = Math.sqrt(variance).toFixed(3)
    const max = Math.max(...values).toFixed(3)
    const min = Math.min(...values).toFixed(3)
    stats[field] = { mean, std, max, min }
  }
  rangeStats.value = stats
}

function updateTableByRange() {
  if (!displayData.length || currentStartIndex >= currentEndIndex) {
    tableData.value = []
    return
  }
  const rangeData = displayData.slice(currentStartIndex, currentEndIndex + 1)
  tableData.value = rangeData.slice(-20).reverse().map(d => {
    const row = { time: formatTime(d.time) }
    for (const field of activeFields.value) {
      row[field] = d[field]
    }
    return row
  })
}

function calculateInterval(visibleCount, chartWidth) {
  if (visibleCount === 0) return 0
  const maxLabels = Math.floor(chartWidth / PIXEL_PER_LABEL)
  if (maxLabels <= 0) return 0
  return Math.max(0, Math.ceil(visibleCount / maxLabels))
}

function buildYAxis(index) {
  const field = activeFields.value[index]
  const isLeft = index === 0
  return {
    type: 'value',
    name: fieldLabel(field),
    nameTextStyle: { color: '#9fb3d6' },
    position: isLeft ? 'left' : 'right',
    axisLabel: {
      color: isLeft ? '#38bdf8' : '#facc15',
      fontSize: 11
    },
    axisLine: { lineStyle: { color: isLeft ? '#38bdf8' : '#facc15' } },
    splitLine: {
      show: isLeft,
      lineStyle: { color: '#334155' }
    }
  }
}

function updateChart(preserveZoom = true) {
  if (!displayData.length || !activeFields.value.length) {
    if (chart) chart.clear()
    return
  }
  
  const times = displayData.map(d => d.time)
  const series = activeFields.value.map((field, idx) => {
    const color = idx === 0 ? '#38bdf8' : '#facc15'
    return {
      name: fieldLabel(field),
      type: 'line',
      yAxisIndex: idx === 0 ? 0 : 1,
      data: displayData.map(d => d[field]),
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color: color },
      areaStyle: idx === 0 ? { opacity: 0.2 } : undefined
    }
  })
  
  const yAxes = activeFields.value.map((_, idx) => buildYAxis(idx))
  if (yAxes.length === 1) {
    yAxes.push({ type: 'value', show: false })
  }
  
  renderChart(times, series, yAxes)
}

function renderChart(times, series, yAxes) {
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  
  const containerWidth = chartRef.value?.clientWidth || 800
  const totalPoints = times.length
  const defaultStart = Math.max(0, (totalPoints - DEFAULT_SHOW_COUNT) / totalPoints * 100)
  const defaultEnd = 100
  
  currentStartIndex = Math.floor((defaultStart / 100) * totalPoints)
  currentEndIndex = Math.ceil((defaultEnd / 100) * totalPoints) - 1
  currentStartIndex = Math.max(0, currentStartIndex)
  currentEndIndex = Math.min(totalPoints - 1, currentEndIndex)
  
  updateTimeLabels()
  updateRangeStats()
  updateTableByRange()
  
  const visibleCount = currentEndIndex - currentStartIndex + 1
  const interval = calculateInterval(visibleCount, containerWidth)
  currentFormattedTimes = times.map(t => formatTime(t))
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: { color: '#94a3b8', width: 1, type: 'dashed' }
      },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#38bdf8',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0' },
      formatter: function(params) {
        if (!params || params.length === 0) return ''
        const idx = params[0].dataIndex
        const originalTime = times[idx]
        let html = `<div style="font-weight:bold;margin-bottom:4px;">${formatFullTime(originalTime)}</div>`
        for (const p of params) {
          html += `<div>${p.seriesName}: <span style="color:${p.color};font-weight:bold;">${Number(p.value).toFixed(3)}</span></div>`
        }
        return html
      }
    },
    legend: {
      data: activeFields.value.map(fieldLabel),
      textStyle: { color: '#9fb3d6' },
      top: 5,
      selectedMode: false
    },
    xAxis: {
      type: 'category',
      data: currentFormattedTimes,
      boundaryGap: false,
      axisLabel: {
        rotate: 0,
        color: '#9fb3d6',
        interval: interval,
        fontSize: 11,
        showMinLabel: true,
        showMaxLabel: true
      },
      axisLine: { lineStyle: { color: '#334155' } }
    },
    yAxis: yAxes,
    series: series
  }
  
  chart.setOption(option, { notMerge: true })
}

const handleChartMouseMove = (e) => {
  if (!chart || !displayData.length) return

  const chartRect = chartRef.value.getBoundingClientRect()
  const mouseX = e.clientX - chartRect.left

  const totalPoints = displayData.length
  if (totalPoints < 2) return

  let pointIndex = 0
  try {
    const idx = chart.convertFromPixel({ xAxisIndex: 0 }, mouseX)
    if (Array.isArray(idx)) {
      pointIndex = Math.round(idx[0])
    } else if (typeof idx === 'number') {
      pointIndex = Math.round(idx)
    }
  } catch (err) {
    return
  }

  if (pointIndex < 0) pointIndex = 0
  if (pointIndex >= totalPoints) pointIndex = totalPoints - 1

  const row = displayData[pointIndex]
  const values = {}
  const hoverPoints = []
  const categoryValue = currentFormattedTimes[pointIndex]

  for (let i = 0; i < activeFields.value.length; i++) {
    const field = activeFields.value[i]
    const val = row[field]
    if (val !== undefined && val !== null) {
      values[field] = typeof val === 'number' ? val.toFixed(2) : val
    }
    try {
      const px = chart.convertToPixel({ xAxisIndex: 0 }, categoryValue)
      const py = chart.convertToPixel({ yAxisIndex: i }, val)
      if (typeof px === 'number' && typeof py === 'number') {
        hoverPoints.push({
          x: px,
          y: py,
          color: i === 0 ? '#7b8ce8' : '#a8d95f'
        })
      }
    } catch (err) {
      // 忽略
    }
  }

  hoverValues.value = values
  hoverPoint.value = { points: hoverPoints }

  applyHoverPoints()
}

function applyHoverPoints() {
  const existing = document.getElementById('hoverPointsLayer')
  if (existing) existing.remove()

  if (!hoverPoint.value || !hoverPoint.value.points || hoverPoint.value.points.length === 0) return

  const chartDom = chartRef.value
  const layer = document.createElement('div')
  layer.id = 'hoverPointsLayer'
  layer.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
  `

  for (const p of hoverPoint.value.points) {
    const dot = document.createElement('div')
    dot.style.cssText = `
      position: absolute;
      left: ${p.x - 6}px;
      top: ${p.y - 6}px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${p.color};
      border: 2px solid #0f172a;
      box-sizing: border-box;
      box-shadow: 0 0 8px ${p.color};
    `
    layer.appendChild(dot)
  }

  chartDom.style.position = 'relative'
  chartDom.appendChild(layer)
}

const handleChartMouseLeave = () => {
  hoverValues.value = {}
  hoverPoint.value = null
  const existing = document.getElementById('hoverPointsLayer')
  if (existing) existing.remove()
}

function toggleCalendar(which) {
  showHourPicker.value = ''
  showCalendar.value = showCalendar.value === which ? '' : which
}

function toggleHourPicker(which) {
  showCalendar.value = ''
  showHourPicker.value = showHourPicker.value === which ? '' : which
}

function pickDate(which, dateStr) {
  if (which === 'start') {
    startDate.value = dateStr
  } else {
    endDate.value = dateStr
  }
  showCalendar.value = ''
}

function pickHour(which, hour) {
  if (which === 'start') {
    startHour.value = hour
  } else {
    endHour.value = hour
  }
  showHourPicker.value = ''
}

function prevMonth() {
  if (calMonth.value === 0) {
    calMonth.value = 11
    calYear.value -= 1
  } else {
    calMonth.value -= 1
  }
}

function nextMonth() {
  if (calMonth.value === 11) {
    calMonth.value = 0
    calYear.value += 1
  } else {
    calMonth.value += 1
  }
}

async function updateRealtime() {
  const res = await fetchRealtime()
  if (res.data) {
    const values = {}
    for (const field of allFields.value) {
      if (res.data[field] !== undefined) {
        values[field] = typeof res.data[field] === 'number' ? res.data[field].toFixed(2) : res.data[field]
      }
    }
    realtimeValues.value = values
  }
}

function applyDateFilter() {
  if (!startDate.value || !endDate.value) {
    alert('请选择开始和结束日期')
    return
  }
  const start = new Date(startDate.value)
  start.setHours(startHour.value, 0, 0, 0)
  const end = new Date(endDate.value)
  end.setHours(endHour.value, 59, 59, 999)
  if (start > end) {
    alert('开始时间不能晚于结束时间')
    return
  }
  dateFilterActive = true
  displayData = allData.filter(d => {
    const t = new Date(d.time).getTime()
    return t >= start.getTime() && t <= end.getTime()
  })
  updateChart(false)
}

function clearDateFilter() {
  dateFilterActive = false
  displayData = [...allData]
  startDate.value = ''
  endDate.value = ''
  startHour.value = 0
  endHour.value = 0
  updateChart(false)
}

async function pollNewData() {
  const res = await fetchAllData()
  if (res.data && res.data.length > 0) {
    const newLast = res.data[res.data.length - 1]
    const oldLast = allData.length > 0 ? allData[allData.length - 1] : null
    const hasChanged = !oldLast || newLast.timestamp !== oldLast.timestamp || res.data.length !== allData.length
    if (hasChanged) {
      allData = res.data
      if (!dateFilterActive) {
        displayData = [...allData]
        updateChart(true)
      }
    }
  }
  await updateRealtime()
}

async function initData() {
  const fieldsRes = await fetchFields()
  allFields.value = fieldsRes.fields || []
  visibleFields.value = [...allFields.value]
  
  const res = await fetchAllData()
  allData = res.data || []
  displayData = [...allData]
  updateChart(false)
  await updateRealtime()
}

const handleResize = () => {
  if (chart) chart.resize()
}

watch(visibleFields, (newVal) => {
  if (newVal.length === 0) {
    alert('请至少勾选一项')
    visibleFields.value = [allFields.value[0]]
    return
  }
  hoverValues.value = {}
  hoverPoint.value = null
  const existing = document.getElementById('hoverPointsLayer')
  if (existing) existing.remove()
  updateChart(true)
}, { deep: true })

function exportCSV() {
  if (!displayData.length) return
  const fields = activeFields.value
  const header = ['time', ...fields.map(fieldLabel)].join(',')
  const rows = displayData.map(d => {
    return [d.time, ...fields.map(f => d[f])].join(',')
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sensor_data_${new Date().toISOString()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.date-picker-wrap') && !e.target.closest('.hour-picker-wrap')) {
    showCalendar.value = ''
    showHourPicker.value = ''
  }
})

onMounted(async () => {
  await initData()
  
  realtimeInterval = setInterval(pollNewData, 2000)
  window.addEventListener('resize', handleResize)
  
  if (chartRef.value) {
    chartRef.value.addEventListener('mousemove', handleChartMouseMove)
    chartRef.value.addEventListener('mouseleave', handleChartMouseLeave)
  }
})

onUnmounted(() => {
  if (realtimeInterval) clearInterval(realtimeInterval)
  window.removeEventListener('resize', handleResize)
  if (chartRef.value) {
    chartRef.value.removeEventListener('mousemove', handleChartMouseMove)
    chartRef.value.removeEventListener('mouseleave', handleChartMouseLeave)
  }
  if (chart) {
    chart.dispose()
  }
})
</script>

<style scoped>
.page-card{background:linear-gradient(180deg,#071528 0%, #071a2a 100%);padding:16px;border-radius:8px}

.controls {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 20px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9fb3d6;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.filter-item input[type="checkbox"] {
  accent-color: #38bdf8;
  cursor: pointer;
  width: 14px;
  height: 14px;
}

.date-range-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.date-label {
  color: #9fb3d6;
  font-size: 13px;
}

.date-picker-wrap {
  position: relative;
}

.date-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 130px;
  padding: 5px 10px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.date-btn:hover {
  border-color: #38bdf8;
}

.date-btn .arrow {
  color: #9fb3d6;
  font-size: 10px;
  margin-left: 6px;
}

.calendar-popup {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 10px;
  z-index: 100;
  width: 240px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #e2e8f0;
  font-size: 13px;
  margin-bottom: 8px;
}

.cal-nav {
  cursor: pointer;
  color: #9fb3d6;
  font-size: 16px;
  user-select: none;
  padding: 0 6px;
}

.cal-nav:hover {
  color: #38bdf8;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  color: #64748b;
  font-size: 11px;
  text-align: center;
  margin-bottom: 4px;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-day {
  text-align: center;
  padding: 4px 0;
  font-size: 12px;
  color: #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}

.cal-day:hover {
  background: #334155;
}

.cal-day.other-month {
  color: #475569;
}

.cal-day.selected {
  background: #38bdf8;
  color: #0f172a;
  font-weight: bold;
}

.hour-picker-wrap {
  position: relative;
}

.hour-btn {
  min-width: 60px;
  padding: 5px 10px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  user-select: none;
}

.hour-btn:hover {
  border-color: #38bdf8;
}

.hour-popup {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
  width: 70px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}

.hour-option {
  padding: 5px 10px;
  font-size: 13px;
  color: #e2e8f0;
  cursor: pointer;
  text-align: center;
}

.hour-option:hover {
  background: #334155;
}

.hour-option.active {
  background: #38bdf8;
  color: #0f172a;
  font-weight: bold;
}

.btn-apply,
.btn-clear {
  background: #0ea5e9;
  border: none;
  color: white;
  padding: 5px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-clear {
  background: #475569;
}

.btn-apply:hover {
  background: #0284c7;
}

.btn-clear:hover {
  background: #334155;
}

.spacer {
  flex: 1;
}

.export-btn {
  width: 200px;
}

.chart-box{height:380px;background:#071c2b;border-radius:6px;margin-bottom:8px;position:relative}

.slider-time-labels {
  display: flex;
  justify-content: space-between;
  padding: 4px 45px 0 45px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #9fb3d6;
}
.time-label {
  background: rgba(7, 28, 43, 0.8);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.stats-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 12px;
  align-items: center;
}

.stats-row {
  display: flex;
  gap: 14px;
  justify-content: center;
  width: 100%;
}

.stat {
  flex: 1 1 0;
  min-width: 0;
  max-width: 200px;
  text-align: center;
  background: rgba(7, 28, 43, 0.8);
  border-color: #334155;
  padding: 12px 8px;
}

.stat-title {
  color: #9fb3d6;
  font-size: 12px;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #38bdf8;
}

:deep(.el-table){background-color:transparent}
:deep(.el-table th.el-table__cell){background-color:rgba(7,28,43,0.8);color:#9fb3d6;border-bottom-color:#334155}
:deep(.el-table tr){background-color:transparent;color:#e2e8f0}
:deep(.el-table td.el-table__cell){border-bottom-color:#334155}
</style>