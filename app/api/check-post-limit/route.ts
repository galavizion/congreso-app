import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { stand_id } = await req.json();

    if (!stand_id) {
      return NextResponse.json(
        { error: "Falta stand_id" },
        { status: 400 }
      );
    }

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

    // Obtener fecha de hoy en zona horaria de México
    const today = new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(new Date())
      .split("/")
      .reverse()
      .join("-"); // Formato YYYY-MM-DD

    // Contar noticias de hoy
    const { count, error } = await supabase
      .from("news")
      .select("id", { count: "exact", head: true })
      .eq("stand_id", stand_id)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`);

    if (error) {
      console.error("Error al contar noticias:", error);
      return NextResponse.json(
        { error: "Error al verificar límite" },
        { status: 500 }
      );
    }

    const postsToday = count || 0;
    const canPost = postsToday < 3;
    const remaining = Math.max(0, 3 - postsToday);

    return NextResponse.json({
      can_post: canPost,
      posts_today: postsToday,
      remaining: remaining,
      limit: 3,
    });
  } catch (error) {
    console.error("Error en /api/check-post-limit:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}