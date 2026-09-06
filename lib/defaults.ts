import type { Person } from './planner';

export const blankPerson = (id: number): Person => ({
  id,
  name: id === 1 ? '爸爸' : id === 2 ? '媽媽' : `訓練者 ${id}`,
  age: id === 1 ? 68 : id === 2 ? 65 : 60,
  sex: id === 1 ? '男性' : '女性',
  history: '',
  medications: '',
  surgeries: '',
  pain: '',
  recovering: false,
  hasTube: false,
  dizziness: false,
  cleared: false,
  goal: 'health',
  positions: ['standing', 'seated'],
  equipment: ['bodyweight', 'chair', 'wall', 'bottle'],
});
