/**
 * Blue AI Client Service
 * 
 * Communicates with backend endpoints (/api/blue/*) and returns strongly typed proposals.
 */

import type {
  BlueMessage,
  DomainProposal,
  LessonsProposal,
  ModulesProposal,
  QuestionsProposal,
  ChatResponsePayload,
  AnswerEvaluation,
  StudyRecommendation
} from "./blueTypes";

export class BlueService {
  private static async post<T>(endpoint: string, payload: any): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const response = await fetch(`/api/blue/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || json.success === false) {
        return {
          success: false,
          error: json.error || `Erro (${response.status}) ao comunicar com a Blue.`,
        };
      }

      return {
        success: true,
        data: json.data !== undefined ? json.data : json,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Falha de rede ao conectar com a Blue.",
      };
    }
  }

  /**
   * Send a chat message with conversation history
   */
  public static async chat(
    userId: string,
    messages: { role: "user" | "assistant" | "model"; content: string }[],
    userContext?: {
      userName?: string;
      existingDomains?: string[];
      existingLessons?: string[];
      activeDomain?: string;
    }
  ): Promise<{ success: boolean; payload?: ChatResponsePayload; error?: string }> {
    const res = await this.post<ChatResponsePayload>("chat", { userId, messages, userContext });
    if (!res.success) return { success: false, error: res.error };
    return { success: true, payload: res.data };
  }

  /**
   * Propose a Domain based on topic & goals
   */
  public static async proposeDomain(
    userId: string,
    topic: string,
    userGoal?: string,
    userLevel?: string
  ): Promise<{ success: boolean; proposal?: DomainProposal; error?: string }> {
    const res = await this.post<DomainProposal>("propose-domain", { userId, topic, userGoal, userLevel });
    if (!res.success) return { success: false, error: res.error };
    return { success: true, proposal: res.data };
  }

  /**
   * Suggest Lessons for a Domain
   */
  public static async suggestLessons(
    userId: string,
    domainName: string,
    domainGoal?: string,
    userLevel?: string,
    existingLessons?: string[]
  ): Promise<{ success: boolean; proposal?: LessonsProposal; error?: string }> {
    const res = await this.post<{ lessons: any[] }>("suggest-lessons", {
      userId,
      domainName,
      domainGoal,
      userLevel,
      existingLessons,
    });
    if (!res.success || !res.data?.lessons) {
      return { success: false, error: res.error || "Não foi possível gerar lições." };
    }
    return {
      success: true,
      proposal: {
        domainName,
        lessons: res.data.lessons.map(l => ({ ...l, selected: true })),
      },
    };
  }

  /**
   * Suggest Modules for a Lesson
   */
  public static async suggestModules(
    userId: string,
    domainName: string,
    lessonName: string,
    lessonObjective?: string,
    existingModules?: string[]
  ): Promise<{ success: boolean; proposal?: ModulesProposal; error?: string }> {
    const res = await this.post<{ modules: any[] }>("suggest-modules", {
      userId,
      domainName,
      lessonName,
      lessonObjective,
      existingModules,
    });
    if (!res.success || !res.data?.modules) {
      return { success: false, error: res.error || "Não foi possível gerar módulos." };
    }
    return {
      success: true,
      proposal: {
        domainName,
        lessonName,
        modules: res.data.modules.map(m => ({ ...m, selected: true })),
      },
    };
  }

  /**
   * Generate Active Recall Questions for a Module/Lesson
   */
  public static async generateQuestions(
    userId: string,
    domainName: string,
    lessonName: string,
    moduleName?: string,
    count?: number,
    difficulty?: string
  ): Promise<{ success: boolean; proposal?: QuestionsProposal; error?: string }> {
    const res = await this.post<{ questions: any[] }>("generate-questions", {
      userId,
      domainName,
      lessonName,
      moduleName,
      count,
      difficulty,
    });
    if (!res.success || !res.data?.questions) {
      return { success: false, error: res.error || "Não foi possível gerar perguntas." };
    }
    return {
      success: true,
      proposal: {
        domainName,
        lessonName,
        moduleName: moduleName || "Geral",
        questions: res.data.questions.map(q => ({ ...q, selected: true })),
      },
    };
  }

  /**
   * Evaluate Active Recall Answer
   */
  public static async evaluateAnswer(
    userId: string,
    questionTitle: string,
    userAnswer: string,
    vaultReference?: string
  ): Promise<{ success: boolean; evaluation?: AnswerEvaluation; error?: string }> {
    const res = await this.post<AnswerEvaluation>("evaluate-answer", {
      userId,
      questionTitle,
      userAnswer,
      vaultReference,
    });
    if (!res.success) return { success: false, error: res.error };
    return { success: true, evaluation: res.data };
  }

  /**
   * Get Study Recommendations
   */
  public static async getRecommendations(
    userId: string,
    metrics: {
      domainsCount: number;
      lessonsCount: number;
      questionsCount: number;
      overdueReviewsCount: number;
      masteredPercentage: number;
      recentDomainNames: string[];
    }
  ): Promise<{ success: boolean; recommendations?: StudyRecommendation[]; error?: string }> {
    const res = await this.post<{ recommendations: StudyRecommendation[] }>("recommendations", {
      userId,
      ...metrics,
    });
    if (!res.success || !res.data?.recommendations) {
      return { success: false, error: res.error };
    }
    return { success: true, recommendations: res.data.recommendations };
  }
}
