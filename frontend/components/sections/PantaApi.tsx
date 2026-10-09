import { pantaApi } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function PantaApi() {
  return (
    <section id="panta" className="relative scroll-mt-6">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <SectionHeading eyebrow={pantaApi.eyebrow} title={pantaApi.title} body={pantaApi.body} />
          </Reveal>

          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Panta endpoints used by Sorot</caption>
            <thead className="hidden sm:table-header-group">
              <tr className="border-b border-ink/25 text-[13px] font-semibold text-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Endpoint
                </th>
                <th scope="col" className="py-3 font-semibold">
                  Used for
                </th>
              </tr>
            </thead>
            <tbody>
              {pantaApi.rows.map((row) => (
                <tr
                  key={row.route}
                  className="block border-b border-ink/15 py-3.5 sm:table-row sm:py-0"
                >
                  <th
                    scope="row"
                    className="block py-0 pr-4 text-left font-normal sm:table-cell sm:py-4"
                  >
                    <code className="break-all font-mono text-[13px] font-medium text-brand-blue">
                      {row.route}
                    </code>
                  </th>
                  <td className="block pt-1 text-[14.5px] text-muted sm:table-cell sm:py-4 sm:pt-4">
                    {row.use}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
