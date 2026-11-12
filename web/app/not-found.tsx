import Link from "next/link";
import { hoofdknop } from "@/components/stijl";

// Deze pagina zie je bij een adres dat niet bestaat, of als een pagina notFound() aanroept.
export default function NietGevonden() {
  return (
    <main className="mx-auto grid w-full max-w-md flex-1 place-items-center px-6 py-16 text-center">
      <div>
        <p className="text-[13px] font-semibold text-accent">Buitenspel</p>
        <h1 className="mt-1 text-[34px] font-bold leading-[1.1] tracking-[-0.025em]">Deze pagina bestaat niet</h1>
        <p className="mt-3 text-[17px] leading-[1.45] text-secundair">
          Misschien heeft de speler de competitie verlaten, of klopt het adres niet helemaal.
        </p>
        <Link href="/spelers" className={`mt-6 ${hoofdknop}`}>
          Naar de spelers
        </Link>
      </div>
    </main>
  );
}
