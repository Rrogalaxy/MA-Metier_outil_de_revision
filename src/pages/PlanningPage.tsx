import React, { useEffect, useState } from "react";
import { listMyActivities } from "../services/user.service";
import type { Activity } from "../types";

export default function PlanningPage() {
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        listMyActivities().then(setActivities);
    }, []);

    return (
        <section style={card}>
            <h2 style={h2}>Planning privé</h2>
            <div style={muted}>Activités (mock “Agender / Activites”).</div>

            {activities.length === 0 ? (
                <div style={{ marginTop: 10, ...muted }}>Aucune activité.</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    {activities.map((a) => (
                        <div key={a.numeroActivites} style={row}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{a.nomActivite}</div>
                                <div style={muted}>
                                    {a.date} • {a.heureDebut}–{a.heureFin} • {a.jour}
                                </div>
                            </div>
                            <div style={muted}>{a.moduleNom ?? ""}</div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

const card: React.CSSProperties = { border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 14, background: "white" };
const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.08)" };
const h2: React.CSSProperties = { margin: "0 0 10px 0", fontSize: 18 };
const muted: React.CSSProperties = { opacity: 0.75, fontSize: 13 };
