import Link from 'next/link'
import { ArrowLeft, HeartPulse, Info, Leaf, Wind } from 'lucide-react'

const categories = [
  { range: '0–50', label: 'Good', detail: 'Air quality is satisfactory; little or no risk for most people.' },
  { range: '51–100', label: 'Moderate', detail: 'Acceptable for most people; unusually sensitive people may notice effects.' },
  { range: '101–150', label: 'Unhealthy for sensitive groups', detail: 'Children, older adults, and people with heart or lung conditions may need to reduce prolonged outdoor exertion.' },
  { range: '151–200', label: 'Unhealthy', detail: 'Some people may experience effects; sensitive groups may experience more serious effects.' },
  { range: '201–300', label: 'Very unhealthy', detail: 'Health alert conditions; consider limiting outdoor exertion and follow local advice.' },
  { range: '301+', label: 'Hazardous', detail: 'Everyone may be at greater risk; avoid strenuous outdoor activity and follow official public-health guidance.' },
]

const pollutants = [
  { name: 'PM2.5 · Fine particulate matter', source: 'Vehicle exhaust, combustion, smoke, industry and some dust-forming activities.', meaning: 'Very small particles that can travel deep into the lungs. Values are commonly shown in µg/m³.' },
  { name: 'PM10 · Coarse particulate matter', source: 'Road and construction dust, soil, pollen and other airborne particles.', meaning: 'Larger inhalable particles that can irritate the nose, throat and airways. Values are commonly shown in µg/m³.' },
  { name: 'NO₂ · Nitrogen dioxide', source: 'Road traffic, power generation and other fuel-burning processes.', meaning: 'A reactive gas that can irritate airways. Values may be shown in µg/m³.' },
  { name: 'SO₂ · Sulfur dioxide', source: 'Burning sulfur-containing fuels and some industrial processes.', meaning: 'A gas that can affect breathing, particularly for people with asthma. Values may be shown in µg/m³.' },
  { name: 'CO · Carbon monoxide', source: 'Incomplete combustion, including vehicle exhaust and poorly vented fuel-burning equipment.', meaning: 'A colourless, odourless gas. The provider may report it in a different unit from particle pollutants; always read the displayed unit.' },
  { name: 'O₃ · Ground-level ozone', source: 'Forms in sunlight from reactions involving nitrogen oxides and volatile organic compounds; it is not emitted directly.', meaning: 'Can irritate lungs and worsen breathing during outdoor exertion. This is ground-level ozone, not the protective ozone layer.' },
]

export default function LearnPage() {
  return <main className="min-h-screen bg-[#f3f8f6] px-4 py-6 text-[#163d37] sm:px-6 sm:py-10">
    <div className="mx-auto max-w-5xl">
      <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-[#d5e5dc] bg-white px-4 py-2 text-sm font-semibold text-[#2d6655] transition hover:bg-[#edf7f0]"><ArrowLeft size={16}/> Back to dashboard</Link>
      <header className="mt-7 rounded-[28px] bg-[#173f3b] p-6 text-white sm:p-10">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#b9e8d0]"><Leaf size={16}/> AirAware learning centre</div>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Understand the air, not just the number.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#d0e2d9] sm:text-base">Learn what AQI and common air pollutants mean, where they come from, and how to reduce exposure when air quality is poor.</p>
      </header>
      <section className="mt-6 rounded-[24px] border border-[#dce9e4] bg-white p-5 sm:p-7">
        <div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e0f4e8] text-[#087d5a]"><Wind size={20}/></div><div><h2 className="text-xl font-semibold">What is AQI?</h2><p className="mt-2 text-sm leading-6 text-[#61766e]">The Air Quality Index (AQI) turns air-pollution measurements into a simpler indicator. Higher values generally mean greater concern for health. AQI is a communication tool; it does not describe every pollutant or every person's risk equally.</p><p className="mt-3 text-sm leading-6 text-[#61766e]">AirAware currently displays the provider's <strong>US AQI</strong> field. The categories below describe the US AQI scale and may differ from India's CPCB National AQI categories. This is not an official CPCB reading.</p></div></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-left text-sm"><thead><tr className="border-b border-[#e5eee8] text-xs uppercase tracking-wide text-[#7b9087]"><th className="px-3 py-3">US AQI</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">General health implication</th></tr></thead><tbody>{categories.map((item) => <tr key={item.range} className="border-b border-[#edf2ee] align-top last:border-0"><td className="px-3 py-3 font-semibold">{item.range}</td><td className="px-3 py-3 font-semibold">{item.label}</td><td className="px-3 py-3 leading-5 text-[#61766e]">{item.detail}</td></tr>)}</tbody></table></div>
      </section>
      <section className="mt-6 rounded-[24px] border border-[#dce9e4] bg-white p-5 sm:p-7">
        <h2 className="text-xl font-semibold">Common pollutants</h2><p className="mt-2 text-sm leading-6 text-[#61766e]">Pollutant values describe individual substances; they are not the AQI itself. Compare a value only with guidance for the same pollutant, unit, averaging period and measurement standard.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{pollutants.map((item) => <article key={item.name} className="rounded-2xl bg-[#f4f8f5] p-4"><h3 className="font-semibold">{item.name}</h3><p className="mt-2 text-sm leading-5 text-[#61766e]">{item.meaning}</p><p className="mt-2 text-xs leading-5 text-[#71877b]"><strong>Common sources:</strong> {item.source}</p></article>)}</div>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-[24px] border border-[#dce9e4] bg-white p-5 sm:p-7"><div className="flex items-center gap-2"><HeartPulse className="text-[#087d5a]" size={20}/><h2 className="text-lg font-semibold">Reduce exposure</h2></div><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-[#61766e]"><li>Check the latest local air-quality reading and official public-health advice before strenuous outdoor activity.</li><li>When pollution is high, reduce prolonged or intense outdoor exertion; move exercise indoors if practical.</li><li>Keep windows closed when outdoor pollution is high if indoor conditions allow, and use effective indoor filtration when available.</li><li>Avoid adding indoor smoke from tobacco, waste burning or poorly vented combustion.</li><li>People with asthma or other heart/lung conditions should follow their clinician's action plan.</li></ul></article>
        <article className="rounded-[24px] border border-[#ccebdd] bg-gradient-to-br from-[#f0fbf5] to-white p-5 sm:p-7"><div className="flex items-center gap-2"><Info className="text-[#087d5a]" size={20}/><h2 className="text-lg font-semibold">How to read AirAware</h2></div><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-[#61766e]"><li>Dashboard AQI and pollutant numbers come from the configured provider when a location is selected.</li><li>Each pollutant card displays its own unit. Do not compare values with different units as if they were equivalent.</li><li>Hourly trends show the provider's available hourly series, not a forecast guarantee or a ground-level sensor at every map pin.</li><li>Data availability and update times vary by location and provider. A map marker is location context, not a pollution measurement.</li></ul><p className="mt-4 text-xs leading-5 text-[#71877b]">This page is educational and does not provide medical advice. For local official guidance, consult CPCB or your state pollution control board.</p><Link href="/" className="mt-5 inline-flex rounded-full bg-[#087d5a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#06694b]">Return to dashboard</Link></article>
      </section>
    </div>
  </main>
}
