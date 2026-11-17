
const canvas = document.getElementById("jeu");
const ctx = canvas.getContext("2d");

const scoreHTML = document.getElementById("score");
const viesHTML = document.getElementById("vies");
const niveauHTML = document.getElementById("niveau");

const menu = document.getElementById("menu");
const boutonDemarrer = document.getElementById("demarrer");
const boutonSon = document.getElementById("son");

// VARIABLES DU JEU
let joueur = {
    x: 180,
    y: 490,
    largeur: 40,
    hauteur: 70,
    vitesse: 260
};

let polices = [];
let touches = {};

let score = 0;
let vies = 3;
let niveau = 1;

let actif = false;
let sonActif = true;

let tempsCreation = 0;
let tempsJeu = 0;
let tempsProtection = 0;
let dernierTemps = 0;
let lignes = 0;

// SON DU JEU
function jouerSon(frequence) {
    if (!sonActif) return;

    try {
        const audio = new AudioContext();
        const oscillateur = audio.createOscillator();
        const volume = audio.createGain();

        oscillateur.frequency.value = frequence;
        volume.gain.value = 0.08;

        oscillateur.connect(volume);
        volume.connect(audio.destination);

        oscillateur.start();
        oscillateur.stop(audio.currentTime + 0.15);

        oscillateur.onended = () => audio.close();
    } catch (erreur) {
        console.log("Son indisponible");
    }
}

// TOUCHES DU CLAVIER
document.addEventListener("keydown", function(e) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
    }

    touches[e.key] = true;
});

document.addEventListener("keyup", function(e) {
    touches[e.key] = false;
});

// DESSINER UNE VOITURE
function dessinerVoiture(x, y, couleur, police = false) {

    // Carrosserie
    ctx.fillStyle = couleur;
    ctx.fillRect(x, y, 40, 70);

    // Pare-brise
    ctx.fillStyle = "#93c5fd";
    ctx.fillRect(x + 6, y + 10, 28, 18);

    // Vitre arrière
    ctx.fillRect(x + 6, y + 43, 28, 15);

    // Roues
    ctx.fillStyle = "#111";

    ctx.fillRect(x - 5, y + 10, 6, 17);
    ctx.fillRect(x + 39, y + 10, 6, 17);
    ctx.fillRect(x - 5, y + 45, 6, 17);
    ctx.fillRect(x + 39, y + 45, 6, 17);

    if (police) {
        // Gyrophare rouge et bleu
        ctx.fillStyle = "#2563eb";
        ctx.fillRect(x + 8, y + 3, 11, 5);

        ctx.fillStyle = "#ef4444";
        ctx.fillRect(x + 21, y + 3, 11, 5);
    } else {
        // Phares de la voiture rouge
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(x + 5, y + 2, 9, 4);
        ctx.fillRect(x + 26, y + 2, 9, 4);
    }
}

// DESSINER LA ROUTE
function dessinerRoute() {

    ctx.fillStyle = "#267a35";
    ctx.fillRect(0, 0, 400, 600);

    ctx.fillStyle = "#444";
    ctx.fillRect(70, 0, 260, 600);

    // Bords de route
    ctx.fillStyle = "white";
    ctx.fillRect(70, 0, 5, 600);
    ctx.fillRect(325, 0, 5, 600);

    // Lignes centrales
    for (let y = -80; y < 650; y += 120) {
        ctx.fillRect(198, y + lignes, 5, 60);
    }
}

// CRÉER UNE VOITURE DE POLICE
function creerPolice() {

    const voies = [93, 180, 267];

    const voie = voies[Math.floor(Math.random() * voies.length)];

    polices.push({
        x: voie,
        y: -80,
        largeur: 40,
        hauteur: 70,
        vitesse: 150 + niveau * 12
    });
}

// DÉPLACEMENT DU JOUEUR
function deplacerJoueur(dt) {

    const vitesse = joueur.vitesse * dt;

    if (touches["ArrowLeft"]) {
        joueur.x -= vitesse;
    }

    if (touches["ArrowRight"]) {
        joueur.x += vitesse;
    }

    if (touches["ArrowUp"]) {
        joueur.y -= vitesse;
    }

    if (touches["ArrowDown"]) {
        joueur.y += vitesse;
    }

    joueur.x = Math.max(75, Math.min(285, joueur.x));
    joueur.y = Math.max(0, Math.min(530, joueur.y));
}

