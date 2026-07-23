export type TamanhoResposta = "curto" | "medio" | "longo";

export type Agente = {
  id: string;
  nome: string;
  associacao: string;
  ativo: boolean;
  tom_personalidade: string;
  tamanho_resposta: TamanhoResposta;
  prompt_base: string;
  created_at: string;
  updated_at: string;
};

export type FonteTipo = "faq" | "site" | "pagina_unica" | "documento" | "youtube" | "audio";
export type FonteStatus = "pendente" | "processando" | "pronto" | "erro";

export type FonteConhecimento = {
  id: string;
  agente_id: string;
  tipo: FonteTipo;
  titulo: string;
  conteudo: string | null;
  url: string | null;
  arquivo_path: string | null;
  status: FonteStatus;
  erro_detalhe: string | null;
  created_at: string;
  updated_at: string;
};

export type Gatilho = {
  id: string;
  agente_id: string;
  intencao: string;
  acao_tipo: string;
  acao_config: Record<string, unknown>;
  ativo: boolean;
  created_at: string;
};

export type PanelUser = {
  id: string;
  email: string;
  role: "admin" | "editor";
  created_at: string;
};

export type IntegracaoTipo = "chatwoot" | "rd_station" | "whatsapp";

export type Integracao = {
  id: string;
  agente_id: string;
  tipo: IntegracaoTipo;
  config: Record<string, string>;
  updated_at: string;
};
