# obter-imagem-exame — Contrato da API

Endpoint para que os modelos de Machine Learning obtenham acesso temporário às imagens de um estudo armazenadas no Supabase Storage.

## Endpoint

```
POST https://smhazjlrxuqxzpuauqan.supabase.co/functions/v1/obter-imagem-exame
```

## Autenticação

Chave API partilhada, fornecida em todos os pedidos no header `Authorization`:

```
Authorization: Bearer <SCOLIO_ML_API_KEY>
```

A chave é configurada como variável de ambiente no Supabase (`SCOLIO_ML_API_KEY`). Pede-a ao administrador do projecto.

## Pedido

### Headers
| Header | Valor |
|--------|-------|
| `Authorization` | `Bearer <SCOLIO_ML_API_KEY>` |
| `Content-Type` | `application/json` |

### Body
```json
{
  "estudoId": "uuid-do-estudo"
}
```

## Resposta de sucesso (200)

```json
{
  "estudoId": "550e8400-e29b-41d4-a716-446655440000",
  "pacienteId": "9c858901-8a57-4791-81fe-4c455b099bc9",
  "dataEstudo": "2026-05-10",
  "tipoEstudo": "RX_COLUNA_AP",
  "estado": "UPLOADED",
  "imagens": [
    {
      "id": "uuid-da-imagem",
      "url": "https://smhazjlrxuqxzpuauqan.supabase.co/storage/v1/object/sign/exam-images/...",
      "erroAssinatura": null,
      "expiresAt": "2026-05-15T19:30:00.000Z",
      "formato": "PNG",
      "projecao": "AP",
      "tamanhoBytes": 2458321,
      "hashIntegridade": "a3f5e8d2..."
    }
  ]
}
```

### Notas importantes

- **`url`** é uma signed URL válida durante 1 hora. Faz download da imagem para um buffer local antes de processar.
- **`hashIntegridade`** é o SHA-256 do conteúdo original. Verifica após download para garantir que a imagem não foi corrompida.
- **`projecao`** identifica a vista radiológica (AP, LAT, etc.) caso o modelo precise de diferenciar.
- **`expiresAt`** é absoluto (ISO 8601 UTC). Se passar deste momento, faz novo pedido.

## Respostas de erro

| Status | Quando | Body |
|--------|--------|------|
| `400` | `estudoId` em falta ou JSON malformado | `{ "erro": "estudoId é obrigatório" }` |
| `401` | API key em falta ou inválida | `{ "erro": "API key inválida" }` |
| `404` | Estudo não existe ou sem imagens | `{ "erro": "Estudo não encontrado" }` |
| `405` | Método HTTP diferente de POST | `{ "erro": "Método não permitido" }` |
| `410` | Estudo foi arquivado | `{ "erro": "Estudo arquivado — não disponível para análise" }` |
| `500` | Erro interno | `{ "erro": "<mensagem>" }` |

## Exemplo de uso (Python)

```python
import requests, hashlib

API_URL = "https://smhazjlrxuqxzpuauqan.supabase.co/functions/v1/obter-imagem-exame"
API_KEY = "<SCOLIO_ML_API_KEY>"

def obter_imagem(estudo_id: str) -> bytes:
    r = requests.post(
        API_URL,
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"estudoId": estudo_id},
        timeout=30,
    )
    r.raise_for_status()
    payload = r.json()

    # Por simplicidade pegamos a primeira imagem
    imagem = payload["imagens"][0]

    img_response = requests.get(imagem["url"], timeout=60)
    img_response.raise_for_status()
    img_bytes = img_response.content

    # Verificar integridade (opcional mas recomendado)
    if imagem["hashIntegridade"]:
        sha = hashlib.sha256(img_bytes).hexdigest()
        if sha != imagem["hashIntegridade"]:
            raise ValueError("Hash da imagem não corresponde — possível corrupção")

    return img_bytes
```

## Auditoria

Cada chamada bem-sucedida é registada em `audit_log` com `tipo_acao = "ACESSO_IMAGEM_IA"` e `entidade_id = estudoId`. Permite rastrear que estudos foram acedidos por modelos de IA, quando, e quantas vezes.

## Submissão de resultados

A definir — aguarda especificação do formato pelo lado dos modelos. Será criado um endpoint complementar `submeter-resultado-ia`.
