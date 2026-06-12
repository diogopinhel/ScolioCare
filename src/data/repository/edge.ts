import { supabase } from '../../lib/supabase';

/**
 * Invoca uma Edge Function e normaliza os erros.
 *
 * Em respostas não-2xx o supabase-js devolve um FunctionsHttpError com a
 * mensagem genérica "Edge Function returned a non-2xx status code" e esconde
 * o body por trás de `error.context`. As nossas Edge Functions devolvem
 * sempre `{ erro: string }` com uma mensagem amigável em PT — este helper
 * extrai-a para que os toasts mostrem a mensagem real do servidor.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function invocarEdgeFunction<T>(nome: string, body: Record<string, any>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(nome, { body });

  if (error) {
    let mensagem = error.message;
    const ctx = (error as unknown as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const corpo = await ctx.json();
        if (corpo?.erro) mensagem = corpo.erro as string;
      } catch {
        // body não-JSON — mantém a mensagem genérica do supabase-js
      }
    }
    throw new Error(mensagem);
  }

  if ((data as { erro?: string } | null)?.erro) {
    throw new Error((data as { erro: string }).erro);
  }
  return data as T;
}
