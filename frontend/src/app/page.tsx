"use client";

import { useAppKit } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function Home() {
  const router = useRouter();
  const { open } = useAppKit();
  const { isConnected } = useAccount();

  // Update page title based on connection status
  useEffect(() => {
    document.title = "Crée ton identité privée, en quelques étapes.";
  }, []);

  const login = () => {
    open({ view: "Connect" });
  };

  const startKYC = () => {
    router.push("/kyc/upload");
  };

  return (
    <div className="min-h-screen" style={{ background: "#FAF7ED" }}>
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-center py-24 px-4 gap-0 lg:gap-8 max-w-7xl mx-auto">
        {/* Left Side */}
        <div className="flex-1 flex flex-col items-start justify-center max-w-xl w-full p-8">
          <h1
            className="mb-6"
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: 40,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            Crée ton identité privée,
            <br />
            en quelques étapes.
          </h1>
          <div
            className="mb-4 text-gray-700"
            style={{ fontFamily: "Manrope, sans-serif", fontSize: 16 }}
          >
            Vérifie ton identité sans jamais partager tes données.
            <br />
            Tout est chiffré, analysé localement et ancré sur la blockchain.
            <br />
            Aucune fuite, aucune copie.
          </div>
          <div className="flex items-center mb-6 mt-2">
            <span className="text-xl mr-2">🔒</span>
            <span className="text-sm text-gray-700">
              Rien n'est stocké, ni envoyé
            </span>
          </div>
          <button
            onClick={isConnected ? startKYC : login}
            style={{
              background: "#FFE66C",
              borderRadius: 8,
              borderTop: "1px solid #000",
              borderRight: "2px solid #000",
              borderBottom: "3px solid #000",
              borderLeft: "1px solid #000",
              fontFamily: "Orbitron, sans-serif",
              fontSize: 20,
              padding: "20px 24px",
              width: 320,
              textAlign: "center",
              fontWeight: 500,
              boxSizing: "border-box",
              cursor: "pointer",
              transition: "opacity 0.2s",
              marginTop: 8,
            }}
          >
            Commencer ma vérification
          </button>
        </div>
        {/* Right Side */}
        <div className="flex-1 flex items-center justify-center w-full max-w-md p-8">
          <img
            src="/images/mascotte.png"
            alt="Bubble Tea Cup"
            style={{ width: 380, height: 380, objectFit: "contain" }}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl p-10">
          <h2
            className="text-center mb-16"
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            Une solution pensée pour la sécurité et la vie privée
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Analyse locale et sécurisée */}
            <div
              className="flex flex-col items-center text-center bg-white rounded-2xl p-8"
              style={{ minHeight: 260 }}
            >
              <img
                src="/images/analyseIcon.png"
                alt="Analyse locale"
                className="w-16 h-16 mb-4"
              />
              <h3
                className="font-semibold mb-2"
                style={{ fontFamily: "Orbitron, sans-serif", fontSize: 20 }}
              >
                Analyse locale et sécurisée
              </h3>
              <p
                className="text-gray-700"
                style={{ fontFamily: "Manrope, sans-serif", fontSize: 15 }}
              >
                Le traitement biométrique se fait dans un environnement sécurisé
                (TEE). Aucun document n'est envoyé ou conservé ailleurs que sur
                votre appareil.
              </p>
            </div>
            {/* Protection des données */}
            <div
              className="flex flex-col items-center text-center bg-white rounded-2xl p-8"
              style={{ minHeight: 260 }}
            >
              <img
                src="/images/saveIcon.png"
                alt="Protection des données"
                className="w-16 h-16 mb-4"
              />
              <h3
                className="font-semibold mb-2"
                style={{ fontFamily: "Orbitron, sans-serif", fontSize: 20 }}
              >
                Protection des données
              </h3>
              <p
                className="text-gray-700"
                style={{ fontFamily: "Manrope, sans-serif", fontSize: 15 }}
              >
                Aucun serveur distant n'est utilisé. Vos fichiers restent
                confidentiels.
              </p>
            </div>
            {/* Enregistrement cryptographique */}
            <div
              className="flex flex-col items-center text-center bg-white rounded-2xl p-8"
              style={{ minHeight: 260 }}
            >
              <img
                src="/images/secureIcon.png"
                alt="Enregistrement cryptographique"
                className="w-16 h-16 mb-4"
              />
              <h3
                className="font-semibold mb-2"
                style={{ fontFamily: "Orbitron, sans-serif", fontSize: 20 }}
              >
                Enregistrement cryptographique
              </h3>
              <p
                className="text-gray-700"
                style={{ fontFamily: "Manrope, sans-serif", fontSize: 15 }}
              >
                Une preuve d'authenticité est inscrite sur la blockchain, sans
                exposer vos données.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img
              src="/images/logo.png"
              alt="KawaiiC Logo"
              className="w-8 h-8 rounded"
            />
            <h3 className="text-xl font-bold">KawaiiC</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Revolutionary identity verification powered by confidential
            computing
          </p>
          <p className="text-sm text-gray-500">
            Built for iHackathon 2025 • Powered by iExec DataProtector & TEE
          </p>
        </div>
      </footer>
    </div>
  );
}
