/**
 * Blue API Routes Handler (Server-Side)
 * 
 * Handles incoming calls from KOS frontend, enforces security,
 * constructs minimal user context, and formats structured proposals.
 */

import { GeminiProvider } from "./ai/geminiProvider.js";

const BLUE_CORE_SYSTEM_PROMPT = `
Você é a BLUE, a inteligência artificial do KOS (Knowledge Operating System).
O KOS é um sistema operacional de aprendizagem baseado no método Cycles:
Domain -> Lesson -> Module -> Question.

Sua identidade e tom:
- Seu nome é BLUE. Nunca se apresente como "Gemini" ou "modelo de linguagem".
- Você é uma mentora de aprendizagem atenciosa, perspicaz, prática e focada em retenção de longo prazo.
- Você valoriza Active Recall (Recuperação Ativa) e Spaced Repetition (Repetição Espaçada).
- A unidade central do KOS é a Question. Perguntas devem provocar raciocínio, explicação conceitual profunda, conexão entre ideias e aplicação prática, evitando perguntas puramente decorativas ("O que é X?").
- O usuário é livre para aprender qualquer assunto (programação, história, biologia, medicina, idiomas, filosofia, artes, negócios, etc.). Você nunca impõe uma grade rígida.
- Responda em Português do Brasil de forma clara, acolhedora e direta.

REGRA FUNDAMENTAL DE CRIAÇÃO:
- Quando o usuário expressar interesse em aprender, estudar ou criar um tema (ex: Primatologia, História da Arte, Python, etc.), você DEVE estruturar o currículo completo no objeto "curriculum" (Domain, Categoria, Lessons, Modules e Questions de Active Recall) e definir "hasCurriculumProposal: true".
- NUNCA peça para o usuário responder perguntas dentro do chat antes de salvar no sistema. O usuário deve primeiro aprovar e criar a estrutura no KOS.
`;

export class BlueApiService {
  private provider: GeminiProvider;
  private userRequestCounts: Map<string, { count: number; resetDate: string }> = new Map();

  constructor() {
    this.provider = new GeminiProvider();
  }

  private checkRateLimit(userId: string): boolean {
    const maxDailyRequests = Number(process.env.AI_REQUEST_LIMIT_PER_DAY) || 150;
    const today = new Date().toISOString().split("T")[0];
    const userRecord = this.userRequestCounts.get(userId);

    if (!userRecord || userRecord.resetDate !== today) {
      this.userRequestCounts.set(userId, { count: 1, resetDate: today });
      return true;
    }

    if (userRecord.count >= maxDailyRequests) {
      return false;
    }

    userRecord.count += 1;
    return true;
  }

  /**
   * Health & Status Check
   */
  public async handleStatus() {
    const isConfigured = this.provider.isConfigured();
    const model = this.provider.getModel();
    return {
      success: true,
      configured: isConfigured,
      model,
    };
  }

