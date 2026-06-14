// Supabase Edge Function: send-booking-email
// Déployer: npx supabase functions deploy send-booking-email
// Secret requis: RESEND_API_KEY (dans Supabase Dashboard → Edge Functions → Secrets)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL     = 'Anny Williams <noreply@annywilliams.com>'
const ANNY_EMAIL     = 'annywilliamscoach@gmail.com'
const ANNY_PHONE     = '450-899-2529'

interface BookingEmailPayload {
  type: 'new_booking' | 'confirmed'
  booking: {
    guest_name:   string
    guest_email:  string
    guest_phone?: string
    service_name: string
    message?:     string
    slot_date:    string
    start_time:   string
    end_time:     string
  }
}

function formatDate(d: string): string {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

function formatTime(t: string): string {
  return t.substring(0, 5)
}

// ── Email HTML client: nouvelle demande ──────────────────────
function newBookingEmailHtml(b: BookingEmailPayload['booking']): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; background: #f5f0e8; margin: 0; padding: 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    .header { background: #1a0a06; padding: 32px 40px; }
    .header h1 { font-family: Georgia, serif; color: #fff; font-size: 22px; margin: 0 0 4px; font-weight: 400; }
    .header p  { color: rgba(255,255,255,.55); font-size: 13px; margin: 0; font-family: Arial, sans-serif; }
    .accent { color: #c8102e; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 17px; color: #1a0a06; margin-bottom: 20px; }
    .info-box { background: #f5f0e8; border-radius: 8px; border-left: 4px solid #c8102e; padding: 18px 20px; margin: 20px 0; }
    .info-row { display: flex; gap: 12px; margin-bottom: 10px; font-size: 14px; font-family: Arial, sans-serif; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #9e8878; min-width: 90px; font-weight: bold; }
    .info-value { color: #1a0a06; }
    .policy { background: #fff8f5; border: 1px solid #f0d0c0; border-radius: 8px; padding: 16px 20px; margin: 24px 0; font-size: 13px; font-family: Arial, sans-serif; color: #6b5a4e; line-height: 1.6; }
    .policy strong { color: #c8102e; }
    .footer { background: #f5f0e8; padding: 24px 40px; text-align: center; font-family: Arial, sans-serif; font-size: 12px; color: #9e8878; }
    .footer a { color: #c8102e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Anny <span class="accent">Williams</span></h1>
      <p>Coach en développement personnel &amp; Intervenante en langage</p>
    </div>
    <div class="body">
      <p class="greeting">Bonjour <strong>${b.guest_name}</strong>,</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#3d2b1f;line-height:1.7;">
        Votre demande de rendez-vous a bien été reçue. Anny vous contactera dans les <strong>24 heures</strong> pour confirmer votre consultation.
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">📅 Date</span><span class="info-value">${formatDate(b.slot_date)}</span></div>
        <div class="info-row"><span class="info-label">🕐 Heure</span><span class="info-value">${formatTime(b.start_time)} – ${formatTime(b.end_time)}</span></div>
        <div class="info-row"><span class="info-label">🌿 Service</span><span class="info-value">${b.service_name}</span></div>
        ${b.message ? `<div class="info-row"><span class="info-label">💬 Message</span><span class="info-value">${b.message}</span></div>` : ''}
      </div>

      <div class="policy">
        <strong>Politique d'annulation :</strong> Toute annulation doit être effectuée au moins <strong>24 heures avant</strong> le rendez-vous. Passé ce délai, des frais de <strong>30 $</strong> seront applicables.<br><br>
        Pour annuler ou modifier votre rendez-vous, contactez Anny :<br>
        📧 <a href="mailto:${ANNY_EMAIL}">${ANNY_EMAIL}</a> &nbsp;|&nbsp; 📞 <a href="tel:${ANNY_PHONE.replace(/-/g, '')}">${ANNY_PHONE}</a>
      </div>

      <p style="font-family:Arial,sans-serif;font-size:14px;color:#3d2b1f;line-height:1.7;">
        Au plaisir de vous accompagner,<br>
        <strong>Anny Williams</strong>
      </p>
    </div>
    <div class="footer">
      Région Sorel-Tracy &nbsp;·&nbsp; <a href="mailto:${ANNY_EMAIL}">${ANNY_EMAIL}</a> &nbsp;·&nbsp; ${ANNY_PHONE}
    </div>
  </div>
</body>
</html>`
}

// ── Email HTML client: rendez-vous confirmé ──────────────────
function confirmedBookingEmailHtml(b: BookingEmailPayload['booking']): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; background: #f5f0e8; margin: 0; padding: 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    .header { background: #1a0a06; padding: 32px 40px; }
    .header h1 { font-family: Georgia, serif; color: #fff; font-size: 22px; margin: 0 0 4px; font-weight: 400; }
    .header p  { color: rgba(255,255,255,.55); font-size: 13px; margin: 0; font-family: Arial, sans-serif; }
    .accent { color: #c8102e; }
    .confirmed-badge { background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 8px; padding: 14px 20px; text-align: center; margin-bottom: 24px; font-family: Arial, sans-serif; font-size: 15px; color: #2e7d32; font-weight: bold; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 17px; color: #1a0a06; margin-bottom: 20px; }
    .info-box { background: #f5f0e8; border-radius: 8px; border-left: 4px solid #2e7d32; padding: 18px 20px; margin: 20px 0; }
    .info-row { display: flex; gap: 12px; margin-bottom: 10px; font-size: 14px; font-family: Arial, sans-serif; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #9e8878; min-width: 90px; font-weight: bold; }
    .info-value { color: #1a0a06; }
    .policy { background: #fff8f5; border: 1px solid #f0d0c0; border-radius: 8px; padding: 16px 20px; margin: 24px 0; font-size: 13px; font-family: Arial, sans-serif; color: #6b5a4e; line-height: 1.6; }
    .policy strong { color: #c8102e; }
    .footer { background: #f5f0e8; padding: 24px 40px; text-align: center; font-family: Arial, sans-serif; font-size: 12px; color: #9e8878; }
    .footer a { color: #c8102e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Anny <span class="accent">Williams</span></h1>
      <p>Coach en développement personnel &amp; Intervenante en langage</p>
    </div>
    <div class="body">
      <div class="confirmed-badge">✅ Rendez-vous confirmé !</div>

      <p class="greeting">Bonjour <strong>${b.guest_name}</strong>,</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#3d2b1f;line-height:1.7;">
        Votre rendez-vous est <strong>officiellement confirmé</strong>. Nous avons hâte de vous rencontrer !
      </p>

      <div class="info-box">
        <div class="info-row"><span class="info-label">📅 Date</span><span class="info-value">${formatDate(b.slot_date)}</span></div>
        <div class="info-row"><span class="info-label">🕐 Heure</span><span class="info-value">${formatTime(b.start_time)} – ${formatTime(b.end_time)}</span></div>
        <div class="info-row"><span class="info-label">🌿 Service</span><span class="info-value">${b.service_name}</span></div>
      </div>

      <div class="policy">
        <strong>Pour annuler votre rendez-vous</strong>, veuillez nous contacter au moins <strong>24 heures à l'avance</strong>. Passé ce délai, des frais de <strong>30 $</strong> seront applicables.<br><br>
        📧 <a href="mailto:${ANNY_EMAIL}">${ANNY_EMAIL}</a> &nbsp;|&nbsp; 📞 <a href="tel:${ANNY_PHONE.replace(/-/g, '')}">${ANNY_PHONE}</a>
      </div>

      <p style="font-family:Arial,sans-serif;font-size:14px;color:#3d2b1f;line-height:1.7;">
        Au plaisir de vous accueillir,<br>
        <strong>Anny Williams</strong>
      </p>
    </div>
    <div class="footer">
      Région Sorel-Tracy &nbsp;·&nbsp; <a href="mailto:${ANNY_EMAIL}">${ANNY_EMAIL}</a> &nbsp;·&nbsp; ${ANNY_PHONE}
    </div>
  </div>
</body>
</html>`
}

// ── Notification à Anny (nouvelle réservation) ───────────────
function newBookingNotifHtml(b: BookingEmailPayload['booking']): string {
  return `
<h2>Nouvelle demande de rendez-vous</h2>
<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse;">
  <tr><td style="padding:6px 12px;color:#666;"><b>Client</b></td><td style="padding:6px 12px;">${b.guest_name}</td></tr>
  <tr><td style="padding:6px 12px;color:#666;"><b>Courriel</b></td><td style="padding:6px 12px;"><a href="mailto:${b.guest_email}">${b.guest_email}</a></td></tr>
  ${b.guest_phone ? `<tr><td style="padding:6px 12px;color:#666;"><b>Téléphone</b></td><td style="padding:6px 12px;"><a href="tel:${b.guest_phone}">${b.guest_phone}</a></td></tr>` : ''}
  <tr><td style="padding:6px 12px;color:#666;"><b>Date</b></td><td style="padding:6px 12px;">${formatDate(b.slot_date)} ${formatTime(b.start_time)}–${formatTime(b.end_time)}</td></tr>
  <tr><td style="padding:6px 12px;color:#666;"><b>Service</b></td><td style="padding:6px 12px;">${b.service_name}</td></tr>
  ${b.message ? `<tr><td style="padding:6px 12px;color:#666;"><b>Message</b></td><td style="padding:6px 12px;">${b.message}</td></tr>` : ''}
</table>
<p style="margin-top:20px;"><a href="https://annywilliams.com/admin" style="background:#c8102e;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;">Confirmer dans l'admin →</a></p>`
}

// ── Handler principal ────────────────────────────────────────
serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const payload: BookingEmailPayload = await req.json()
    const { type, booking: b } = payload

    const isNew       = type === 'new_booking'
    const clientSubj  = isNew
      ? `✅ Demande reçue — ${b.service_name} le ${formatDate(b.slot_date)}`
      : `🎉 Rendez-vous confirmé — ${b.service_name} le ${formatDate(b.slot_date)}`
    const clientHtml  = isNew ? newBookingEmailHtml(b) : confirmedBookingEmailHtml(b)

    const emails = []

    // 1. Email au client
    emails.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [b.guest_email],
        subject: clientSubj,
        html:    clientHtml,
      })
    }))

    // 2. Notification à Anny seulement pour les nouvelles réservations
    if (isNew) {
      emails.push(fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    FROM_EMAIL,
          to:      [ANNY_EMAIL],
          subject: `🔔 Nouveau RDV — ${b.guest_name} — ${formatDate(b.slot_date)} ${formatTime(b.start_time)}`,
          html:    newBookingNotifHtml(b),
        })
      }))
    }

    const results = await Promise.all(emails)
    const ok = results.every(r => r.ok)

    return new Response(JSON.stringify({ success: ok }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: ok ? 200 : 500
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500
    })
  }
})
