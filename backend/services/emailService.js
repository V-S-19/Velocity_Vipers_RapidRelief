const nodemailer = require('nodemailer');

// Configure secure Nodemailer transporter using Google SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for port 465 SSL connection
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Sends a highly styled HTML verification OTP email
 * @param {string} toEmail - Target recipient email address
 * @param {string} otpCode - 6-digit numerical passcode
 */
const sendVerificationEmail = async (toEmail, otpCode) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || `"RapidRelief Command" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: '🚨 Verify Your RapidRelief Responder Portal Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0a09; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; color: #f4f4f5;">
        <!-- Header -->
        <div style="background-color: #dc2626; background-image: linear-gradient(to right, #dc2626, #ea580c); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">RapidRelief Command</h1>
          <p style="color: #fee2e2; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; tracking-widest: 1px; font-weight: bold;">Emergency Network System</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px; line-height: 1.6;">
          <h2 style="color: #ffffff; margin-top: 0; font-size: 18px; font-weight: 700;">Validate Your Portal Access Scope</h2>
          <p style="color: #a1a1aa; font-size: 14px;">You have requested authorization credentials for the RapidRelief Emergency Responder Portal. Please input the security verification code below to activate your account and configure your access key token:</p>
          
          <!-- Code Card -->
          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #f43f5e; margin: 0;">${otpCode}</div>
            <p style="color: #71717a; font-size: 11px; margin: 8px 0 0 0; font-weight: bold; uppercase;">Verification Passcode (Expires in 15 minutes)</p>
          </div>
          
          <p style="color: #a1a1aa; font-size: 13px;">If you did not initiate this credential request, you may safely ignore this email. Other command nodes cannot access your account details without this key.</p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #09090b; padding: 16px 24px; text-align: center; border-t: 1px solid #18181b; font-size: 11px; color: #52525b;">
          Authorized Agency Portal System. Incident reports and access attempts are logged securely.
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Verification code sent to ${toEmail}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[EMAIL SERVICE ERROR] Failed to dispatch verification email: ', error.message);
    // Return false instead of crashing, letting the server handle warnings cleanly
    return false;
  }
};

module.exports = { sendVerificationEmail };
