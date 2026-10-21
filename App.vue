<template>
  <div id="app">
    <div v-if="!isLoggedIn" class="auth-container">
      <div class="bg-overlay"></div>
      
      <div class="auth-card" v-if="!isRegisterMode">
        <h2>用户登录</h2>
        
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>用户名</label>
            <input 
              v-model="loginForm.username" 
              type="text" 
              placeholder="英文、数字组成"
            />
          </div>
          
          <div class="form-group">
            <label>密码</label>
            <input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="英文、数字组成"
            />
          </div>
          
          <div v-if="loginError" class="error">{{ loginError }}</div>
          
          <button type="submit" class="btn-login">登录</button>
          <button type="button" class="btn-register" @click="isRegisterMode = true">注册账号</button>
        </form>
      </div>

      <div class="auth-card" v-else>
        <h2>注册账号</h2>
        
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="registerForm.username" type="text" placeholder="英文、数字组成" />
            <span class="hint">3-20位英文或数字</span>
          </div>
          
          <div class="form-group">
            <label>密码</label>
            <input v-model="registerForm.password" type="password" placeholder="英文、数字组成" />
            <span class="hint">6-20位英文或数字</span>
          </div>
          
          <div class="form-group">
            <label>确认密码</label>
            <input v-model="registerForm.confirmPassword" type="password" />
          </div>
          
          <div class="form-group">
            <label>上传头像（可选）</label>
            <div class="avatar-upload" @click="triggerAvatarUpload">
              <img v-if="avatarPreview" :src="avatarPreview" class="avatar-preview" />
              <div v-else class="avatar-placeholder">点击选择图片</div>
            </div>
            <input 
              type="file" 
              ref="avatarInput" 
              @change="handleAvatarUpload" 
              accept="image/jpeg,image/png,image/jpg"
              style="display: none"
            />
          </div>
          
          <div v-if="registerError" class="error">{{ registerError }}</div>
          
          <button type="submit" class="btn-login">注册</button>
          <button type="button" class="btn-register" @click="isRegisterMode = false">返回登录</button>
        </form>
      </div>
    </div>
    
    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isLoggedIn = ref(false);
const isRegisterMode = ref(false);
const loginError = ref('');
const registerError = ref('');

const loginForm = ref({ username: '', password: '' });
const registerForm = ref({ username: '', password: '', confirmPassword: '' });
const avatarPreview = ref('');
const avatarInput = ref(null);

onMounted(() => {
  const user = localStorage.getItem('currentUser');
  if (user) {
    isLoggedIn.value = true;
  }
});

const triggerAvatarUpload = () => {
  avatarInput.value.click();
};

const handleAvatarUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const handleLogin = () => {
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  const user = users[loginForm.value.username];
  
  if (!user) {
    loginError.value = '用户名不存在';
    return;
  }
  
  if (user.password !== loginForm.value.password) {
    loginError.value = '密码错误';
    return;
  }
  
  localStorage.setItem('currentUser', JSON.stringify(user));
  isLoggedIn.value = true;
  loginError.value = '';
};

const handleRegister = () => {
  if (!/^[a-zA-Z0-9]{3,20}$/.test(registerForm.value.username)) {
    registerError.value = '用户名必须为3-20位英文或数字';
    return;
  }
  
  if (!/^[a-zA-Z0-9]{6,20}$/.test(registerForm.value.password)) {
    registerError.value = '密码必须为6-20位英文或数字';
    return;
  }
  
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    registerError.value = '两次密码不一致';
    return;
  }
  
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  if (users[registerForm.value.username]) {
    registerError.value = '用户名已存在';
    return;
  }
  
  const newUser = {
    username: registerForm.value.username,
    password: registerForm.value.password,
    avatar: avatarPreview.value || null
  };
  
  users[registerForm.value.username] = newUser;
  localStorage.setItem('users', JSON.stringify(users));
  
  registerError.value = '';
  alert('注册成功！请登录');
  isRegisterMode.value = false;
  registerForm.value = { username: '', password: '', confirmPassword: '' };
  avatarPreview.value = '';
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.auth-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background: url('/src/assets/背景.png') no-repeat center center fixed;
  background-size: cover;
}

.auth-card {
  position: relative;
  z-index: 1;
  width: 380px;
  margin-right: 60px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
}

.auth-card h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
  font-size: 13px;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #333;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.9);
}

.form-group input:focus {
  outline: none;
  border-color: #7ba9ff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.hint {
  font-size: 11px;
  color: #555;
  display: block;
  margin-top: 5px;
}

.error {
  color: #f44336;
  font-size: 12px;
  margin-bottom: 16px;
  text-align: center;
}

.btn-login, .btn-register {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #333;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(10, 24, 219, 0);
  color: #333;
}

.btn-login {
  margin-bottom: 12px;
}

.btn-login:hover, .btn-register:hover {
  background: rgba(10, 24, 219, 0.15);
  transform: translateY(-2px);
}

.avatar-upload {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
  margin: 0 auto;
}

.avatar-upload:hover {
  border-color: #7ba9ff;
  background: rgba(255, 255, 255, 0.9);
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 10px;
  color: #333;
  line-height: 1.3;
  padding: 8px;
  word-break: break-word;
}

@media (max-width: 768px) {
  .auth-container {
    justify-content: center;
  }
  .auth-card {
    margin-right: 0;
    width: 90%;
    max-width: 400px;
  }
}
</style>