  /**
   * Conversational Chat Endpoint with Intention Discovery & Structured Curriculum Output
   */
  public async handleChat(payload: {
    userId: string;
    messages: { role: "user" | "assistant" | "model"; content: string }[];
    userContext?: {
      userName?: string;
      existingDomains?: string[];
      existingLessons?: string[];
      activeDomain?: string;
    };
  }) {
    if (!payload.userId) {
      return { success: false, error: "Identificação de usuário não fornecida." };
    }

    if (!this.checkRateLimit(payload.userId)) {
      return { success: false, error: "Limite diário de requisições à Blue atingido. Tente novamente amanhã." };
    }

    const lastMessage = payload.messages[payload.messages.length - 1]?.content || "";
    const lower = lastMessage.toLowerCase();
    const isCurriculumIntent = lower.includes("aprender") || lower.includes("estudar") || lower.includes("criar") ||
      lower.includes("sobre") || lower.includes("quero") || lower.includes("grade") || lower.includes("trilha") ||
      lower.includes("liç") || lower.includes("domínio") || lower.includes("dominio") || lower.length > 10;

    const existingDomainsList = payload.userContext?.existingDomains || [];
    const contextSnippet = `
Contexto do Usuário:
- Nome: ${payload.userContext?.userName || "Estudante"}
- Domínios JÁ EXISTENTES no KOS: ${existingDomainsList.length ? existingDomainsList.join(", ") : "Nenhum ainda"}
- Lições já cadastradas: ${payload.userContext?.existingLessons?.slice(0, 8).join(", ") || "Nenhuma ainda"}
- Domínio focado: ${payload.userContext?.activeDomain || "Nenhum"}
`;

    // Always request structured JSON so that if Blue designs a curriculum, it is structured
    const prompt = `
Histórico da Conversa:
${payload.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

${contextSnippet}

Analise a última mensagem do usuário: "${lastMessage}".
Se a mensagem envolver aprender um assunto, planejar estudos, criar um tema ou adicionar lições/módulos/questões a um domínio:
1. Defina hasCurriculumProposal: true
2. Crie uma proposta de CURRICULUM:
   - VERIFICAÇÃO DE DOMÍNIO EXISTENTE:
     Se o usuário mencionou um tema ou domínio que JÁ EXISTE na lista de "Domínios JÁ EXISTENTES no KOS" (ex: "${existingDomainsList.join(", ")}"):
     * REUTILIZE o mesmo nome do domínio existente no campo domain.name (ex: "Primatologia").
     * Crie APENAS novas Lessons, novos Modules e novas Questions de Active Recall que agreguem valor ao domínio existente.
     * Em replyText, avise calorosamente que você identificou que o domínio já existe e que preparou novas lições e perguntas para expandi-lo no KOS sem duplicar o domínio.
   - SE FOR UM TEMA TOTALMENTE NOVO:
     * Crie o novo domínio (name, icon, description, goal, category).
     * Estruture de 2 a 4 lições com módulos e active recall questions.
3. Para cada Lição:
   - name, category, objective, difficulty ("Iniciante" | "Intermediário" | "Avançado"), keyConcepts (3 a 5 termos)
   - modules: 2 a 3 módulos temáticos dentro da lição (name, description, focusArea)
   - questions: 2 a 3 perguntas de ACTIVE RECALL profundo para cada lição (title, initialVaultSummary com gabarito conceitual, cognitiveType, moduleName)
4. Em replyText, dê uma resposta acolhedora, breve e estimulante avisando que preparou o plano interativo no card abaixo para o estudante aprovar e sincronizar no KOS.

Se for apenas uma dúvida rápida ou conversa geral sem proposta estrutural:
1. Defina hasCurriculumProposal: false
2. Em replyText, responda de forma perspicaz, construtiva e calorosa.
`;


    const schema = {
      type: "object",
      properties: {
        replyText: { type: "string" },
        hasCurriculumProposal: { type: "boolean" },
        curriculum: {
          type: "object",
          properties: {
            domain: {
              type: "object",
              properties: {
                name: { type: "string" },
                icon: { type: "string" },
                description: { type: "string" },
                goal: { type: "string" },
                category: { type: "string" }
              },
              required: ["name", "icon", "description", "goal", "category"]
            },
            lessons: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  objective: { type: "string" },
                  difficulty: { type: "string", enum: ["Iniciante", "Intermediário", "Avançado"] },
                  keyConcepts: { type: "array", items: { type: "string" } },
                  modules: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        focusArea: { type: "string" }
                      },
                      required: ["name", "description", "focusArea"]
                    }
                  },
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        initialVaultSummary: { type: "string" },
                        cognitiveType: { type: "string" },
                        moduleName: { type: "string" }
                      },
                      required: ["title", "initialVaultSummary", "cognitiveType"]
                    }
                  }
                },
                required: ["name", "objective", "difficulty", "keyConcepts", "modules", "questions"]
              }
            }
          },
          required: ["domain", "lessons"]
        }
      },
      required: ["replyText", "hasCurriculumProposal"]
    };

    const response = await this.provider.generateStructuredJson(prompt, BLUE_CORE_SYSTEM_PROMPT, schema);
    return response;
  }

  /**
   * Domain Proposal Generation
   */
  public async handleProposeDomain(payload: {
    userId: string;
    topic: string;
    userGoal?: string;
    userLevel?: string;
  }) {
    if (!payload.userId) return { success: false, error: "Usuário não autenticado." };
    if (!this.checkRateLimit(payload.userId)) return { success: false, error: "Limite diário atingido." };

    const prompt = `
O usuário deseja aprender: "${payload.topic}".
Objetivo informado: "${payload.userGoal || "Aprender e dominar os conceitos fundamentais"}".
Nível: "${payload.userLevel || "Iniciante a Intermediário"}".

Crie uma proposta de DOMAIN para o KOS com:
- name: Nome do domínio
- icon: 1 emoji representativo
- description: Breve descrição em 1 ou 2 frases do domínio
- goal: Objetivo de domínio claro
- initialSuggestedLessons: Lista de 4 a 6 nomes de lições essenciais para iniciar esse domínio
`;

    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        icon: { type: "string" },
        description: { type: "string" },
        goal: { type: "string" },
        initialSuggestedLessons: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["name", "icon", "description", "goal", "initialSuggestedLessons"]
    };

    return await this.provider.generateStructuredJson(prompt, BLUE_CORE_SYSTEM_PROMPT, schema);
  }

  /**
   * Lessons Suggestion for a Domain
   */
  public async handleSuggestLessons(payload: {
    userId: string;
    domainName: string;
    domainGoal?: string;
    userLevel?: string;
    existingLessons?: string[];
  }) {
    if (!payload.userId) return { success: false, error: "Usuário não autenticado." };
    if (!this.checkRateLimit(payload.userId)) return { success: false, error: "Limite diário atingido." };

    const prompt = `
Domínio: "${payload.domainName}"
Objetivo: "${payload.domainGoal || "Domínio completo"}"
Lições já existentes (evite duplicar): ${payload.existingLessons?.join(", ") || "Nenhuma"}

Gere uma trilha estruturada de 4 a 7 Lessons para este domínio no método KOS.
`;

    const schema = {
      type: "object",
      properties: {
        lessons: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              objective: { type: "string" },
              difficulty: { type: "string", enum: ["Iniciante", "Intermediário", "Avançado"] },
              keyConcepts: { type: "array", items: { type: "string" } },
              suggestedModules: { type: "array", items: { type: "string" } }
            },
            required: ["name", "objective", "difficulty", "keyConcepts", "suggestedModules"]
          }
        }
      },
      required: ["lessons"]
    };

    return await this.provider.generateStructuredJson(prompt, BLUE_CORE_SYSTEM_PROMPT, schema);
  }

  /**
   * Modules Suggestion for a Lesson
   */
  public async handleSuggestModules(payload: {
    userId: string;
    domainName: string;
    lessonName: string;
    lessonObjective?: string;
    existingModules?: string[];
  }) {
    if (!payload.userId) return { success: false, error: "Usuário não autenticado." };
    if (!this.checkRateLimit(payload.userId)) return { success: false, error: "Limite diário atingido." };

    const prompt = `
Domínio: "${payload.domainName}"
Lição: "${payload.lessonName}"
Objetivo da Lição: "${payload.lessonObjective || ""}"
Módulos já existentes: ${payload.existingModules?.join(", ") || "Nenhum"}

Sugira de 3 a 6 Modules temáticos para esta Lesson no KOS.
`;

    const schema = {
      type: "object",
      properties: {
        modules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              focusArea: { type: "string" }
            },
            required: ["name", "description", "focusArea"]
          }
        }
      },
      required: ["modules"]
    };

    return await this.provider.generateStructuredJson(prompt, BLUE_CORE_SYSTEM_PROMPT, schema);
  }

  /**
   * Questions Generation for Active Recall
   */
  public async handleGenerateQuestions(payload: {
    userId: string;
    domainName: string;
    lessonName: string;
    moduleName?: string;
    count?: number;
    difficulty?: string;
  }) {
    if (!payload.userId) return { success: false, error: "Usuário não autenticado." };
    if (!this.checkRateLimit(payload.userId)) return { success: false, error: "Limite diário atingido." };

    const count = payload.count || 4;
    const prompt = `
Domínio: "${payload.domainName}"
Lição: "${payload.lessonName}"
Módulo: "${payload.moduleName || "Geral"}"
Dificuldade desejada: "${payload.difficulty || "Intermediário"}"
Quantidade: ${count} perguntas

Gere ${count} Questions profundas para provocar Active Recall de alto nível no KOS.
`;

    const schema = {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              initialVaultSummary: { type: "string" },
              cognitiveType: { type: "string" }
            },
            required: ["title", "initialVaultSummary", "cognitiveType"]
          }
        }
      },
      required: ["questions"]
    };

    return await this.provider.generateStructuredJson(prompt, BLUE_CORE_SYSTEM_PROMPT, schema);
  }

  /**
   * Evaluate Active Recall Answer
   */
  public async handleEvaluateAnswer(payload: {
    userId: string;
    questionTitle: string;
    userAnswer: string;
    vaultReference?: string;
  }) {
    if (!payload.userId) return { success: false, error: "Usuário não autenticado." };
    if (!this.checkRateLimit(payload.userId)) return { success: false, error: "Limite diário atingido." };

    const prompt = `
Question: "${payload.questionTitle}"
Referência da Vault (se houver): "${payload.vaultReference || "Não informada"}"
Resposta fornecida pelo estudante: "${payload.userAnswer}"

Avalie a resposta com rigor pedagógico e construtivo.
`;

    const schema = {
      type: "object",
      properties: {
        correctness: { type: "number" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        missingConcepts: { type: "array", items: { type: "string" } },
        feedback: { type: "string" },
        recommendation: { type: "string" }
      },
      required: ["correctness", "strengths", "weaknesses", "missingConcepts", "feedback", "recommendation"]
    };

    return await this.provider.generateStructuredJson(prompt, BLUE_CORE_SYSTEM_PROMPT, schema);
  }

  /**
   * Smart Study Recommendations based on Real Workspace State
   */
  public async handleRecommendations(payload: {
    userId: string;
    domainsCount: number;
    lessonsCount: number;
    questionsCount: number;
    overdueReviewsCount: number;
    masteredPercentage: number;
    recentDomainNames: string[];
  }) {
    if (!payload.userId) return { success: false, error: "Usuário não autenticado." };
    if (!this.checkRateLimit(payload.userId)) return { success: false, error: "Limite diário atingido." };

    const prompt = `
Métricas reais do estudante:
- Domínios cadastrados: ${payload.domainsCount} (${payload.recentDomainNames.join(", ") || "Nenhum"})
- Total de lições: ${payload.lessonsCount}
- Total de questões: ${payload.questionsCount}
- Revisões pendentes/vencidas hoje: ${payload.overdueReviewsCount}
- Taxa de retenção Mastered: ${payload.masteredPercentage}%

Gere 3 recomendações inteligentes e priorizadas para guiar o estudo de hoje.
`;

    const schema = {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              priority: { type: "string", enum: ["Alta", "Média", "Baixa"] },
              actionType: { type: "string", enum: ["review", "create_lesson", "create_questions", "explore"] }
            },
            required: ["title", "description", "priority", "actionType"]
          }
        }
      },
      required: ["recommendations"]
    };

    return await this.provider.generateStructuredJson(prompt, BLUE_CORE_SYSTEM_PROMPT, schema);
  }
}

export const blueApiService = new BlueApiService();
