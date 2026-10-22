
import nodemailer from 'nodemailer';
import 'dotenv/config';

const { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE } = process.env;
const SHOP_NAME = process.env.SHOP_NAME || 'Shop';

const isConfigured = Boolean(EMAIL_USER && EMAIL_PASS);

function createTransporter() {
  const auth = { user: EMAIL_USER, pass: EMAIL_PASS };

  if (EMAIL_HOST) {
    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT) || 587,
      secure: EMAIL_SECURE === 'true', 
      auth,
    });
  }
  return nodemailer.createTransport({ service: 'gmail', auth });
}

const transporter = isConfigured ? createTransporter() : null;

if (!isConfigured) {
  console.log('[EMAIL] EMAIL_USER / EMAIL_PASS are not set in backend/.env, so emails are turned off.');
}


function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const money = (amount) => `Rs. ${Number(amount).toLocaleString('en-US')}`;

const PAYMENT_LABELS = {
  cod: 'Cash on delivery',
  card: 'Card',
  bank_transfer: 'Bank transfer',
};

function layout(title, bodyHtml) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f5f7;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:10px;padding:28px;border-top:4px solid #0b8a6f">
      <h2 style="margin:0 0 16px;color:#12262b">${escapeHtml(title)}</h2>
      ${bodyHtml}
      <p style="color:#888;font-size:12px;margin-top:28px">This email was sent by ${escapeHtml(SHOP_NAME)}.</p>
    </div>
  </div>`;
}

async function send({ to, subject, html, text }) {
  if (!transporter) return false; 

  try {
    await transporter.sendMail({
      from: `"${SHOP_NAME.replace(/"/g, '')}" <${EMAIL_USER}>`,
      to,
      subject,
      html,
      text, 
    });
    return true;
  } catch (err) {
    console.error(`[EMAIL] Could not send "${subject}" to ${to}:`, err.message);
    return false;
  }
}


export function sendWelcomeEmail(user) {
  const html = layout(
    `Welcome, ${user.name}!`,
    `<p style="color:#333;line-height:1.6">Your account has been created. You can now log in, save your addresses and see all of your orders.</p>
     <p style="color:#333;line-height:1.6">Happy shopping!</p>`
  );
  const text = `Welcome, ${user.name}!\n\nYour account has been created. You can now log in, save your addresses and see all of your orders.\n\nHappy shopping!\n${SHOP_NAME}`;

  return send({ to: user.email, subject: `Welcome to ${SHOP_NAME}`, html, text });
}


export function sendOrderConfirmation(order) {
  const a = order.address;
  const addressLine = `${a.address_line}, ${a.city}, ${a.state}, ${a.country} ${a.postal_code}`;
  const payment = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod;

  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(item.name)} × ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${money(Number(item.price) * item.quantity)}</td>
      </tr>`
    )
    .join('');

  const html = layout(
    `Thank you for your order, ${order.name}!`,
    `<p style="color:#333">Your order number is <strong>#${order.orderId}</strong>.</p>
     <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333">${rows}
       <tr>
         <td style="padding:12px 0;font-weight:bold">Total</td>
         <td style="padding:12px 0;font-weight:bold;text-align:right">${money(order.total)}</td>
       </tr>
     </table>
     <p style="color:#333;font-size:14px"><strong>Delivery address:</strong><br>${escapeHtml(addressLine)}</p>
     <p style="color:#333;font-size:14px"><strong>Payment method:</strong> ${escapeHtml(payment)}</p>
     <p style="color:#666;font-size:13px">Please keep your order number if you need to ask about your order.</p>`
  );

  const lines = order.items.map(
    (item) => `- ${item.name} x ${item.quantity}: ${money(Number(item.price) * item.quantity)}`
  );
  const text = [
    `Thank you for your order, ${order.name}!`,
    `Order number: #${order.orderId}`,
    '',
    ...lines,
    `Total: ${money(order.total)}`,
    '',
    `Delivery address: ${addressLine}`,
    `Payment method: ${payment}`,
  ].join('\n');

  return send({
    to: order.to,
    subject: `Your ${SHOP_NAME} order #${order.orderId} is confirmed`,
    html,
    text,
  });
}
