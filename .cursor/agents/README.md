# Agentes do Boi Training / Touro Fit

Fonte única de referência para implementação. Antes de codar, leia os agentes relevantes abaixo.

| Agente | Pasta | Quando usar |
|--------|-------|-------------|
| Mobile Architect | `mobile-architect/` | Estrutura, pastas, estado, auth flow, arquitetura |
| Mobile UI/UX Designer | `mobile-ui-ux-designer/` | Telas, componentes, design system, estados UX |
| React Native Developer | `react-native-developer/` | Implementação RN + TypeScript |
| Supabase Engineer | `supabase-engineer/` | Schema, RLS, Auth, Storage, migrations |
| API & Integration | `api-integration-engineer/` | APIs, webhooks, edge functions, secrets |
| QA Engineer | `qa-engineer/` | Checklist de qualidade, testes, edge cases |
| Mobile Security | `mobile-security-engineer/` | Secrets, RLS, autorização, vulnerabilidades |
| Performance & Release | `performance-release-engineer/` | Performance, listas, release |
| Project Manager | `software-project-manager/` | Planejar tarefas, ordem, DoD (não implementar) |
| Code Reviewer | `code-reviewer/` | Revisar código antes de considerar pronto |

## Mínimo obrigatório ao codar

1. `react-native-developer` — sempre em mudanças de app
2. `mobile-architect` — se tocar estrutura, fluxos ou camadas
3. `mobile-ui-ux-designer` — se tocar UI/telas
4. `supabase-engineer` — se tocar `supabase/` ou queries
5. `code-reviewer` — antes de declarar a tarefa pronta
