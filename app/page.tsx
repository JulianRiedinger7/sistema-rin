import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="px-6 h-20 flex items-center justify-between border-b border-white/10">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="R.I.N. Centro Integral de Salud Deportiva"
            width={100}
            height={36}
            className="object-contain"
            priority
          />
        </Link>
        <Button asChild size="sm" className="bg-primary text-black hover:bg-primary/90 font-bold">
          <Link href="/login">
            Ingresar
          </Link>
        </Button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full -z-10" />

        <div className="max-w-3xl space-y-6 animate-in fade-in zoom-in duration-700">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            TU ENTRENAMIENTO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">
              AL SIGUIENTE NIVEL
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma de gestión integral para atletas de alto rendimiento y pilates.
            Accede a tus rutinas personalizadas, seguí tu progreso y gestioná tus reservas.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-14 px-10 text-lg font-bold">
              <Link href="/login">
                Ingresar al Sistema <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Info Card */}
          <div className="mt-8 p-4 bg-muted/30 border border-white/10 rounded-lg max-w-md mx-auto">
            <div className="flex items-center gap-3 text-left">
              <Users className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">¿Sos nuevo?</p>
                <p className="text-xs text-muted-foreground">
                  Acercate al gimnasio para que el staff te registre en el sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/10 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} R.I.N. Gym Management System.</p>
      </footer>
    </div>
  );
}
