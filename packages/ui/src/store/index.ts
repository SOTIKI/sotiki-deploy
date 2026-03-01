import { create } from 'zustand'
import type { StatusResponse, Metric } from '../api/client.js'

interface Store {
  status:      StatusResponse | null
  liveMetrics: Metric[]
  setStatus:   (s: StatusResponse) => void
  pushMetric:  (m: Metric) => void
}

export const useStore = create<Store>(set => ({
  status:      null,
  liveMetrics: [],
  setStatus:   status => set({ status }),
  pushMetric:  m => set(s => ({ liveMetrics: [...s.liveMetrics.slice(-119), m] })),
}))