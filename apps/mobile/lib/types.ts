export type UserRole = 'aluno' | 'professor';

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  streak_days: number;
  phone?: string | null;
  bio?: string;
  birth_date?: string | null;
  cref?: string | null;
  specialties?: string | null;
  city?: string | null;
  instagram?: string | null;
  created_at?: string;
};

export type Notification = { id: string; user_id: string; title: string; body: string; kind: string; read_at: string | null; created_at: string };
export type Appointment = { id: string; coach_id: string; student_id: string; starts_at: string; ends_at: string; status: 'requested' | 'confirmed' | 'cancelled' | 'completed'; notes: string };

export type Workout = {
  id: string;
  coach_id: string;
  student_id: string;
  title: string;
  focus: string | null;
  duration_minutes: number;
  level: string;
  scheduled_for: string | null;
  created_at?: string;
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
  catalog_exercise_id?: string | null;
  video_url?: string | null;
};

export type Availability = {
  id: string;
  coach_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  valid_month: string | null;
};

export type ExerciseCatalog = {
  id: string;
  name: string;
  muscle_group: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  instructions?: string | null;
  equipment?: string[];
  video_source?: string;
  audit_image_status?: 'correto' | 'incorreto' | 'pendente';
  audit_video_status?: 'correto' | 'incorreto' | 'pendente';
  audit_notes?: string | null;
  category?: string | null;
  primary_muscles?: string[];
  secondary_muscles?: string[];
};

export type CoachExerciseVideo = {
  id: string;
  coach_id: string;
  exercise_id: string;
  video_url: string;
  source: 'upload' | 'url';
  storage_path: string | null;
};

export type WorkoutSession = {
  id: string;
  workout_id: string;
  student_id: string;
  started_at: string;
  finished_at: string | null;
  status: 'in_progress' | 'completed' | 'cancelled';
  perceived_exertion?: number | null;
  total_volume_kg?: number;
};

export type SetLog = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
};

export type StudentAnamnesis = {
  id: string;
  student_id: string;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string;
  experience_level: string;
  health_conditions: string;
  injuries: string;
  medications: string;
  exercise_restrictions: string;
  emergency_contact: string;
  medical_clearance: boolean;
  consent: boolean;
  created_at: string;
  updated_at: string;
  available_training_days: string[];
  parq_answers: Record<string, boolean>;
  is_complete: boolean;
};

export type AnamnesisHistory = {
  id: string;
  student_id: string;
  anamnesis_id: string | null;
  snapshot: StudentAnamnesis;
  changed_by: string | null;
  created_at: string;
};
