import axios from 'axios'

const instance = axios.create({ baseURL: 'http://localhost:3001/api' })

export async function fetchHistory(startTime = null, endTime = null) {
  const params = {};
  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;
  const response = await instance.get('/history', { params });
  return response.data;
}

export async function fetchAllData() {
  const response = await instance.get('/all');
  return response.data;
}

export async function fetchRealtime() {
  const response = await instance.get('/realtime');
  return response.data;
}

export async function fetchFields() {
  const response = await instance.get('/fields');
  return response.data;
}

export async function fetchMultiFeatures() {
  const response = await instance.get('/multi-features');
  return response.data;
}