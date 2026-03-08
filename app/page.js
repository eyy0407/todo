import { redirect } from "next/navigation";
export default function RootPage() {
  const secret = process.env.NEXT_PUBLIC_SECRET_PATH || "my-todo";
  redirect(`/${secret}`);
}
