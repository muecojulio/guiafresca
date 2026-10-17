import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, QrCode, Share, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Shell, PageHeader } from "@/components/shell";
import { ActionButton } from "@/components/actions";
import { Disclosure } from "@/components/accordion";

export const Route = createFileRoute("/instalar")({ component: Instalar });

function Instalar() {
  const [src, setSrc] = useState("");
  const [href, setHref] = useState("");
  const [failed, setFailed] = useState(false);

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
      .catch(() => setFailed(true));
  }, []);

  return (
    <Shell>
      <div className="px-5 pt-5">
        <Link
          to="/ajustes"
          className="tap inline-flex min-h-11 items-center gap-1 text-sm text-stone"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Ajustes
        </Link>
      </div>

      <PageHeader title="Instalar" eyebrow="Como app, sin tienda">
        Se agrega a la pantalla de inicio y abre a pantalla completa. En iPhone, el sistema pide
        Safari.
      </PageHeader>

      <div className="px-5 pt-6">
        <div className="card flex flex-col items-center gap-3 px-5 py-6">
          {src ? (
            <img
              src={src}
              alt="Código QR para instalar Guía Fresca"
              className="w-56 rounded-card border border-line"
            />
          ) : (
            <div className="grid size-56 place-items-center rounded-card border border-line bg-paper-deep text-stone">
              <QrCode className="size-10" aria-hidden="true" />
            </div>
          )}
          <p className="text-center text-sm leading-relaxed text-stone">
            {failed
              ? "No pude dibujar el código. Usa el botón de abajo."
              : "Apunta la cámara aquí desde el teléfono donde quieres instalarla."}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <a
            href={href || "?install=1&platform=ios"}
            className="tap press sheen inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-paper"
          >
            <Share className="size-4" aria-hidden="true" />
            Pasos en iPhone
          </a>
          <a
            href="/?install=1&platform=android"
            className="tap press inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-card px-5"
          >
            <Smartphone className="size-4" aria-hidden="true" />
            Pasos en Android
          </a>
        </div>

        <div className="pt-6">
          <Disclosure label="Qué hace la app instalada" hint="Sin tienda ni descargas" defaultOpen>
            <p className="text-sm leading-relaxed text-stone">
              El código apunta a esta misma dirección con la guía de instalación. Cuando la app está
              publicada, es un enlace https que se abre directo en el teléfono y funciona incluso
              con mala señal, porque las fichas y las fotos ya viajan con la página.
            </p>
          </Disclosure>
        </div>

        <ActionButton className="mt-4" variant="ghost" onClick={() => window.print()}>
          Imprimir esta página
        </ActionButton>
      </div>
    </Shell>
  );
}
