<template>
  <div class="top-bar">
    <div class="logo">TS-Vis</div>
    <div class="user-info">
      <div class="avatar" @click="showUserMenu = !showUserMenu">
        <img v-if="userAvatar" :src="userAvatar" alt="Avatar" />
        <div v-else class="default-avatar">👤</div>
      </div>
      <div class="user-menu" v-if="showUserMenu">
        <div class="user-name">{{ username }}</div>
        <div class="menu-item" @click="handleLogout">退出登录</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showUserMenu = ref(false)
const username = ref('')
const userAvatar = ref(null)

onMounted(() => {
  const user = localStorage.getItem('currentUser')
  if (user) {
    const userData = JSON.parse(user)
    username.value = userData.username
    userAvatar.value = userData.avatar
  }
})

const handleLogout = () => {
  localStorage.removeItem('currentUser')
  window.location.reload()
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-info')) {
    showUserMenu.value = false
  }
})
</script>

<style scoped>
.top-bar {
  height: 60px;
  background: #071428;
  border-bottom: 1px solid #071428;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  position: relative;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #667eea;
}

.user-info {
  position: relative;
  cursor: pointer;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  font-size: 24px;
}

.user-menu {
  position: absolute;
  top: 50px;
  right: 0;
  background: rgb(40, 51, 90);
  border: 1px solid rgb(40, 51, 90);
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  min-width: 150px;
  z-index: 100;
}

.user-name {
  padding: 10px 15px;
  border-bottom: 1px solid #334155;
  font-weight: 500;
  color: #e2e8f0;
}

.menu-item {
  padding: 10px 15px;
  cursor: pointer;
  transition: background 0.3s;
  color: #f87171;
}

.menu-item:hover {
  background: #334155;
}
</style>