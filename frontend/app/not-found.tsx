import Link from "next/link";
import { StatusPage } from "@/components/ui/StatusPage";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <StatusPage
      title="This page does not exist"
      actions={
        <>
          <Link href="/" className={buttonClasses("primary", "lg")}>
            Back to Sorot
          </Link>
          <Link href="/positions" className={buttonClasses("secondary", "lg")}>
            Positions
          </Link>
        </>
      }
    >
      The link may be old or mistyped. Sorot has a landing page, a trade page opened from chips, and a positions page.
    </StatusPage>
  );
}
