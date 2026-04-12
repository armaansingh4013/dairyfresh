import crypto from "crypto";
import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend_key = process.env.RESEND_API_KEY;

const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 5);

function getMailerConfig() {
    const user = process.env.GMAIL_USER?.trim();
    const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  
    console.log("GMAIL_USER loaded:", user);
    console.log("GMAIL_APP_PASSWORD exists:", Boolean(pass));
  
    if (!user) {
      throw new Error("Missing GMAIL_USER in environment");
    }
  
    if (!pass) {
      throw new Error("Missing GMAIL_APP_PASSWORD in environment");
    }
  
    return { user, pass };
  }
  
  function getTransporter() {
    const { user, pass } = getMailerConfig();
  
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user,
        pass
      }
    });
  }

export function generateOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(crypto.randomInt(min, max + 1));
}

export function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

export function getOtpExpiryDate() {
  return new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
}

export async function sendOtpEmail({ to, otp, name }) {
    console.log("Preparing to send OTP email", { to, otp, name });
    
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Missing Gmail SMTP env variables");
  }

  const safeName = name?.trim() || "there";
  const resend = new Resend(resend_key);
  console.log(`Sending OTP email to ${to} with OTP ${otp}`);
  try {
    const response = await resend.emails.send({
      from: "Mazara Dairy <no-reply@majara.in>", // your verified domain
      to,
        subject: "Your OTP code",
        text: `Hi ${safeName}, your OTP is ${otp}. It expires in ${OTP_EXPIRES_MINUTES} minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Your OTP Code</h2>
            <p>Hi ${safeName},</p>
            <p>Your OTP is:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 16px 0;">
              ${otp}
            </div>
            <p>This OTP will expire in ${OTP_EXPIRES_MINUTES} minutes.</p>
            <p>If you did not request this, you can ignore this email.</p>
          </div>
        `
    });

    console.log("Email sent:", response);
    return response;
  } catch (err) {
    console.error("Error:", err);
    return null;
  }
  // const transporter = getTransporter();
  // const safeName = name?.trim() || "there";

  // const info = await transporter.sendMail({
  //   from: `"Dairy App" <${process.env.GMAIL_USER}>`,
  //   to,
  //   subject: "Your OTP code",
  //   text: `Hi ${safeName}, your OTP is ${otp}. It expires in ${OTP_EXPIRES_MINUTES} minutes.`,
  //   html: `
  //     <div style="font-family: Arial, sans-serif; line-height: 1.5;">
  //       <h2>Your OTP Code</h2>
  //       <p>Hi ${safeName},</p>
  //       <p>Your OTP is:</p>
  //       <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 16px 0;">
  //         ${otp}
  //       </div>
  //       <p>This OTP will expire in ${OTP_EXPIRES_MINUTES} minutes.</p>
  //       <p>If you did not request this, you can ignore this email.</p>
  //     </div>
  //   `
  // });

  // return {
  //   messageId: info.messageId,
  //   accepted: info.accepted
  // };
}

export function verifyOtp({
  plainOtp,
  hashedOtp,
  expiresAt
}) {
  if (!plainOtp || !hashedOtp || !expiresAt) {
    return { ok: false, reason: "Missing OTP data" };
  }

  if (new Date(expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "OTP expired" };
  }

  const incomingHash = hashOtp(plainOtp);

  if (incomingHash !== hashedOtp) {
    return { ok: false, reason: "Invalid OTP" };
  }

  return { ok: true };
}