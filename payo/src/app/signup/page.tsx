import { redirect } from "next/navigation";

// Old link: /signup -> /register
export default function SignupRedirect() {
  redirect("/register");
}
