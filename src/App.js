import React, { useState, useMemo } from 'react'
import { Cloud, Battery, Cpu, Upload, Info, Leaf, Sun } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts'
import { motion } from 'framer-motion'


// Complete, fixed React survey app with calming environment theme
const DEFAULTS = {
  gridKgCO2PerKWh: 0.7,
  devicePowerW: {
    Smartphone: 5,
    Laptop: 50,
    Tablet: 10,
    Desktop: 150,
    'Smart TV': 80,
    Other: 30,
    'Gaming Console': 120,
    'Streaming Device': 15,
    'Smart Home Devices': 25,
    'Router': 10,
  },
  kgCO2PerGB: 0.05,
  inrPerTonneCO2: 2000,
  gbPerStreamingHour: 1.5,
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"
]

function generateParticipantId() {
  return `P${Date.now()}`
}

function round(num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export default function SurveySite() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [defaults, setDefaults] = useState(DEFAULTS)
  const [message, setMessage] = useState(null)

  const [form, setForm] = useState({
    age: '',
    gender: '',
    occupation: '',
    customOccupation: '',
    schooling: '',
    city: '',
    state: '',
    cityTier: '',
    accommodation: '',
    familyIncomeRange: '',
    primaryConnection: '',
    avgDailyInternetHours: '',
    totalDevices: '',
    smartphone: '',
    laptop: '',
    tablet: '',
    desktop: '',
    smartTV: '',
    otherDevices: '',
    gamingConsole: '',
    streamingDevice: '',
    smartHomeDevices: '',
    router: '',
    smartphoneDuration: '',
    laptopDuration: '',
    tabletDuration: '',
    desktopDuration: '',
    smartTVDuration: '',
    otherDevicesDuration: '',
    gamingConsoleDuration: '',
    streamingDeviceDuration: '',
    smartHomeDevicesDuration: '',
    routerDuration: '',
    noDevices: false,
    aiInteractionsPerDay: '',
    aiTypes: '',
    typicalAiSessionMinutes: '',
    cloudHoursPerWeek: '',
    streamingAcademicHrsPerWeek: '',
    streamingNonAcademicHrsPerWeek: '',
    largeTransfersPerMonth: '',
    accessRenewableAtHome: '',
    estimatedAnnualKgCO2: '',
    consent: false,
  })

  // Calculate results
  const results = useMemo(() => {
    // Device calculations - based on device counts and actual usage duration
    let deviceKg = 0
    if (!form.noDevices) {
      const deviceData = [
        { type: 'Smartphone', count: Number(form.smartphone) || 0, duration: Number(form.smartphoneDuration) || 0 },
        { type: 'Laptop', count: Number(form.laptop) || 0, duration: Number(form.laptopDuration) || 0 },
        { type: 'Tablet', count: Number(form.tablet) || 0, duration: Number(form.tabletDuration) || 0 },
        { type: 'Desktop', count: Number(form.desktop) || 0, duration: Number(form.desktopDuration) || 0 },
        { type: 'Smart TV', count: Number(form.smartTV) || 0, duration: Number(form.smartTVDuration) || 0 },
        { type: 'Gaming Console', count: Number(form.gamingConsole) || 0, duration: Number(form.gamingConsoleDuration) || 0 },
        { type: 'Streaming Device', count: Number(form.streamingDevice) || 0, duration: Number(form.streamingDeviceDuration) || 0 },
        { type: 'Smart Home Devices', count: Number(form.smartHomeDevices) || 0, duration: Number(form.smartHomeDevicesDuration) || 0 },
        { type: 'Router', count: Number(form.router) || 0, duration: Number(form.routerDuration) || 0 },
        { type: 'Other', count: Number(form.otherDevices) || 0, duration: Number(form.otherDevicesDuration) || 0 },
      ]
      
      deviceData.forEach(({ type, count, duration }) => {
        if (count > 0 && duration > 0) {
          const powerW = defaults.devicePowerW[type] || 0
          const kwhPerYear = (powerW * duration * 365) / 1000
          deviceKg += count * (kwhPerYear * defaults.gridKgCO2PerKWh)
        }
      })
    }

    // Data and streaming calculations
    const academic = Number(form.streamingAcademicHrsPerWeek) || 0
    const nonAcad = Number(form.streamingNonAcademicHrsPerWeek) || 0
    const streamingHoursPerMonth = (academic + nonAcad) * 4.345
    const gbFromStreamingPerYear = streamingHoursPerMonth * (Number(defaults.gbPerStreamingHour) || 0) * 12
    const gbFromBigTransfersPerYear = (Number(form.largeTransfersPerMonth) || 0) * 12
    const totalGB = gbFromStreamingPerYear + gbFromBigTransfersPerYear
    const dataKg = totalGB * defaults.kgCO2PerGB

    // AI calculations (simplified)
    const aiInteractions = Number(form.aiInteractionsPerDay) || 0
    const aiMinutes = Number(form.typicalAiSessionMinutes) || 0
    const aiKg = (aiInteractions * aiMinutes * 365 * 0.001) // Simple estimation

    const totalKg = round(deviceKg + dataKg + aiKg)

    return {
      deviceKg: round(deviceKg),
      dataKg: round(dataKg),
      aiKg: round(aiKg),
      totalKg
    }
  }, [form, defaults])

  function kgToInr(kg) {
    const tonne = (Number(kg) || 0) / 1000
    return round(tonne * (Number(defaults.inrPerTonneCO2) || 0), 2)
  }

  function getCityState() {
    const c = (form.city || '').trim()
    const s = (form.state || '').trim()
    if (c && s) return `${c}, ${s}`
    if (c) return c
    if (s) return s
    return ''
  }

  function downloadJSON() {
    const data = {
      participantId: generateParticipantId(),
      timestamp: new Date().toISOString(),
      form,
      results,
      cityState: getCityState()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `survey_${data.participantId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSubmit() {
    if (!form.consent) {
      setMessage({ type: 'error', text: 'Please provide consent to participate.' })
      return
    }

    const data = {
      participantId: generateParticipantId(),
      timestamp: new Date().toISOString(),
      form,
      results,
      cityState: getCityState()
    }

    try {
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      }
      
      setMessage({ 
        type: 'success', 
        text: 'Survey submitted successfully! Your carbon footprint has been calculated.' 
      })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to submit survey. Please try again.' 
      })
    }
  }

  // Pie chart data
  const pieData = [
    { name: 'Devices', value: Number(results.deviceKg) || 0 },
    { name: 'Data & Streaming', value: Number(results.dataKg) || 0 },
    { name: 'AI', value: Number(results.aiKg) || 0 },
  ]
  const COLORS = ['#34D399', '#3B82F6', '#F59E0B']

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-sky-100 py-12 px-4 relative overflow-hidden">
      <Leaf className="absolute top-8 left-8 text-green-300 w-16 h-16 rotate-12 opacity-40" />
      <Sun className="absolute top-20 right-12 text-yellow-300 w-20 h-20 animate-pulse opacity-30" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* HERO */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-sky-500 rounded-3xl p-8 shadow-2xl text-white mb-8 flex items-center gap-4">
          <div className="p-4 bg-white/10 rounded-xl">
            <Cloud size={36} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold flex items-center gap-2">
              Electronic Use & Carbon Footprint Survey 
              <Leaf className="inline-block text-green-200" size={24} />
            </h1>
            <p className="mt-1 opacity-90">Contribute to a greener future — understand your digital impact on the environment.</p>
          </div>
          <div className="ml-auto text-sm text-white/90 text-right">
            <div className="font-medium">Estimated cost preview</div>
            <div className="mt-1 text-lg font-bold">₹{kgToInr(results.totalKg)}</div>
            <div className="text-xs mt-1">(at ₹{defaults.inrPerTonneCO2}/tCO₂)</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Age" value={form.age} onChange={(v) => setForm({ ...form, age: v })} placeholder="e.g. 21" />
              <Select label="Gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} options={["Male","Female","Other"]} />
              <Select label="Occupation" value={form.occupation} onChange={(v) => setForm({ ...form, occupation: v })} options={["Student","Employed","Self-Employed","Unemployed","Other"]} />
              {form.occupation === 'Other' && <Input label="Please specify occupation" value={form.customOccupation} onChange={(v) => setForm({ ...form, customOccupation: v })} />}
              <Select label="Schooling" value={form.schooling} onChange={(v) => setForm({ ...form, schooling: v })} options={["Government","Private","Convent","Other"]} />
              <Input label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Select label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} options={INDIAN_STATES} />
              <Select label="City Tier" value={form.cityTier} onChange={(v) => setForm({ ...form, cityTier: v })} options={["1","2","3"]} />
              <Select label="Accommodation" value={form.accommodation} onChange={(v) => setForm({ ...form, accommodation: v })} options={["Apartment","Independent House","Rented","Hostel","Other"]} />
              <Select label="Family Income Range" value={form.familyIncomeRange} onChange={(v) => setForm({ ...form, familyIncomeRange: v })} options={["<₹1L","₹1L-3L","₹3L-5L","₹5L-8L","₹8L-10L",">₹10L"]} />
            </div>

            <hr className="my-5" />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Internet & Devices</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select label="Primary Internet Connection" value={form.primaryConnection} onChange={(v) => setForm({ ...form, primaryConnection: v })} options={["Mobile Data (5G/4G)","Wi-Fi at Home","Wi-Fi at Work/College","Public Wi-Fi","Hotspot from Phone","Other"]} />
                <Input label="Avg daily internet usage (hrs)" value={form.avgDailyInternetHours} onChange={(v) => setForm({ ...form, avgDailyInternetHours: v })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Total devices owned" value={form.totalDevices} onChange={(v) => setForm({ ...form, totalDevices: v })} placeholder="e.g. 5" />
              </div>

              <div>
                <h4 className="font-medium mb-3">Devices Owned (Enter quantity and daily usage hours)</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="font-medium text-sm text-gray-600">Device Type</div>
                    <div className="font-medium text-sm text-gray-600">Quantity</div>
                    <div className="font-medium text-sm text-gray-600">Hours/Day</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm">Smartphone</div>
                    <Input label="" value={form.smartphone} onChange={(v) => setForm({ ...form, smartphone: v })} placeholder="0" />
                    <Input label="" value={form.smartphoneDuration} onChange={(v) => setForm({ ...form, smartphoneDuration: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm">Laptop</div>
                    <Input label="" value={form.laptop} onChange={(v) => setForm({ ...form, laptop: v })} placeholder="0" />
                    <Input label="" value={form.laptopDuration} onChange={(v) => setForm({ ...form, laptopDuration: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm">Tablet</div>
                    <Input label="" value={form.tablet} onChange={(v) => setForm({ ...form, tablet: v })} placeholder="0" />
                    <Input label="" value={form.tabletDuration} onChange={(v) => setForm({ ...form, tabletDuration: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm">Desktop</div>
                    <Input label="" value={form.desktop} onChange={(v) => setForm({ ...form, desktop: v })} placeholder="0" />
                    <Input label="" value={form.desktopDuration} onChange={(v) => setForm({ ...form, desktopDuration: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm">Smart TV</div>
                    <Input label="" value={form.smartTV} onChange={(v) => setForm({ ...form, smartTV: v })} placeholder="0" />
                    <Input label="" value={form.smartTVDuration} onChange={(v) => setForm({ ...form, smartTVDuration: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm">Gaming Console</div>
                    <Input label="" value={form.gamingConsole} onChange={(v) => setForm({ ...form, gamingConsole: v })} placeholder="0" />
                    <Input label="" value={form.gamingConsoleDuration} onChange={(v) => setForm({ ...form, gamingConsoleDuration: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm">Streaming Device (Roku, Chromecast, etc.)</div>
                    <Input label="" value={form.streamingDevice} onChange={(v) => setForm({ ...form, streamingDevice: v })} placeholder="0" />
                    <Input label="" value={form.streamingDeviceDuration} onChange={(v) => setForm({ ...form, streamingDeviceDuration: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm">Smart Home Devices (Alexa, etc.)</div>
                    <Input label="" value={form.smartHomeDevices} onChange={(v) => setForm({ ...form, smartHomeDevices: v })} placeholder="0" />
                    <Input label="" value={form.smartHomeDevicesDuration} onChange={(v) => setForm({ ...form, smartHomeDevicesDuration: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm">Router/Modem</div>
                    <Input label="" value={form.router} onChange={(v) => setForm({ ...form, router: v })} placeholder="0" />
                    <Input label="" value={form.routerDuration} onChange={(v) => setForm({ ...form, routerDuration: v })} placeholder="24" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm">Other devices</div>
                    <Input label="" value={form.otherDevices} onChange={(v) => setForm({ ...form, otherDevices: v })} placeholder="0" />
                    <Input label="" value={form.otherDevicesDuration} onChange={(v) => setForm({ ...form, otherDevicesDuration: v })} placeholder="0" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={!!form.noDevices} onChange={(e) => setForm({ ...form, noDevices: e.target.checked })} />
                    <span className="text-sm">I don't own any electronic devices</span>
                  </label>
                </div>
              </div>

              <hr />

              <h3 className="text-lg font-medium">AI, Cloud & Streaming</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="AI interactions per day" value={form.aiInteractionsPerDay} onChange={(v) => setForm({ ...form, aiInteractionsPerDay: v })} />
                <Input label="Typical AI session length (min)" value={form.typicalAiSessionMinutes} onChange={(v) => setForm({ ...form, typicalAiSessionMinutes: v })} />
                <Input label="Cloud services usage (hrs/week)" value={form.cloudHoursPerWeek} onChange={(v) => setForm({ ...form, cloudHoursPerWeek: v })} />
                <Input label="Uploads / big transfers per month (GB)" value={form.largeTransfersPerMonth} onChange={(v) => setForm({ ...form, largeTransfersPerMonth: v })} />
                <Input label="Streaming (academic hrs/week)" value={form.streamingAcademicHrsPerWeek} onChange={(v) => setForm({ ...form, streamingAcademicHrsPerWeek: v })} />
                <Input label="Streaming (non-academic hrs/week)" value={form.streamingNonAcademicHrsPerWeek} onChange={(v) => setForm({ ...form, streamingNonAcademicHrsPerWeek: v })} />
              </div>

              <hr />

              <h3 className="text-lg font-medium">Sustainability & Awareness</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <Select label="Access to renewable electricity at home" value={form.accessRenewableAtHome} onChange={(v) => setForm({ ...form, accessRenewableAtHome: v })} options={["Yes - fully","Partial / Sometimes","No"]} />
                <Input label="Your estimate of annual electronic footprint (kgCO2)" value={form.estimatedAnnualKgCO2} onChange={(v) => setForm({ ...form, estimatedAnnualKgCO2: v })} placeholder="e.g. 250" />
              </div>

              <div className="mt-3 text-sm bg-amber-50 p-3 rounded flex items-center gap-3">
                <Info size={18} />
                <div>
                  <strong>Expectation vs Reality:</strong> Press <span className="font-semibold">Calculate</span> and we'll show how your estimate compares to a computed footprint based on your inputs.
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={!!form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                  <span className="text-sm">I consent to participating in this research.</span>
                </label>

                <div className="ml-auto flex gap-2">
                  <button type="button" onClick={downloadJSON} className="px-4 py-2 rounded-md border">Download JSON</button>
                  <button type="button" onClick={handleSubmit} className="px-4 py-2 rounded-md bg-indigo-600 text-white shadow">Calculate & Submit</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Summary / Chart / Admin */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-emerald-50 rounded-md">
                  <Battery size={28} className="text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Annual Footprint</div>
                  <div className="text-2xl font-bold">{results.totalKg} kg CO₂</div>
                  <div className="text-sm text-gray-500 mt-1">Approx. ₹{kgToInr(results.totalKg)} (at ₹{defaults.inrPerTonneCO2}/tCO₂)</div>
                </div>
              </div>

              <div style={{ height: 220 }} className="mt-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3} isAnimationActive={false}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(value) => `${value} kg`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <SmallStat icon={<Cpu size={18} />} label="Devices" value={`${results.deviceKg} kg`} color="green" />
                <SmallStat icon={<Upload size={18} />} label="Data & Streaming" value={`${results.dataKg} kg`} color="blue" />
                <SmallStat icon={<Cloud size={18} />} label="AI" value={`${results.aiKg} kg`} color="amber" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Admin / Emission Factors</div>
                  <div className="text-xs text-gray-500">Adjust these before you collect data for accurate results.</div>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                <LabeledInput label="Grid kgCO₂ per kWh" value={defaults.gridKgCO2PerKWh} onChange={(v) => setDefaults({ ...defaults, gridKgCO2PerKWh: Number(v) || 0 })} />
                <LabeledInput label="kgCO₂ per GB transferred" value={defaults.kgCO2PerGB} onChange={(v) => setDefaults({ ...defaults, kgCO2PerGB: Number(v) || 0 })} />
                <LabeledInput label="₹ per tCO₂" value={defaults.inrPerTonneCO2} onChange={(v) => setDefaults({ ...defaults, inrPerTonneCO2: Number(v) || 0 })} />
                <LabeledInput label="Default GB per streaming hour" value={defaults.gbPerStreamingHour} onChange={(v) => setDefaults({ ...defaults, gbPerStreamingHour: Number(v) || 0 })} />
                <div>
                  <div className="text-sm text-gray-600">Webhook URL</div>
                  <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-server.com/webhook" className="mt-1 p-2 rounded border w-full" />
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {message.text}
              </div>
            )}

            <div className="text-xs text-gray-500">Tip: Replace default emission constants with authoritative sources (IEA, peer-reviewed papers, or local grid operator) for more accurate results.</div>
          </div>
        </div>

        {/* Footer: calming plant wave */}
        <div className="mt-10 bg-gradient-to-t from-white to-emerald-50 rounded-t-3xl p-6">
          <div className="max-w-4xl mx-auto text-center text-sm text-gray-600">Made with care 🌿 — this tool provides estimates; please validate emission factors before using results in research.</div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Helper components ---------- */

function Input({ label, value, onChange, placeholder = '' }) {
  const v = value === null || value === undefined ? '' : String(value)
  return (
    <div>
      <div className="text-sm text-gray-600">{label}</div>
      <input value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 p-3 rounded-md border w-full" />
    </div>
  )
}

function Select({ label, value, onChange, options = [] }) {
  const v = value === null || value === undefined ? '' : String(value)
  return (
    <div>
      <div className="text-sm text-gray-600">{label}</div>
      <select value={v} onChange={(e) => onChange(e.target.value)} className="mt-1 p-3 rounded-md border w-full">
        <option value="">Select</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function LabeledInput({ label, value, onChange }) {
  const v = value === null || value === undefined ? '' : String(value)
  return (
    <div>
      <div className="text-sm text-gray-600">{label}</div>
      <input value={v} onChange={(e) => onChange(e.target.value)} className="mt-1 p-2 rounded border w-full" />
    </div>
  )
}

function SmallStat({ icon, label, value, color }) {
  const bg = color === 'blue' ? 'bg-sky-50' : color === 'amber' ? 'bg-amber-50' : 'bg-emerald-50'
  return (
    <div className={`flex items-center gap-3 p-2 ${bg} rounded`}>
      <div className="p-2 rounded bg-white/60">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  )
}