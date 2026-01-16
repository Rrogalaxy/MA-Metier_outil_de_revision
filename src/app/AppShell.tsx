import { useEffect, useState } from "react";

import { Link, NavLink, Outlet } from "react-router-dom";

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: "8px 10px",
    borderRadius: 10,
    textDecoration: "none",
    border: "1px solid rgba(0,0,0,0.12)",
    color: "#111",
    background: isActive ? "rgba(0,0,0,0.08)" : "white",
});

export default function AppShell() {
    return (
        <div style={{ fontFamily: "system-ui", padding: 20, maxWidth: 1100, margin: "0 auto" }}>
            <header style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <Link to="/" style={{ textDecoration: "none", color: "#111" }}>
                    <h1 style={{ margin: 0, fontSize: 22 }}>Révisions</h1>
                </Link>

                <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <NavLink to="/" end style={navLinkStyle}>Dashboard</NavLink>
                    <NavLink to="/modules" style={navLinkStyle}>Modules</NavLink>
                    <NavLink to="/planning" style={navLinkStyle}>Planning</NavLink>
                    <NavLink to="/stats" style={navLinkStyle}>Stats</NavLink>
                </nav>
            </header>

            <main style={{ marginTop: 16 }}>
                <Outlet />
            </main>
        </div>
    );
}
