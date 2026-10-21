import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import Visualization from '../pages/Visualization.vue'
import Forecast from '../pages/Forecast.vue'
import Alerts from '../pages/Alerts.vue'
import FeatureAnalysis from '../pages/FeatureAnalysis.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/visualization' },
      { path: 'visualization', name: 'Visualization', component: Visualization },
      { path: 'forecast', name: 'Forecast', component: Forecast },
      { path: 'alerts', name: 'Alerts', component: Alerts },
      { path: 'feature-analysis', name: 'FeatureAnalysis', component: FeatureAnalysis }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })
export default router