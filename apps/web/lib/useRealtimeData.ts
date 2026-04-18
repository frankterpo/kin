"use client";

import { useEffect, useState } from "react";
import { supabaseAnon } from "@/lib/supabase";
import type {
  Biomarker,
  Checkin,
  SupporterBrief,
  WhatsAppMsg,
} from "@/lib/fixtures";
import {
  fixtureBiomarkers,
  fixtureBriefs,
  fixtureCheckins,
  fixtureMessages,
} from "@/lib/fixtures";

export type DemoData = {
  checkins: Checkin[];
  biomarkers: Biomarker[];
  briefs: SupporterBrief[];
  messages: WhatsAppMsg[];
  fixtureMode: boolean;
};

export function useRealtimeData(circleId: string | null): {
  data: DemoData;
  toggleFixture: () => void;
} {
  const [fixtureMode, setFixtureMode] = useState(false);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [briefs, setBriefs] = useState<SupporterBrief[]>([]);
  const [messages, setMessages] = useState<WhatsAppMsg[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "f" || e.key === "F") {
        if (
          e.target instanceof HTMLElement &&
          ["INPUT", "TEXTAREA"].includes(e.target.tagName)
        )
          return;
        setFixtureMode((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!circleId || fixtureMode) return;
    const sb = supabaseAnon();
    if (!sb) return;

    let cancelled = false;

    async function refresh() {
      const [c, b, br, m] = await Promise.all([
        sb!
          .from("checkins")
          .select("*")
          .eq("circle_id", circleId)
          .order("started_at", { ascending: false })
          .limit(10),
        sb!
          .from("biomarker_snapshots")
          .select("*, checkins!inner(circle_id)")
          .eq("checkins.circle_id", circleId)
          .order("created_at", { ascending: false })
          .limit(20),
        sb!
          .from("supporter_briefs")
          .select("*")
          .eq("circle_id", circleId)
          .order("created_at", { ascending: false })
          .limit(10),
        sb!
          .from("whatsapp_messages")
          .select("*")
          .eq("circle_id", circleId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (cancelled) return;
      if (c.data) setCheckins(c.data as Checkin[]);
      if (b.data) setBiomarkers(b.data as Biomarker[]);
      if (br.data) setBriefs(br.data as SupporterBrief[]);
      if (m.data) setMessages(m.data as WhatsAppMsg[]);
    }

    refresh();

    const channel = sb
      .channel(`demo-${circleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkins", filter: `circle_id=eq.${circleId}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "biomarker_snapshots" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "supporter_briefs", filter: `circle_id=eq.${circleId}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_messages", filter: `circle_id=eq.${circleId}` },
        refresh,
      )
      .subscribe();

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [circleId, fixtureMode]);

  const data: DemoData = fixtureMode
    ? {
        checkins: fixtureCheckins,
        biomarkers: fixtureBiomarkers,
        briefs: fixtureBriefs,
        messages: fixtureMessages,
        fixtureMode: true,
      }
    : { checkins, biomarkers, briefs, messages, fixtureMode: false };

  return { data, toggleFixture: () => setFixtureMode((v) => !v) };
}
