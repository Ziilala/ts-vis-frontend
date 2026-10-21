import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
    users: []
  }),
  
  actions: {
    init() {
      const savedUsers = localStorage.getItem('users')
      if (savedUsers) {
        this.users = JSON.parse(savedUsers)
      } else {
        this.users = [{
          id: 'default',
          username: 'demo',
          password: 'demo123',
          avatar: null
        }]
        this.saveToLocalStorage()
      }
      
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser)
      }
    },
    
    saveToLocalStorage() {
      localStorage.setItem('users', JSON.stringify(this.users))
      if (this.currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
      }
    },
    
    register(username, password, avatar) {
      if (this.users.find(u => u.username === username)) {
        return { success: false, message: '用户名已存在' }
      }
      
      const newUser = {
        id: Date.now().toString(),
        username: username,
        password: password,
        avatar: avatar || null
      }
      
      this.users.push(newUser)
      this.saveToLocalStorage()
      return { success: true, message: '注册成功', user: newUser }
    },
    
    login(username, password) {
      const user = this.users.find(u => u.username === username && u.password === password)
      if (user) {
        this.currentUser = JSON.parse(JSON.stringify(user))
        this.saveToLocalStorage()
        return { success: true, message: '登录成功', user: this.currentUser }
      }
      return { success: false, message: '用户名或密码错误' }
    },
    
    logout() {
      this.currentUser = null
      localStorage.removeItem('currentUser')
    },
    
    updateAvatar(avatar) {
      if (this.currentUser) {
        this.currentUser.avatar = avatar
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id)
        if (userIndex !== -1) {
          this.users[userIndex].avatar = avatar
        }
        this.saveToLocalStorage()
      }
    }
  }
})