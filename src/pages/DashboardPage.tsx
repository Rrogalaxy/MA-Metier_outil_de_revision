import React, { useEffect, useState } from "react";
import { getMe } from "../services/user.service";
import type { User } from "../types";

export default function DashboardPage() {
    const [me, setMe] = useState<User | null>(null);

    useEffect(() => {
        getMe().then(setMe);
    }, []);

    return (
        <section style={card}>
            <h2 style={h2}>Dashboard</h2>
            <p style={muted}>
                Bienvenue {me ? <b>{me.prenom} {me.nom}</b> : "…"} — version “finale” (routes + services mock).
            </p>
            <p style={muted}>
                Prochaine étape : page Module (progression personnelle) + quiz partagés.
            </p>
        </section>
    );
}

const card: React.CSSProperties = { border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 14, background: "white" };
const h2: React.CSSProperties = { margin: "0 0 10px 0", fontSize: 18 };
const muted: React.CSSProperties = { opacity: 0.75 };
