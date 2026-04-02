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

    // Formatear datos para el contexto del bot
    const schedulesText =
      schedules.length > 0
        ? schedules
            .map(
              (s) =>
                `- ${s.date} a las ${s.time}: "${s.title}" en ${s.location}`
            )
            .join("\n")
        : "No hay horarios registrados aún.";

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

El usuario tiene actualmente ${user_points} puntos acumulados.

Tu trabajo es ayudar a los asistentes a encontrar información sobre:
- Horarios de actividades
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
- Si preguntan por horarios, menciona fecha, hora y ubicación
- Si preguntan por stands, da su nombre y descripción

INSTRUCCIONES PARA REGALOS:
- Cuando pregunten por regalos, primero menciona cuáles PUEDE canjear YA (los que tienen ✅)
- Si NO puede canjear ninguno aún, dile: "Aún no tienes suficientes puntos para canjear regalos. Te animamos a escanear más stands y asistir a ponencias para ganar puntos. Los regalos disponibles son: [lista con puntos necesarios]"
- Si PUEDE canjear algunos, dile: "Con tus ${user_points} puntos puedes canjear: [lista solo los que tienen ✅]. También hay otros regalos que podrás desbloquear ganando más puntos: [lista los que tienen ⏳]"
- Motívalo a ganar más puntos escaneando stands (10 puntos por stand)

- Si no sabes algo o no está en la información, sugiere que contacten al organizador
- NO inventes información que no esté en los datos proporcionados
- Usa emojis ocasionalmente para ser más amigable (📅 🏢 🎁 🔥)`,
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