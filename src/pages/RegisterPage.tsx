// src/pages/RegisterPage.tsx
import { useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/auth.service";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const navigate = useNavigate();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);

        if (password !== passwordConfirmation) {
            setErr("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);
        try {
            await register({
                email: email.trim(),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                password,
                password_confirmation: passwordConfirmation,
            });
            navigate("/", { replace: true });
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Erreur lors de l’inscription");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section style={card}>
            <h2 style={h2}>Créer un compte</h2>

            <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <div style={field}>
                    <div style={label}>Prénom</div>
                    <input style={input} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>

                <div style={field}>
                    <div style={label}>Nom</div>
                    <input style={input} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>

                <div style={field}>
                    <div style={label}>Email</div>
                    <input style={input} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div style={field}>
                    <div style={label}>Mot de passe</div>
                    <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                <div style={field}>
                    <div style={label}>Confirmation</div>
                    <input
                        style={input}
                        type="password"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                    />
                </div>

                {err && <div style={errorBox}>{err}</div>}

                <button style={btnPrimary} disabled={loading}>
                    {loading ? "Création…" : "Créer"}
                </button>
            </form>

            <div style={{ marginTop: 12, ...muted }}>
                Déjà un compte ? <Link to="/login">Se connecter</Link>
            </div>
        </section>
    );
}

const card: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 14,
    background: "white",
    maxWidth: 460,
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
