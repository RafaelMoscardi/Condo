import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function enviarEmailResetSenha(email: string, token: string) {
  const url = `${process.env.NEXTAUTH_URL}/redefinir-senha?token=${token}`;

  await transporter.sendMail({
    from: `"Condomínio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Redefinição de senha",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#1e293b;margin-bottom:8px">Redefinição de senha</h2>
        <p style="color:#64748b;margin-bottom:24px">Você solicitou a redefinição da sua senha. Clique no botão abaixo para criar uma nova senha:</p>
        <a href="${url}" style="display:inline-block;background:#4f46e5;color:white;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">
          Redefinir senha
        </a>
        <p style="color:#94a3b8;font-size:13px;margin-top:24px">Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição, ignore este email.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="color:#94a3b8;font-size:12px">Caso o botão não funcione, copie e cole o link abaixo no navegador:</p>
        <p style="color:#6366f1;font-size:12px;word-break:break-all">${url}</p>
      </div>
    `,
  });
}
