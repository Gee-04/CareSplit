import nodemailer from "nodemailer";

// In production, configure real SMTP. In dev, logs to console.
function getTransporter() {
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  // Dev: use Ethereal test account or just log
  return null;
}

export async function sendOTPEmail(
  to: string,
  otp: string,
  type: "verification" | "login" | "payment" = "verification"
): Promise<void> {
  const subjects = {
    verification: "Verify your Family Support Wallet account",
    login: "Your Family Support Wallet login code",
    payment: "Confirm your payment - Family Support Wallet",
  };

  const contexts = {
    verification: "verify your account",
    login: "confirm your login",
    payment: "authorise this payment",
  };

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #f5f5f5; border-radius: 12px;">
      <div style="margin-bottom: 32px;">
        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
          <span style="color: white; font-size: 24px;">₿</span>
        </div>
        <h1 style="font-size: 20px; font-weight: 600; color: #f5f5f5; margin: 0 0 8px;">Family Support Wallet</h1>
      </div>
      
      <p style="color: #a3a3a3; margin: 0 0 24px; line-height: 1.6;">
        Use this code to ${contexts[type]}. It expires in ${type === "payment" ? "5" : "10"} minutes.
      </p>
      
      <div style="background: #171717; border: 1px solid #262626; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #10b981; font-family: 'Courier New', monospace;">${otp}</span>
      </div>
      
      <p style="color: #737373; font-size: 13px; margin: 0; line-height: 1.6;">
        If you didn't request this code, you can safely ignore this email. Someone may have typed your address by mistake.
      </p>
    </div>
  `;

  const transporter = getTransporter();

  if (transporter) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@familysupportwallet.com",
      to,
      subject: subjects[type],
      html,
    });
  } else {
    // Dev mode: log to console
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 OTP EMAIL (dev mode)`);
    console.log(`   To: ${to}`);
    console.log(`   Type: ${type}`);
    console.log(`   Code: ${otp}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
}

export async function sendOTPSMS(
  to: string,
  otp: string,
  type: "verification" | "login" | "payment" = "login"
): Promise<void> {
  // In production, integrate Twilio / Africa's Talking / etc.
  // For now, log to console
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📱 OTP SMS (dev mode)`);
  console.log(`   To: ${to}`);
  console.log(`   Type: ${type}`);
  console.log(`   Code: ${otp}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}
