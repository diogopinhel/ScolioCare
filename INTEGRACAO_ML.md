## 1. O que a web app vos envia

Pedido `POST /analyze` com body JSON:

```json
{
  "estudoId": "uuid-do-estudo",
  "imageUrl": "https://...supabase.../signed-url-temporária-1h..."
}
```

A `imageUrl` é uma signed URL pública (válida 1h) para o vosso código fazer download da imagem diretamente do Supabase Storage.

 ## 2. Preciso de saber:

1. **Que campos devolve o modelo?**
   - Ângulo de Cobb? (graus, float)
   - Classificação da curvatura? (`LEVE` / `MODERADA` / `GRAVE`?)
   - Vértebras detetadas? (formato? lista de coordenadas? labels?)
   - Confiança? (0.0 a 1.0?)
   - Outra coisa específica do modelo?

2. **Há uma imagem de overlay** (radiografia com vértebras / linhas desenhadas por cima)?
   - Se sim, em que formato vos é mais simples devolver? (PNG base64? URL temporária? bytes raw?)

4. **Tempo médio que o modelo demora a processar por imagem?
 