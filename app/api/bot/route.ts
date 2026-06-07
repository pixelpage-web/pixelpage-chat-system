import { NextRequest, NextResponse } from 'next/server';

const CHATWOOT_URL = 'https://app.chatwoot.com';
const CHATWOOT_ACCOUNT_ID = '168656';
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';

async function getHistory(phone: string) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?phone=eq.${phone}&order=created_at.asc&limit=10`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

async function saveMessage(phone: string, role: string, content: string) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ phone, role, content }),
    });
  } catch { /* silently fail */ }
}

async function getOrCreateUser(phone: string, name: string) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?phone=eq.${encodeURIComponent(phone)}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const users = await res.json();
    if (users.length > 0) return users[0];
    await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ phone, name, trial_start: new Date().toISOString().split('T')[0] }),
    });
    return { phone, name, trial_start: new Date().toISOString().split('T')[0], is_paid: false };
  } catch { return { phone, name, trial_start: new Date().toISOString().split('T')[0], is_paid: false }; }
}

function isTrialExpired(user: { trial_start: string; is_paid: boolean }) {
  if (user.is_paid) return false;
  const start = new Date(user.trial_start);
  const now = new Date();
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return days >= 7;
}

async function getMemories(phone: string) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/memories?phone=eq.${encodeURIComponent(phone)}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

async function callClaude(messages: { role: string; content: string }[], systemPrompt: string) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || 'Desculpe, nao consegui processar sua mensagem.';
  } catch { return 'Estou com dificuldades tecnicas. Tente novamente em instantes.'; }
}

async function sendToChatwoot(conversationId: number, message: string) {
  try {
    await fetch(
      `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          api_access_token: CHATWOOT_API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          message_type: 'outgoing',
          private: false,
        }),
      }
    );
  } catch (e) { console.error('Erro ao enviar para Chatwoot:', e); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Zari] Evento:', body.event, '| Tipo:', body.message_type);

    if (body.event !== 'message_created') return NextResponse.json({ ok: true });
    if (body.message_type !== 'incoming') return NextResponse.json({ ok: true });
    if (!body.content) return NextResponse.json({ ok: true });

    const conversationId = body.conversation?.id;
    const phone = body.sender?.phone_number || body.sender?.identifier || 'unknown';
    const name = body.sender?.name || 'Usuario';
    const userMessage = body.content;

    if (!conversationId) return NextResponse.json({ ok: true });

    const user = await getOrCreateUser(phone, name);

    if (isTrialExpired(user)) {
      await sendToChatwoot(conversationId,
        'Ola! Seu periodo gratuito de 7 dias acabou.\n\nPara continuar usando o Zari por apenas R$19,90/mes, entre em contato respondendo PAGAR.'
      );
      return NextResponse.json({ ok: true });
    }

    const history = await getHistory(phone);
    const memories = await getMemories(phone);

    const memoriesText = memories.length > 0
      ? '\n\nInformacoes que voce me contou:\n' + memories.map((m: { key: string; value: string }) => `- ${m.key}: ${m.value}`).join('\n')
      : '';

    const systemPrompt = `Voce e o Zari, assistente pessoal inteligente no WhatsApp da PixelPage.
Responda sempre em portugues brasileiro, de forma amigavel e direta.
Use emojis com moderacao para tornar as mensagens mais agradaveis.

Usuario: ${name}${memoriesText}

Voce pode:
- Guardar lembretes e informacoes importantes
- Responder perguntas e ajudar com tarefas
- Buscar informacoes quando solicitado
- Contar piadas, dar dicas, motivar

Se o usuario pedir para falar com humano, diga que vai transferir e inclua [HANDOFF] no final da mensagem.
Se o usuario mencionar algo importante sobre ele (aniversario, nome de filho, etc), confirme que guardou.`;

    const messageHistory = history.slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    messageHistory.push({ role: 'user', content: userMessage });

    const response = await callClaude(messageHistory, systemPrompt);

    await saveMessage(phone, 'user', userMessage);
    await saveMessage(phone, 'assistant', response);

    const cleanResponse = response.replace('[HANDOFF]', '').trim();
    await sendToChatwoot(conversationId, cleanResponse);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Zari Bot] Erro:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Zari Bot online', version: '1.0.0' });
}