// COLLISIONS
function collision(a, b) {

    return (
        a.x + 5 < b.x + b.largeur - 5 &&
        a.x + a.largeur - 5 > b.x + 5 &&
        a.y + 5 < b.y + b.hauteur - 5 &&
        a.y + a.hauteur - 5 > b.y + 5
    );
}

// METTRE À JOUR LES VOITURES DE POLICE
function mettreAJourPolice(dt) {

    polices.forEach(function(p) {

        // La police essaie de suivre le joueur
        const centrePolice = p.x + 20;
        const centreJoueur = joueur.x + 20;

        if (centrePolice < centreJoueur) {
            p.x += 90 * dt;
        }

        if (centrePolice > centreJoueur) {
            p.x -= 90 * dt;
        }

        p.y += p.vitesse * dt;

    });

    polices = polices.filter(p => p.y < 650);
}

// VÉRIFIER LES COLLISIONS
function verifierCollisions() {

    if (tempsProtection > 0) return;

    for (let i = polices.length - 1; i >= 0; i--) {

        if (collision(joueur, polices[i])) {

            polices.splice(i, 1);

            vies--;
            viesHTML.textContent = vies;

            tempsProtection = 1.2;

            jouerSon(150);

            if (vies <= 0) {
                terminerJeu();
            }

            break;
        }
    }
}

// TERMINER LE JEU
function terminerJeu() {

    actif = false;

    menu.style.display = "block";

    menu.innerHTML = `
        <h2>🚨 GAME OVER 🚨</h2>
        <p>La police t'a arrêté !</p>
        <p>Ton score : ${Math.floor(score)}</p>
        <button id="demarrer">REJOUER</button>
    `;

    document.getElementById("demarrer").addEventListener("click", demarrerJeu);

}

// DÉMARRER UNE PARTIE
function demarrerJeu() {

    joueur.x = 180;
    joueur.y = 490;

    polices = [];

    score = 0;
    vies = 3;
    niveau = 1;

    tempsCreation = 0;
    tempsJeu = 0;
    tempsProtection = 0;
    lignes = 0;

    actif = true;

    scoreHTML.textContent = "0";
    viesHTML.textContent = "3";
    niveauHTML.textContent = "1";

    menu.style.display = "none";
    canvas.style.display = "block";

    dernierTemps = performance.now();
}

// BOUCLE PRINCIPALE
function boucle(temps) {

    const dt = Math.min((temps - dernierTemps) / 1000 || 0, 0.05);

    dernierTemps = temps;

    if (actif) {

        tempsJeu += dt;

        score += dt * 10;

        niveau = 1 + Math.floor(score / 150);

        scoreHTML.textContent = Math.floor(score);
        niveauHTML.textContent = niveau;

        deplacerJoueur(dt);

        lignes = (lignes + 250 * dt) % 120;

        tempsCreation += dt;

        if (tempsCreation > Math.max(0.65, 1.5 - niveau * 0.08)) {
            creerPolice();
            tempsCreation = 0;
        }

        mettreAJourPolice(dt);

        if (tempsProtection > 0) {
            tempsProtection -= dt;
        }

        verifierCollisions();

        dessinerRoute();

        polices.forEach(function(p) {
            dessinerVoiture(p.x, p.y, "#e5e7eb", true);
        });

        // Faire clignoter le joueur après un choc
        if (tempsProtection <= 0 || Math.floor(tempsProtection * 10) % 2 === 0) {
            dessinerVoiture(joueur.x, joueur.y, "#ef4444");
        }
    }

    requestAnimationFrame(boucle);
}

// BOUTON SON
boutonSon.addEventListener("click", function() {

    sonActif = !sonActif;

    boutonSon.textContent = sonActif
        ? "🔊 Son activé"
        : "🔇 Son désactivé";

});

// BOUTON JOUER
boutonDemarrer.addEventListener("click", demarrerJeu);

// LANCER L'ANIMATION
canvas.style.display = "none";

requestAnimationFrame(function(temps) {
    dernierTemps = temps;
    boucle(temps);
});
