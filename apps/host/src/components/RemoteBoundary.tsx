import type { PropsWithChildren } from "react";

type RemoteBoundaryProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function RemoteBoundary({ title, description, children }: RemoteBoundaryProps) {
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Runtime Boundary</p>
          <h2>{title}</h2>
        </div>
      </header>
      <p className="body-copy">{description}</p>
      <div className="remote-slot">{children}</div>
    </section>
  );
}
