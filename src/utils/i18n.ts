export type Language = "pt-BR" | "en-US";

export const translations = {
  "pt-BR": {
    // Navigation & Shell
    "nav.home": "Home (Dashboard)",
    "nav.domains": "Domínios",
    "nav.knowledge": "Knowledge DB",
    "nav.session": "Study Session",
    "nav.crono": "Crono Semanal",
    "nav.reviews": "Revisões",
    "nav.settings": "Configurações",
    "nav.ai": "KOS AI Copilot",
    "nav.quick_add": "Quick Add",
    "nav.guest": "Modo Convidado",
    "nav.logout": "Sair da Conta",

    // Dashboard
    "dash.greeting": "Pronto para sua sessão de estudo?",
    "dash.recommendation": "RECOMENDAÇÃO INTELIGENTE DE HOJE",
    "dash.open_question": "Abrir Página da Question",
    "dash.start_session": "Iniciar Session",
    "dash.empty_questions": "Nenhuma pergunta cadastrada. Crie sua primeira question para iniciar!",
    "dash.streak": "STREAK DE FOCO",
    "dash.active_today": "🔥 Ativo hoje",
    "dash.study_today": "⚡ Estude para manter",
    "dash.this_week": "Esta semana",
    "dash.weekly_activity": "Atividade Semanal de Estudo",
    "dash.retention_cycle": "Ciclo de Retenção (Spaced Repetition)",
    "dash.clear_filter": "Limpar Filtro",
    "dash.all_domains": "Todos os Domínios de Conhecimento",
    "dash.view_all": "Ver Todos",
    
    // Stages
    "stage.study": "Study",
    "stage.fixation": "Fixation",
    "stage.weekly": "Weekly",
    "stage.monthly": "Monthly",
    "stage.mastered": "Mastered",
    
    // Settings Tabs
    "settings.title": "Preferências do KOS",
    "settings.account": "Conta",
    "settings.appearance": "Aparência",
    "settings.learning": "Aprendizado",
    "settings.notifications": "Notificações",
    "settings.data": "Dados & Workspace",
    "settings.app": "App & Dispositivo",
    "settings.privacy": "Privacidade",
    "settings.advanced": "Avançado",
    "settings.about": "Sobre o KOS",
    "settings.save": "Salvar Configurações",
    "settings.saving": "Salvando...",
    "settings.saved_success": "Configurações salvas com sucesso!",

    // Settings General
    "settings.theme": "Tema Visual",
    "settings.theme_dark": "Dark (Escuro)",
    "settings.theme_light": "Light (Claro)",
    "settings.theme_system": "Sistema",
    "settings.accent_color": "Cor de Destaque",
    "settings.language": "Idioma da Interface",
    "settings.density": "Densidade da Interface",
    "settings.density_comfortable": "Confortável",
    "settings.density_compact": "Compacto",
    "settings.backup_download": "Baixar Backup Completo (.JSON)",
    "settings.export_csv": "Exportar Planilha (.CSV)",
    "settings.export_md": "Exportar Vaults (.MD)",
    "settings.import_notion": "Importar do Notion",
    "settings.clear_cache": "Limpar Cache do Navegador",
  },
  "en-US": {
    // Navigation & Shell
    "nav.home": "Home (Dashboard)",
    "nav.domains": "Domains",
    "nav.knowledge": "Knowledge DB",
    "nav.session": "Study Session",
    "nav.crono": "Weekly Crono",
    "nav.reviews": "Reviews",
    "nav.settings": "Settings",
    "nav.ai": "KOS AI Copilot",
    "nav.quick_add": "Quick Add",
    "nav.guest": "Guest Mode",
    "nav.logout": "Log Out",

    // Dashboard
    "dash.greeting": "Ready for your study session?",
    "dash.recommendation": "SMART RECOMMENDATION FOR TODAY",
    "dash.open_question": "Open Question Page",
    "dash.start_session": "Start Session",
    "dash.empty_questions": "No questions created yet. Create your first question to begin!",
    "dash.streak": "FOCUS STREAK",
    "dash.active_today": "🔥 Active today",
    "dash.study_today": "⚡ Study today to keep it",
    "dash.this_week": "This week",
    "dash.weekly_activity": "Weekly Study Activity",
    "dash.retention_cycle": "Retention Cycle (Spaced Repetition)",
    "dash.clear_filter": "Clear Filter",
    "dash.all_domains": "All Knowledge Domains",
    "dash.view_all": "View All",

    // Stages
    "stage.study": "Study",
    "stage.fixation": "Fixation",
    "stage.weekly": "Weekly",
    "stage.monthly": "Monthly",
    "stage.mastered": "Mastered",

    // Settings Tabs
    "settings.title": "KOS Preferences",
    "settings.account": "Account",
    "settings.appearance": "Appearance",
    "settings.learning": "Learning",
    "settings.notifications": "Notifications",
    "settings.data": "Data & Workspace",
    "settings.app": "App & Device",
    "settings.privacy": "Privacy",
    "settings.advanced": "Advanced",
    "settings.about": "About KOS",
    "settings.save": "Save Settings",
    "settings.saving": "Saving...",
    "settings.saved_success": "Settings saved successfully!",

    // Settings General
    "settings.theme": "Visual Theme",
    "settings.theme_dark": "Dark",
    "settings.theme_light": "Light",
    "settings.theme_system": "System",
    "settings.accent_color": "Accent Color",
    "settings.language": "Interface Language",
    "settings.density": "Interface Density",
    "settings.density_comfortable": "Comfortable",
    "settings.density_compact": "Compact",
    "settings.backup_download": "Download Complete Backup (.JSON)",
    "settings.export_csv": "Export Spreadsheet (.CSV)",
    "settings.export_md": "Export Vaults (.MD)",
    "settings.import_notion": "Import from Notion",
    "settings.clear_cache": "Clear Browser Cache",
  }
};

export function getTranslation(lang: Language = "pt-BR", key: string): string {
  const dict = translations[lang] || translations["pt-BR"];
  return (dict as any)[key] || key;
}
