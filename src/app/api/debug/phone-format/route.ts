// app/api/debug/phone-format/route.ts
export async function POST(request: Request) {
  const { phoneNumber } = await request.json();
  
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  const e164 = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  const whatsapp = `whatsapp:${e164}`;
  
  return Response.json({
    original: phoneNumber,
    cleaned,
    e164,
    whatsapp,
    isValid: /^whatsapp:\+\d{10,15}$/.test(whatsapp),
  });
}
