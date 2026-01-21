import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dumbbell, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
            <Dumbbell className="h-5 w-5 text-black" />
          </div>
          <span className="font-bold text-xl tracking-tight">R.I.N. GYM</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Iniciar Sesión
          </Link>
          <Button asChild size="sm" className="bg-primary text-black hover:bg-primary/90 font-bold">
            <Link href="/signup">
              Registrarse
            </Link>
          </Button>
        </div>
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
            Controla tus rutinas, progreso y reservas en un solo lugar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-12 px-8 text-lg font-bold">
              <Link href="/signup">
                Empezar Ahora <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-lg">
              <Link href="/login">
                Ya tengo cuenta
              </Link>
            </Button>
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
