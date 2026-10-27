export interface ConsentEmailTemplateProps {
  referralCode: string;
  clientName: string;
  clientEmail: string;
  brokerName: string;
  brokerPhone?: string;
  brokerCreci?: string;
  developmentName: string;
  developerName?: string;
  city?: string;
  protectionExpiresAt?: string;
  customMessage?: string;
  viewUrl?: string;
}

export function generateConsentTermEmailHtml(props: ConsentEmailTemplateProps): string {
  const {
    referralCode,
    clientName,
    brokerName,
    brokerPhone,
    brokerCreci,
    developmentName,
    developerName = 'Incorporadora Parceira LINNK',
    city = 'Bahia',
    protectionExpiresAt = '6 meses a partir da emissão',
    customMessage,
    viewUrl,
  } = props;

  const currentYear = new Date().getFullYear();
  const ctaLink = viewUrl || '#';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Termo de Consentimento - LINNK</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f2ee;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a1615;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    .wrapper {
      max-width: 620px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e5e0d8;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #080605;
      padding: 36px 32px 30px;
      text-align: center;
      border-bottom: 3px solid #f95721;
    }
    .logo-container {
      margin-bottom: 12px;
    }
    .logo-badge {
      display: inline-block;
      padding: 4px 14px;
      background-color: #1a1615;
      border: 1px solid #332d29;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #f95721;
    }
    .header-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 12px 0 4px;
      letter-spacing: -0.3px;
    }
    .header-sub {
      color: #a8a29e;
      font-size: 13px;
      margin: 0;
    }
    .protocol-pill {
      display: inline-block;
      margin-top: 14px;
      padding: 6px 14px;
      background: rgba(249, 87, 33, 0.12);
      border: 1px solid rgba(249, 87, 33, 0.35);
      border-radius: 8px;
      color: #f95721;
      font-family: monospace;
      font-size: 13px;
      font-weight: bold;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #1a1615;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .text-body {
      font-size: 14px;
      line-height: 1.65;
      color: #44403c;
      margin-bottom: 18px;
    }
    .highlight-box {
      background-color: #faf9f6;
      border-left: 4px solid #f95721;
      border-radius: 0 10px 10px 0;
      padding: 16px 20px;
      margin: 22px 0;
    }
    .highlight-title {
      font-size: 13px;
      font-weight: 700;
      color: #1a1615;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .highlight-text {
      font-size: 13px;
      line-height: 1.55;
      color: #57534e;
      margin: 0;
    }
    .custom-message-box {
      background-color: #fff7ed;
      border: 1px dashed #fdba74;
      border-radius: 10px;
      padding: 14px 18px;
      margin: 20px 0;
      font-style: italic;
      color: #9a3412;
      font-size: 13px;
      line-height: 1.5;
    }
    .data-table {
      margin: 24px 0;
      border: 1px solid #e7e5e4;
      border-radius: 10px;
      overflow: hidden;
    }
    .data-row {
      border-bottom: 1px solid #f0eeeb;
    }
    .data-row:last-child {
      border-bottom: none;
    }
    .data-label {
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 600;
      color: #78716c;
      width: 38%;
      background-color: #faf9f6;
    }
    .data-value {
      padding: 10px 14px;
      font-size: 13px;
      color: #1a1615;
      font-weight: 500;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 20px;
    }
    .cta-button {
      display: inline-block;
      background-color: #f95721;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 32px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(249, 87, 33, 0.25);
    }
    .notice {
      font-size: 12px;
      line-height: 1.5;
      color: #78716c;
      background-color: #f5f5f4;
      padding: 14px 18px;
      border-radius: 8px;
      margin-top: 24px;
    }
    .footer {
      background-color: #f7f6f4;
      border-top: 1px solid #e7e5e4;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #a8a29e;
      line-height: 1.6;
    }
    .footer strong {
      color: #78716c;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- CABEÇALHO -->
    <div class="header">
      <div class="logo-container">
        <span class="logo-badge">LINNK · ECOSSISTEMA IMOBILIÁRIO</span>
      </div>
      <h1 class="header-title">Termo de Consentimento & Atendimento</h1>
      <p class="header-sub">Conformidade LGPD & Governança de Parcerias Comerciais</p>
      <div>
        <span class="protocol-pill">PROTOCOLO: ${referralCode}</span>
      </div>
    </div>

    <!-- CONTEÚDO -->
    <div class="content">
      <p class="greeting">Olá, ${clientName}!</p>
      
      <p class="text-body">
        O corretor parceiro credenciado <strong>${brokerName}</strong>${brokerCreci ? ` (CRECI: ${brokerCreci})` : ''} cadastrou sua indicação de interesse oficial para atendimento e condições comerciais no empreendimento <strong>${developmentName}</strong>.
      </p>

      ${customMessage ? `
      <div class="custom-message-box">
        <strong>Mensagem do Corretor / Atendimento:</strong><br>
        "${customMessage}"
      </div>
      ` : ''}

      <!-- RESUMO DA INDICAÇÃO -->
      <table class="data-table">
        <tr class="data-row">
          <td class="data-label">Protocolo Oficial</td>
          <td class="data-value"><strong>${referralCode}</strong></td>
        </tr>
        <tr class="data-row">
          <td class="data-label">Empreendimento</td>
          <td class="data-value"><strong>${developmentName}</strong> (${city})</td>
        </tr>
        <tr class="data-row">
          <td class="data-label">Incorporadora / Desenvolvedor</td>
          <td class="data-value">${developerName}</td>
        </tr>
        <tr class="data-row">
          <td class="data-label">Corretor Credenciado</td>
          <td class="data-value">${brokerName} ${brokerPhone ? `· ${brokerPhone}` : ''}</td>
        </tr>
        <tr class="data-row">
          <td class="data-label">Validade da Garantia</td>
          <td class="data-value">${protectionExpiresAt}</td>
        </tr>
      </table>

      <!-- DESTAQUE LGPD -->
      <div class="highlight-box">
        <div class="highlight-title">Proteção de Dados & Privacidade (LGPD)</div>
        <p class="highlight-text">
          Seus dados de contato estão resguardados sob a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados). O registro assegura que você terá um atendimento qualificado e transparente, sem abordagens indevidas ou contatos duplicados por múltiplos intermediários.
        </p>
      </div>

      <p class="text-body">
        Caso queira visualizar o instrumento particular formal e a íntegra das disposições comerciais e de privacidade da sua indicação, acesse o botão abaixo:
      </p>

      <!-- BOTÃO DE AÇÃO -->
      <div class="cta-container">
        <a href="${ctaLink}" class="cta-button" target="_blank">
          Visualizar Termo de Consentimento Completo
        </a>
      </div>

      <div class="notice">
        <strong>Informação de Segurança:</strong> Caso você não reconheça esta indicação ou deseje revogar seu consentimento a qualquer momento, basta responder a este e-mail informando o número do protocolo para que seus dados sejam desvinculados do atendimento.
      </div>
    </div>

    <!-- RODAPÉ -->
    <div class="footer">
      <strong>LINNK Curadoria Imobiliária & Governança Comercial</strong><br>
      Regional Sul da Bahia · Ilhéus · Itabuna · Litoral Sul<br>
      © ${currentYear} LINNK. Todos os direitos reservados.
    </div>
  </div>
</body>
</html>`;
}
