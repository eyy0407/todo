"use client";

import { notFound } from "next/navigation";
import TodoApp from "../_components/TodoApp";

export default function SecretPage({ params }) {
  const secret = process.env.NEXT_PUBLIC_SECRET_PATH || "my-todo";
  if (params.secret !== secret) {
    notFound();
  }
  return <TodoApp />;
}
