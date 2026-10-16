import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/instalar")({ component: Instalar });

function Instalar() {
  const [src, setSrc] = useState("");
  const [href, setHref] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    url.pathname = "/";
    url.search = "install=1&platform=ios";
    url.hash = "";
    const next = url.toString();
    setHref(next);
    QRCode.toDataURL(next, {
      margin: 1,
      width: 280,
      color: { dark: "#1c241c", light: "#f3efe4" },
    })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, []);

  return (
    <Shell>
      <div className="px-5 pt-5">
        <Link to="/ajustes" className="tap inline-flex min-h-11 items-center gap-1 text-sm text-stone">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Ajustes
        </Link>
        <h1 className="font-display mt-4 text-4xl">Instalar</h1>
        <p className="mt-3 text-base leading-relaxed text-stone">
          Se instala en la pantalla de inicio, como una app, sin tienda. En iPhone el sistema pide Safari.
        </p>
      </div>
      <div className="px-5 pt-6">
        {src ? <img src={src} alt="Código QR para instalar Guía Fresca" className="w-56 rounded-card border border-line" /> : null}
        <div className="mt-5 flex flex-col gap-3">
          <a href={href || "?install=1&platform=ios"} className="tap inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 text-paper">
            Pasos en iPhone
          </a>
          <a href="/?install=1&platform=android" className="tap inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-card px-5">
            Pasos en Android
          </a>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-stone">
          El código apunta a esta misma dirección con la guía de instalación. Cuando la app está publicada, es un
          enlace https que se abre directo en el teléfono.
        </p>
      </div>
    </Shell>
  );
}
