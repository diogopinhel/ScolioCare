# Lógica de estados de exame — App Móvel (Paciente)

Este documento descreve o que deve ser mostrado ao paciente em cada estado do exame.
A fonte de verdade é o campo `estado` da tabela `estudos` no Supabase.

---

## Estados da BD vs. estados visíveis ao paciente

| Estado na BD | Etiqueta visível | Conteúdo desbloqueado |
|---|---|---|
| `UPLOADED` | **Carregado** | Nenhum |
| `PROCESSING` | **Pendente** | Nenhum |
| `PENDING_VALIDATION` | **Pendente** | Nenhum |
| `VALIDATED` | **Pendente** | Nenhum |
| `SENT` | **Analisado** | Tudo (ver abaixo) |
| `ARCHIVED` | — | Não mostrar |

**Regra geral: só mostrar conteúdo clínico quando `estado = 'SENT'`.**

---

## O que mostrar em cada estado

### Estado Pendente (`UPLOADED` / `PROCESSING` / `PENDING_VALIDATION` / `VALIDATED`)

- Mostrar card do exame com design de "em análise" (ícone de loading, fundo neutro)
- **Não mostrar**: ângulo de Cobb, imagens radiográficas, relatório PDF, gráfico de progresso
- Texto: "Exame em análise" ou equivalente
- Se o exame ainda não foi aberto pelo paciente: mostrar badge **"Novo"**

### Estado Analisado (`SENT`)

- Mostrar card do exame com design normal
- **Mostrar**: ângulo de Cobb, imagens radiográficas, relatório PDF
- Adicionar ponto ao gráfico de "Recent Progress" (ver abaixo)
- Se o exame ainda não foi aberto pelo paciente: mostrar badge **"Novo"**

---

## Último Exame (homepage)

- Deve mostrar **sempre** o exame mais recente, independentemente do estado
- Adaptar o design conforme a tabela acima
- **Não filtrar por `estado = 'SENT'`** — o paciente precisa de saber que o exame existe mesmo que ainda esteja pendente

---

## Gráfico "Recent Progress"

- Cada ponto do gráfico representa um exame **já enviado ao paciente** (`estado = 'SENT'`)
- **Só adicionar um ponto quando `estado = 'SENT'`** — nunca em PROCESSING, PENDING_VALIDATION ou VALIDATED
- O valor do ponto é o ângulo de Cobb do exame (`resultados.angulo_cobb_corrigido` se existir, caso contrário `resultados.angulo_cobb`)
- O eixo X é a `data_estudo` do exame
- Query sugerida:

```sql
SELECT e.data_estudo, 
       COALESCE(r.angulo_cobb_corrigido, r.angulo_cobb) AS angulo
FROM estudos e
JOIN resultados r ON r.estudo_id = e.id
WHERE e.paciente_id = <id_do_paciente>
  AND e.estado = 'SENT'
  AND e.arquivado = false
ORDER BY e.data_estudo ASC;
```

---

## Notificações recebidas pelo paciente

| Quando dispara | Título (PT) | Título (EN) |
|---|---|---|
| Exame carregado (`UPLOADED`) | "Novo exame registado" | "New exam registered" |
| LLM concluiu (`PENDING_VALIDATION`) | "Exame em análise" | "Exam under analysis" |
| Médico enviou (`SENT`) | "Resultado disponível" | "Results available" |

As notificações estão na tabela `notificacoes`. Para mostrar no idioma correto:

```js
const titulo  = lang === 'en' && n.titulo_en  ? n.titulo_en  : n.titulo;
const mensagem = lang === 'en' && n.mensagem_en ? n.mensagem_en : n.mensagem;
```

Esta lógica deve ser aplicada em **todos os sítios** que mostram notificações (sino, banner, "Recent Progress", etc.).

---

## Resumo visual do fluxo

```
Técnico faz upload
        ↓
   [UPLOADED] ──→ notificação "Novo exame registado"
        ↓
  [PROCESSING]   (sem notificação)
        ↓
[PENDING_VALIDATION] ──→ notificação "Exame em análise"
        ↓
  [VALIDATED]    (sem notificação — médico validou internamente)
        ↓
    [SENT] ──→ notificação "Resultado disponível"
               ↓
        Desbloquear todo o conteúdo clínico
        Adicionar ponto ao gráfico
```
