<template>
<div class="app-root">
<side-nav />
<div class="main-panel">
<top-bar />
<div class="content-area">
<router-view />
</div>
</div>
</div>
</template>


<script setup>
import TopBar from '../components/TopBar.vue'
import SideNav from '../components/SideNav.vue'
</script>


<style scoped>
.app-root{display:flex;height:100vh;background:#0f1724;color:#0f1724}
.main-panel{flex:1;display:flex;flex-direction:column}
.content-area{padding:16px;flex:1;overflow:auto}
</style>