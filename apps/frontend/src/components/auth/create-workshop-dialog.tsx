"use client";

import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * "Criar minha oficina": o cadastro self-service de oficinas ainda não existe
 * (decisão MT-04 — chega com planos e assinatura, fase P8). Em vez de um link morto
 * ou de um fluxo inventado, informa como funciona o acesso hoje.
 */
export function CreateWorkshopDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group inline-flex items-center gap-1 rounded-sm font-medium text-primary outline-none transition-colors hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Criar minha oficina
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="dark max-w-md border-white/10 bg-card/95 text-foreground backdrop-blur-xl">
        <DialogHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Store className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle>Cadastro de novas oficinas</DialogTitle>
          <DialogDescription>
            O cadastro self-service chega em breve, junto com os planos e a assinatura do ZTECH OFICINA.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Por enquanto, as oficinas são habilitadas pela equipe ZTECH. Se você já recebeu um convite, entre com o
          e-mail cadastrado ou defina sua senha pelo link de recuperação.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" asChild>
            <Link href="/forgot-password">Definir minha senha</Link>
          </Button>
          <DialogClose asChild>
            <Button>Entendi</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
