<template>
  <div class="sidenav">
    <div class="logo">时序数据可视化平台</div>
    <el-menu :router="true" default-active="/visualization" class="el-menu-vertical-demo" background-color="#071428" text-color="#9fb3d6" active-text-color="#fff">
      <el-menu-item index="/visualization">数据可视化</el-menu-item>
      <el-menu-item index="/forecast">模型预测</el-menu-item>
      <el-menu-item index="/alerts">异常预警</el-menu-item>
      <el-menu-item index="/feature-analysis">特征分析</el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
</script>

<style scoped>
.sidenav{width:220px;background:#071428;padding:16px 8px;color:#9fb3d6;min-height:100vh}
.logo{height:40px;font-weight:700;color:#fff;padding:8px 12px;margin-bottom:20px}
:deep(.el-menu){border-right:none !important}
</style>