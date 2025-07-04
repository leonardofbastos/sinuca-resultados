import Link from "next/link";
import { useRouter } from "next/router";

export default function Navbar() {
  const router = useRouter();

  return (
    <nav
      className="fixed top-12 left-0 w-full bg-blue-700 text-white font-bold flex justify-center gap-5 py-2 z-40"
    >
      <Link href="/prismeira" className={router.pathname === "/prismeira" ? "text-yellow-300" : "text-white"}>
        Prismeira League
      </Link>
      <Link href="/amistoso" className={router.pathname === "/amistoso" ? "text-yellow-300" : "text-white"}>
        Amistoso
      </Link>
    </nav>
  );
}
