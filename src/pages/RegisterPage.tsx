// src/pages/RegisterPage.tsx
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/auth.service";
import { listClasses, type StudentClass } from "../services/class.service";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    // ✅ classes backend
    const [classes, setClasses] = useState<StudentClass[]>([]);
    const [classesLoading, setClassesLoading] = useState(false);
    const [classesErr, setClassesErr] = useState<string | null>(null);

    // ✅ sélection de classe
    const [selectedClassKey, setSelectedClassKey] = useState<string>(""); // ex: "SI-CA1a|2026"

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const navigate = useNavigate();

    // Charge la liste des classes au montage
    useEffect(() => {
        (async () => {
            setClassesLoading(true);
            setClassesErr(null);
            try {
                const data = await listClasses();
                setClasses(data);

                // pré-sélection du 1er item si existe
                if (data.length > 0) {
                    const first = data[0];
                    setSelectedClassKey(`${first.class_id}|${String(first.class_year)}`);
                }
            } catch (e) {
                setClassesErr(
                    e instanceof Error
                        ? e.message
                        : "Impossible de charger la liste des classes"
                );
            } finally {
                setClassesLoading(false);
            }
        })();
    }, []);

    const selectedClass = useMemo(() => {
        if (!selectedClassKey) return null;
        const [class_id, class_year] = selectedClassKey.split("|");
        if (!class_id || !class_year) return null;
        return { class_id, class_year };
    }, [selectedClassKey]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);

        if (password !== passwordConfirmation) {
            setErr("Les mots de passe ne correspondent pas.");
            return;
        }

        // ✅ si vous exigez une classe, décommente :
        // if (!selectedClass) {
        //   setErr("Merci de sélectionner une classe.");
        //   return;
        // }

        setLoading(true);
        try {
            await register({
                email: email.trim(),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                password,
                password_confirmation: passwordConfirmation,

                // ✅ on prépare le futur : classe/année
                // (si le backend ignore ces champs, il faut qu'il ne valide pas strictement)
                ...(selectedClass
                    ? { class_id: selectedClass.class_id, class_year: selectedClass.class_year }
                    : {}),
            } as any); // ← "as any" pour éviter de casser si ton type register() n'a pas encore class_id/year

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
                    <input style={input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>

                {/* ✅ Classe */}
                <div style={field}>
                    <div style={label}>Classe</div>

                    {classesLoading ? (
                        <div style={muted}>Chargement des classes…</div>
                    ) : classesErr ? (
                        <div style={errorBox}>
                            <div style={{ fontWeight: 800, marginBottom: 4 }}>Classes indisponibles</div>
                            <div style={{ ...muted, opacity: 1 }}>{classesErr}</div>
                            <div style={{ marginTop: 6, ...muted }}>
                                Tu peux quand même créer un compte (dev), ou réessayer plus tard.
                            </div>
                        </div>
                    ) : (
                        <select
                            style={select}
                            value={selectedClassKey}
                            onChange={(e) => setSelectedClassKey(e.target.value)}
                            disabled={classes.length === 0}
                        >
                            {classes.length === 0 ? (
                                <option value="">Aucune classe disponible</option>
                            ) : (
                                classes.map((c) => {
                                    const key = `${c.class_id}|${String(c.class_year)}`;
                                    return (
                                        <option key={key} value={key}>
                                            {c.class_id} — {String(c.class_year)}
                                        </option>
                                    );
                                })
                            )}
                        </select>
                    )}
                </div>

                <div style={field}>
                    <div style={label}>Mot de passe</div>
                    <input
                        style={input}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                </div>

                <div style={field}>
                    <div style={label}>Confirmation</div>
                    <input
                        style={input}
                        type="password"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        autoComplete="new-password"
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

const select: CSSProperties = {
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
