// src/pages/LoginPage.tsx
import { useMemo, useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/auth.service";

export default function LoginPage() {
    const [email, setEmail] = useState("eleve@cpnv.ch");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation();

    const redirectTo = useMemo(() => {
        // si RequireAuth a envoyé un "from", on y retourne après login
        const state = location.state as { from?: string } | null;
        return state?.from ?? "/";
    }, [location.state]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);

        try {
            await login(email.trim(), password);
            navigate(redirectTo, { replace: true });
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section style={card}>
            <h2 style={h2}>Connexion</h2>

            <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <div style={field}>
                    <div style={label}>Email</div>
                    <input
                        style={input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                    />
                </div>

                <div style={field}>
                    <div style={label}>Mot de passe</div>
                    <input
                        style={input}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>

                {err && <div style={errorBox}>{err}</div>}

                <button style={btnPrimary} disabled={loading || password.trim().length === 0}>
                    {loading ? "Connexion…" : "Se connecter"}
                </button>
            </form>

            <div style={{ marginTop: 12, ...muted }}>
                Pas de compte ? <Link to="/register">Créer un compte</Link>
            </div>
        </section>
    );
}

const card: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 14,
    background: "white",
    maxWidth: 420,
    margin: "0 auto",
};

const h2: CSSProperties = { margin: 0, fontSize: 18 };
const muted: CSSProperties = { opacity: 0.75, fontSize: 13 };

const field: CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const label: CSSProperties = { ...muted, fontSize: 12 };

const input: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    outline: "none",
};

const btnPrimary: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid black",
    background: "black",
    color: "white",
    cursor: "pointer",
};

const errorBox: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(0,0,0,0.03)",
    fontSize: 13,
};
