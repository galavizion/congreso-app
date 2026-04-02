import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { message, congress_id, user_points = 0 } = await req.json();

    if (!message || !congress_id) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    // Crear cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Consultar datos del congreso en paralelo
    const [congressResult, schedulesResult, standsResult, giftsResult] =
      await Promise.all([
        supabase.from("congresses").select("*").eq("id", congress_id).single(),
        supabase
          .from("schedules")
          .select("*")
          .eq("congress_id", congress_id)
          .order("date", { ascending: true })
          .order("time", { ascending: true }),
        supabase
          .from("stands")
          .select("*")
          .eq("congress_id", congress_id)
          .order("name", { ascending: true }),
        supabase
          .from("gifts")
          .select("*")
          .eq("congress_id", congress_id)
          .order("points_cost", { ascending: true }),
      ]);

    const congress = congressResult.data;
    const schedules = schedulesResult.data || [];
    const stands = standsResult.data || [];
    const gifts = giftsResult.data || [];

    if (!congress) {
      return NextResponse.json(
        { error: "Congreso no encontrado" },
        { status: 404 }
      );
    }

    // Obtener fecha y hora actual en zona horaria de México
    const now = new Date();
    const mexicoTime = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    // Clasificar horarios por estado temporal
    const schedulesWithStatus = schedules.map(s => {
      const scheduleDateTime = new Date(`${s.date}T${s.time}`);
      const currentDateTime = new Date();
      
      let status = 'futuro';
      if (scheduleDateTime < currentDateTime) {
        status = 'pasado';
      } else if (scheduleDateTime.toDateString() === currentDateTime.toDateString()) {
        const scheduleMins = scheduleDateTime.getHours() * 60 + scheduleDateTime.getMinutes();
        const currentMins = currentDateTime.getHours() * 60 + currentDateTime.getMinutes();
        if (Math.abs(scheduleMins - currentMins) <= 60) {
          status = 'en_curso';
        }
      }
      
      return { ...s, status };
    });

    const pastSchedules = schedulesWithStatus.filter(s => s.status === 'pasado');
    const currentSchedules = schedulesWithStatus.filter(s => s.status === 'en_curso');
    const futureSchedules = schedulesWithStatus.filter(s => s.status === 'futuro');

    // Formatear datos para el contexto del bot
    const currentSchedulesText = currentSchedules.length > 0
      ? currentSchedules.map(s => `- 🔴 EN VIVO AHORA: "${s.title}" en ${s.location}`).join("\n")
      : "";

    const futureSchedulesText = futureSchedules.length > 0
      ? futureSchedules.map(s => `- ${s.date} a las ${s.time}: "${s.title}" en ${s.location}`).join("\n")
      : "";

    const pastSchedulesText = pastSchedules.length > 0
      ? pastSchedules.map(s => `- ✅ YA PASÓ: "${s.title}" fue el ${s.date} a las ${s.time} en ${s.location}`).join("\n")
      : "";

    const schedulesText = 
      (currentSchedulesText ? currentSchedulesText + "\n\n" : "") +
      (futureSchedulesText ? "PRÓXIMOS EVENTOS:\n" + futureSchedulesText : "No hay horarios futuros.") +
      (pastSchedulesText ? "\n\nEVENTOS PASADOS:\n" + pastSchedulesText : "");

    const standsText =
      stands.length > 0
        ? stands
            .map((s) => `- ${s.name}: ${s.description || "Sin descripción"}`)
            .join("\n")
        : "No hay stands registrados aún.";

    const giftsText =
      gifts.length > 0
        ? gifts
            .map((g) => {
              const canRedeem = user_points >= g.points_cost;
              const stockInfo = g.stock !== null ? ` - Stock: ${g.stock}` : "";
              const redeemStatus = canRedeem ? " ✅ Puedes canjearlo" : " ⏳ Necesitas más puntos";
              return `- ${g.name} (${g.points_cost} puntos)${stockInfo}${redeemStatus}`;
            })
            .join("\n")
        : "No hay regalos disponibles aún.";

    // Llamar a GPT-4o mini
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres el asistente virtual del congreso "${congress.name}".

FECHA Y HORA ACTUAL: ${mexicoTime} (Ciudad de México)

El usuario tiene actualmente ${user_points} puntos acumulados.

Tu trabajo es ayudar a los asistentes a encontrar información sobre:
- Horarios de actividades (pasadas, en curso y futuras)
- Ubicación y descripción de stands
- Regalos canjeables y puntos necesarios
- Información general del evento

HORARIOS PROGRAMADOS:
${schedulesText}

STANDS PARTICIPANTES:
${standsText}

REGALOS DISPONIBLES:
${giftsText}

INSTRUCCIONES IMPORTANTES:
- Responde de forma breve, amigable y directa en español
- Si preguntan por stands, da su nombre y descripción

INSTRUCCIONES PARA HORARIOS:
- Si preguntan por un evento específico (por doctor, tema, etc.), busca en TODOS los horarios (pasados, en curso y futuros)
- Si el evento YA PASÓ (marcado con ✅), dile claramente: "La ponencia de [nombre] fue el [fecha] a las [hora] en [ubicación]"
- Si el evento ESTÁ EN CURSO (marcado con 🔴), dile: "¡La ponencia de [nombre] está sucediendo AHORA en [ubicación]!"
- Si el evento es FUTURO, dile: "La ponencia de [nombre] será el [fecha] a las [hora] en [ubicación]"
- Si preguntan "¿qué hay hoy?" o "¿qué hay ahora?", prioriza eventos en curso y próximos del día actual

INSTRUCCIONES PARA REGALOS:
- Cuando pregunten por regalos, primero menciona cuáles PUEDE canjear YA (los que tienen ✅)
- Si NO puede canjear ninguno aún, dile: "Aún no tienes suficientes puntos para canjear regalos. Te animamos a escanear más stands y asistir a ponencias para ganar puntos. Los regalos disponibles son: [lista con puntos necesarios]"
- Si PUEDE canjear algunos, dile: "Con tus ${user_points} puntos puedes canjear: [lista solo los que tienen ✅]. También hay otros regalos que podrás desbloquear ganando más puntos: [lista los que tienen ⏳]"
- Motívalo a ganar más puntos escaneando stands (10 puntos por stand)

- Si no sabes algo o no está en la información, sugiere que contacten al organizador
- NO inventes información que no esté en los datos proporcionados
- Usa emojis ocasionalmente para ser más amigable (📅 🏢 🎁 🔥 ⏰)`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const botResponse = completion.choices[0].message.content;

    return NextResponse.json({
      response: botResponse,
      usage: completion.usage, // Para tracking de costos (opcional)
    });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}