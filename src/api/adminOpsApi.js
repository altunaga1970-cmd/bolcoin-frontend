import api from './index';

export async function getOpsSummary() {
  const res = await api.get('/admin/ops/summary');
  return res.data;
}

export async function getToggles() {
  const res = await api.get('/admin/ops/toggles');
  return res.data;
}

export async function setToggle(key, enabled) {
  const res = await api.post('/admin/ops/toggles', { key, enabled });
  return res.data;
}
