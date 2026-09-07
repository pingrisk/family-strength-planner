import exercises from '@/data/exercises.json';

export type Position = 'standing' | 'seated' | 'mat';
export type Goal = 'prevent' | 'health' | 'performance';
export type MovementPattern = 'push' | 'pull' | 'squat' | 'move';
export type SafetyLevel = 'green' | 'amber' | 'red';

export type Person = {
  id: number;
  name: string;
  age: number;
  sex: string;
  history: string;
  medications: string;
  surgeries: string;
  pain: string;
  recovering: boolean;
  hasTube: boolean;
  dizziness: boolean;
  cleared: boolean;
  goal: Goal;
  positions: Position[];
  equipment: string[];
};

export type Exercise = (typeof exercises)[number];

export type Plan = {
  person: Person;
  safety: SafetyLevel;
  safetyTitle: string;
  safetyNotes: string[];
  sessions: number;
  exercises: Exercise[];
};

const painTags: Record<string, string[]> = {
  knee: ['膝', '膝蓋'],
  hip: ['髖', '臀'],
  back: ['腰', '背', '脊椎'],
  shoulder: ['肩'],
  wrist: ['腕', '手腕'],
  neck: ['頸', '脖子'],
};

function inferAvoid(person: Person) {
  const text = `${person.pain} ${person.history} ${person.surgeries}`;
  const tags = Object.entries(painTags)
    .filter(([, words]) => words.some((word) => text.includes(word)))
    .map(([tag]) => tag);
  if (person.hasTube) tags.push('tube');
  if (person.dizziness) tags.push('dizziness');
  return new Set(tags);
}

export function assessSafety(person: Person) {
  const notes: string[] = [];
  if (person.hasTube) notes.push('目前有管路／插管，需由醫療專業人員確認活動範圍。');
  if (person.recovering && !person.cleared) notes.push('仍在受傷或術後恢復期，尚未確認可運動。');
  if (person.dizziness) notes.push('有暈眩或平衡風險，站姿動作需有人在旁。');
  const red = person.hasTube || (person.recovering && !person.cleared);
  if (red) return { level: 'red' as const, title: '建議先取得醫療專業人員運動許可', notes };
  if (person.dizziness || person.pain.trim()) {
    if (person.pain.trim()) notes.push('已避開與目前疼痛部位直接衝突的動作；疼痛增加請停止。');
    return { level: 'amber' as const, title: '可以規劃，但需留意', notes };
  }
  return { level: 'green' as const, title: '適合開始基礎課表', notes: ['過程應能正常說話；胸悶、劇痛或暈眩時立即停止。'] };
}

function positionFits(exercise: Exercise, person: Person) {
  return exercise.positions.some((p) => person.positions.includes(p as Position));
}

function equipmentFits(exercise: Exercise, person: Person) {
  return exercise.equipment.includes('none') || exercise.equipment.every((item) => person.equipment.includes(item));
}

export function makePlan(person: Person, sessions: number, dayIndex = 0): Plan {
  const safety = assessSafety(person);
  const avoid = inferAvoid(person);
  const eligible = exercises.filter((exercise) =>
    positionFits(exercise, person) &&
    equipmentFits(exercise, person) &&
    !exercise.avoid.some((tag) => avoid.has(tag)),
  );
  const rotate = (items: Exercise[]) => items.length ? [...items.slice(dayIndex % items.length), ...items.slice(0, dayIndex % items.length)] : items;
  const take = (phase: Exercise['phase'], count: number) => {
    const ordered = eligible
      .filter((exercise) => exercise.phase === phase)
      .sort((a, b) => Number(b.goals.includes(person.goal)) - Number(a.goals.includes(person.goal)));
    if (phase !== 'strength') return rotate(ordered).slice(0, count);
    const varied = ordered.filter((exercise, index, list) =>
      list.findIndex((candidate) => candidate.pattern === exercise.pattern) === index,
    );
    return rotate([...varied, ...ordered.filter((exercise) => !varied.includes(exercise))]).slice(0, count);
  };
  return {
    person,
    safety: safety.level,
    safetyTitle: safety.title,
    safetyNotes: safety.notes,
    sessions,
    exercises: safety.level === 'red' ? [] : [...take('warmup', 2), ...take('strength', 3), ...take('stretch', 3)],
  };
}

export function phaseLabel(phase: Exercise['phase']) {
  return { warmup: '暖身', strength: '主動作', stretch: '伸展' }[phase];
}

export function patternLabel(pattern: MovementPattern) {
  return { push: '推', pull: '拉', squat: '蹲', move: '移' }[pattern];
}

export function positionLabel(position: Position) {
  return { standing: '站姿', seated: '坐姿', mat: '墊上' }[position];
}

export function equipmentLabel(equipment: string) {
  return {
    bodyweight: '徒手',
    chair: '穩固椅子',
    wall: '牆面',
    bottle: '水瓶／啞鈴',
    booty_band: '臀力帶',
    ankle_weight: '綁腿沙袋',
    resistance_band: '彈力帶',
    pilates_ball: '皮拉提斯球',
  }[equipment] ?? equipment;
}

export const exerciseCount = exercises.length;

