
export interface StudySession {
  id: string;
  subject: string;
  topic: string;
  teamsId: string; // Identifiant Teams ou URL Webhook
  startTime: string;
  durationMinutes: number;
  isCompleted: boolean;
  breakdown?: string[];
  daysOfWeek?: number[];
  emailSent?: boolean; // On garde le nom technique ou on le renomme messageSent
  lastSentDate?: string;
}

export interface MotivationalQuote {
  text: string;
  author: string;
}
