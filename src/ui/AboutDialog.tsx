import { useCallback } from 'react';
import { TIMEOUT_MS } from '@/sim/engine';
import { formatMs } from '@/sim/format';
import { useApp, useSystem } from '@/store';
import { SectionTitle } from './controls';
import { Modal } from './Modal';

/** The design write-up for a system, how the simulation works, and the sources. */
export function AboutDialog() {
	const system = useSystem();
	const open = useApp((s) => s.dialog === 'about');
	const openDialog = useApp((s) => s.openDialog);
	const close = useCallback(() => openDialog(null), [openDialog]);
	if (!open) return null;

	return (
		<Modal title={system.name} onClose={close}>
			<div className="space-y-6 text-sm leading-relaxed text-slate-600">
				<div className="space-y-2">
					{system.description.map((paragraph) => (
						<p key={paragraph}>{paragraph}</p>
					))}
				</div>

				<section className="space-y-2">
					<SectionTitle>Design choices</SectionTitle>
					<dl className="space-y-3">
						{system.decisions.map((d) => (
							<div key={d.title}>
								<dt className="font-medium text-slate-900">{d.title}</dt>
								<dd className="mt-0.5 text-slate-500">{d.detail}</dd>
							</div>
						))}
					</dl>
				</section>

				<section className="space-y-2">
					<SectionTitle>How the simulation works</SectionTitle>
					<p>
						Each copy of a part can handle a set number of requests a second. Each
						journey sends its requests through the parts it uses. The simulation then
						works out how busy each part is, how many requests fail, and how long people
						wait.
					</p>
					<ul className="list-disc space-y-1 pl-5 text-slate-500">
						<li>
							Busy parts get slower, and much slower as they get close to full. Past
							full, they turn away the extra requests.
						</li>
						<li>
							A failed call makes the caller wait {formatMs(TIMEOUT_MS)} before it
							gives up. Retries add more work. Circuit breakers stop calling a failing
							part and answer at once.
						</li>
						<li>
							Optional steps can fail and the request still works. Background steps
							don’t make anyone wait, but their failures still count.
						</li>
						<li>
							Autoscaling adds copies to keep each part under 70% busy, unless the
							rush is sudden. Databases and event streams change only when you change
							them.
						</li>
					</ul>
					<p className="text-slate-500">
						This is a simple model, not a real test. It shows where things settle for
						the settings you choose. The numbers are examples, not real data.
					</p>
				</section>

				{system.sources.length > 0 && (
					<section className="space-y-2">
						<SectionTitle>Sources</SectionTitle>
						<ul className="space-y-1.5">
							{system.sources.map((source) => (
								<li key={source.url}>
									<a
										href={source.url}
										target="_blank"
										rel="noreferrer"
										className="text-cyan-700 hover:underline"
									>
										{source.title}
									</a>
									{source.publisher && (
										<span className="text-slate-500">
											{' '}
											· {source.publisher}
										</span>
									)}
								</li>
							))}
						</ul>
					</section>
				)}
			</div>
		</Modal>
	);
}
