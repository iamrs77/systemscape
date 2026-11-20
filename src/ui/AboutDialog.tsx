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
			<div className="space-y-6 text-sm leading-relaxed text-slate-300">
				<div className="space-y-2">
					{system.description.map((paragraph) => (
						<p key={paragraph}>{paragraph}</p>
					))}
				</div>

				<section className="space-y-2">
					<SectionTitle>Design decisions</SectionTitle>
					<dl className="space-y-3">
						{system.decisions.map((d) => (
							<div key={d.title}>
								<dt className="font-medium text-slate-100">{d.title}</dt>
								<dd className="mt-0.5 text-slate-400">{d.detail}</dd>
							</div>
						))}
					</dl>
				</section>

				<section className="space-y-2">
					<SectionTitle>How the simulation works</SectionTitle>
					<p>
						Each part can handle a set number of requests a second per instance. Every
						journey sends its requests through the parts it uses, and the simulation
						works out where things settle: how busy each part is, how many requests
						fail, and how long users wait.
					</p>
					<ul className="list-disc space-y-1 pl-5 text-slate-400">
						<li>
							Busy parts get slower, sharply as they near full (a queueing model).
							Past full, they fail the extra requests.
						</li>
						<li>
							A failed call makes the caller wait for a timeout (
							{formatMs(TIMEOUT_MS)}), and retries add load. Circuit breakers stop
							calling a failing part and answer at once.
						</li>
						<li>
							Optional steps can fail without failing the request. Background steps
							don’t make users wait, but their failures are counted.
						</li>
						<li>
							Autoscaling adds instances to keep parts below 70% busy, unless the rush
							is sudden. Databases and streams only change when you change them.
						</li>
					</ul>
					<p className="text-slate-400">
						It’s a model, not a load test: it shows the steady state for the conditions
						you set, and the numbers are illustrative.
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
										className="text-cyan-300 hover:underline"
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
