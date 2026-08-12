/**
 * Email stub. In production swap this for nodemailer / Resend / SES.
 * Everything the salon would email is logged so the flow is visible in dev.
 */
export async function sendMail({ to, subject, text }) {
  console.log('\n--- MAIL (dev stub) -------------------------');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(text);
  console.log('---------------------------------------------\n');
}
