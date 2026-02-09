
export interface StudySession {
  id: string;
  subject: string;
  topic: string;
  email: string;
  startTime: string;
  durationMinutes: number;
  isCompleted: boolean;
  breakdown?: string[];
  emailSent?: boolean;
}

export interface MotivationalQuote {
  text: string;
  author: string;
}
