export type UserRole = 'aluno' | 'professor';

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  streak_days: number;
};

export type Workout = {
  id: string;
  coach_id: string;
  student_id: string;
  title: string;
  focus: string | null;
  duration_minutes: number;
  level: string;
  scheduled_for: string | null;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  name: string;
  muscle_group: string | null;
  sets: number;
  reps: number;
  target_weight_kg: number | null;
  image_url: string | null;
  sort_order: number;
};

export type WorkoutSession = {
  id: string;
  workout_id: string;
  student_id: string;
  started_at: string;
  finished_at: string | null;
  status: 'in_progress' | 'completed' | 'cancelled';
};

export type SetLog = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
};
