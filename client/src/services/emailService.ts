import { supabase } from '../lib/supabaseClient';
import {
  ConsentEmailTemplateProps,
  generateConsentTermEmailHtml,
} from './consentEmailTemplate';

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
  message?: string;
}

export const EmailService = {
  /**
   * Envia o Termo de Consentimento para o cliente cadastrado na indicação.
   * 
   * Estratégia de envio:
   * 1. Supabase Edge Function ('send-consent-term') caso esteja implantada;
   * 2. Fallback direto via API da Resend (se VITE_RESEND_API_KEY estiver no .env);
   * 3. Fallback seguro em modo simulação caso ainda não haja chave configurada.
   */
  async sendConsentTerm(params: ConsentEmailTemplateProps): Promise<SendEmailResult> {
    const cleanEmail = params.clientEmail?.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return {
        ok: false,
        error: 'O cliente não possui um endereço de e-mail válido cadastrado nesta indicação.',
      };
    }

    const htmlBody = generateConsentTermEmailHtml({
      ...params,
      clientEmail: cleanEmail,
    });

    const emailSubject = `Termo de Consentimento & Proteção de Atendimento — Indicação ${params.referralCode} (${params.developmentName})`;
    const fromAddress =
      import.meta.env.VITE_RESEND_FROM_EMAIL || 'LINNK Imóveis <onboarding@resend.dev>';

    // 1. Tentar invocar Supabase Edge Function (método de produção seguro)
    try {
      const { data, error } = await supabase.functions.invoke('send-consent-term', {
        body: {
          to: cleanEmail,
          subject: emailSubject,
          html: htmlBody,
          referralCode: params.referralCode,
          clientName: params.clientName,
        },
      });

      if (!error && data?.ok) {
        return {
          ok: true,
          messageId: data?.id || data?.messageId,
          message: `E-mail enviado com sucesso para ${cleanEmail} via Resend.`,
        };
      }
    } catch (edgeFnErr) {
      console.warn(
        '[EmailService] Supabase Edge Function indisponível ou não implantada, testando fallback direto:',
        edgeFnErr
      );
    }

    // 2. Fallback: disparo direto via API REST da Resend (se chave estiver no .env)
    const directApiKey = import.meta.env.VITE_RESEND_API_KEY;
    if (directApiKey && directApiKey.startsWith('re_')) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${directApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [cleanEmail],
            subject: emailSubject,
            html: htmlBody,
          }),
        });

        const resData = await response.json();

        if (response.ok && resData?.id) {
          return {
            ok: true,
            messageId: resData.id,
            message: `E-mail enviado com sucesso para ${cleanEmail} via Resend (API Direta).`,
          };
        } else {
          return {
            ok: false,
            error: resData?.message || 'Falha ao disparar e-mail via Resend.',
          };
        }
      } catch (directErr: any) {
        console.error('[EmailService] Erro na chamada direta à Resend:', directErr);
        return {
          ok: false,
          error: directErr?.message || 'Erro de conexão com o serviço Resend.',
        };
      }
    }

    // 3. Fallback de Demonstração (Permite testar a experiência sem travar a interface)
    console.info(
      `[EmailService] MODO SIMULAÇÃO: E-mail preparado para envio para ${cleanEmail} (Protocolo ${params.referralCode}). Nenhuma chave da Resend foi configurada ainda.`
    );

    return {
      ok: true,
      simulated: true,
      messageId: `sim-${Date.now()}`,
      message: `[Simulação] O termo para ${cleanEmail} foi registrado. Para envios reais, adicione sua RESEND_API_KEY no Supabase ou no .env.`,
    };
  },
};
