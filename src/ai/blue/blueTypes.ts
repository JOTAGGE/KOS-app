/**
 * Blue AI Frontend Type Definitions
 */

export interface BlueMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  type?: "text" | "curriculum_proposal" | "domain_proposal" | "lessons_proposal" | "modules_proposal" | "questions_proposal" | "recommendations" | "error";
  data?: any;
}

export interface DomainProposal {
  name: string;
  icon: string;
  description: string;
  goal: string;
  category?: string;
  initialSuggestedLessons: string[];
}

export interface LessonProposalItem {
  name: string;
  category?: string;
  objective: string;
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  keyConcepts: string[];
  suggestedModules: string[];
  selected?: boolean;
}

export interface LessonsProposal {
  domainName: string;
  categoryName?: string;
  lessons: LessonProposalItem[];
}

export interface ModuleProposalItem {
  name: string;
  description: string;
  focusArea: string;
  selected?: boolean;
}

export interface ModulesProposal {
  domainName: string;
  lessonName: string;
  modules: ModuleProposalItem[];
}

export interface QuestionProposalItem {
  title: string;
  initialVaultSummary: string;
  cognitiveType: string;
  moduleName?: string;
  selected?: boolean;
}

export interface QuestionsProposal {
  domainName: string;
  lessonName: string;
  moduleName: string;
  questions: QuestionProposalItem[];
}

export interface CurriculumLesson {
  name: string;
  category?: string;
  objective: string;
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  keyConcepts: string[];
  modules: {
    name: string;
    description: string;
    focusArea: string;
  }[];
  questions: {
    title: string;
    initialVaultSummary: string;
    cognitiveType: string;
    moduleName?: string;
  }[];
  selected?: boolean;
}

export interface FullCurriculumProposal {
  domain: {
    name: string;
    icon: string;
    description: string;
    goal: string;
    category: string;
  };
  lessons: CurriculumLesson[];
}

export interface ChatResponsePayload {
  replyText: string;
  hasCurriculumProposal?: boolean;
  curriculum?: FullCurriculumProposal;
}

export interface AnswerEvaluation {
  correctness: number;
  strengths: string[];
  weaknesses: string[];
  missingConcepts: string[];
  feedback: string;
  recommendation: string;
}

export interface StudyRecommendation {
  title: string;
  description: string;
  priority: "Alta" | "Média" | "Baixa";
  actionType: "review" | "create_lesson" | "create_questions" | "explore";
}
