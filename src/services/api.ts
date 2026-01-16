// Plus tard: remplacer par fetch/axios + auth token.
// Pour l’instant: abstraction pour que le frontend ne dépende pas du mock.

export async function fakeDelay(ms = 150) {
    await new Promise((r) => setTimeout(r, ms));
}
