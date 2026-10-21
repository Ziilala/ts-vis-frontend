// 验证用户名/密码格式（只允许英文和数字）
export const validateAlphanumeric = (value) => {
  const regex = /^[a-zA-Z0-9]+$/;
  return regex.test(value);
};

// 验证用户名
export const validateUsername = (username) => {
  if (!username || username.trim() === '') {
    return '用户名不能为空';
  }
  if (!validateAlphanumeric(username)) {
    return '用户名只能包含英文和数字';
  }
  if (username.length < 3) {
    return '用户名长度至少3个字符';
  }
  if (username.length > 20) {
    return '用户名长度不能超过20个字符';
  }
  return '';
};

// 验证密码
export const validatePassword = (password) => {
  if (!password || password.trim() === '') {
    return '密码不能为空';
  }
  if (!validateAlphanumeric(password)) {
    return '密码只能包含英文和数字';
  }
  if (password.length < 6) {
    return '密码长度至少6个字符';
  }
  if (password.length > 20) {
    return '密码长度不能超过20个字符';
  }
  return '';
};

// 验证确认密码
export const validateConfirmPassword = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return '两次输入的密码不一致';
  }
  return '';
};