import React, { useState, useMemo } from 'react'
import { Cloud, Battery, Cpu, Upload, Info, Leaf, Sun } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts'
import { motion } from 'framer-motion'


// Indian-specific carbon footprint survey defaults (updated for accuracy)
const INDIAN_DEFAULTS = {
  gridKgCO2PerKWh: 0.82, // India's grid carbon intensity (CEA 2023 data)
  devicePowerW: {
    Smartphone: 3, // Updated: Indian smartphones typically 3W avg usage
    Laptop: 65, // Updated: Modern laptops in India (including charging losses)
    Tablet: 8, // Updated: Typical tablet consumption
    Desktop: 180, // Updated: Including monitor, higher for Indian conditions
    'Smart TV': 100, // Updated: Indian LED TVs typically higher consumption
    Other: 25, // Updated: Average for misc devices
    'Gaming Console': 150, // Updated: PS5/Xbox consumption in Indian conditions
    'Streaming Device': 12, // Updated: Chromecast, Fire TV stick etc.
    'Smart Home Devices': 15, // Updated: Alexa, smart switches etc.
    'Router': 8, // Updated: Typical home router consumption
  },
  kgCO2PerGB: 0.065, // Updated: Indian data centers + transmission losses
  inrPerTonneCO2: 3000, // Updated: Current Indian carbon market price 2025
  gbPerStreamingHour: {
    SD: 0.3,
    HD: 1.2, // Updated: More accurate HD streaming
    '4K': 4.5, // Added: 4K streaming data
    default: 1.2
  },
  aiKgCO2PerQuery: {
    text: 0.0001, // Text generation (ChatGPT style)
    image: 0.02, // Image generation (DALL-E style) 
    code: 0.0002, // Code assistance
    voice: 0.0001, // Voice processing
    mixed: 0.005, // Mixed usage average
    default: 0.0005
  }
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
  const defaults = INDIAN_DEFAULTS
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
    smartphoneAge: '',
    laptopAge: '',
    tabletAge: '',
    desktopAge: '',
    smartTVAge: '',
    otherDevicesAge: '',
    gamingConsoleAge: '',
    streamingDeviceAge: '',
    smartHomeDevicesAge: '',
    routerAge: '',
    chargingHabits: '',
    powerSource: '',
    renewableEnergyUsage: '',
    solarPanels: '',
    energyEfficientAppliances: '',
    aiInteractionsPerDay: '',
    aiTypes: '',
    aiUsageTypes: '',
    typicalAiSessionMinutes: '',
    cloudHoursPerWeek: '',
    streamingAcademicHrsPerWeek: '',
    streamingNonAcademicHrsPerWeek: '',
    largeTransfersPerMonth: '',
    accessRenewableAtHome: '',
    estimatedAnnualKgCO2: '',
    // Quiz questions
    quizDataUsage: '',
    quizDeviceLifespan: '',
    quizChargingImpact: '',
    quizStreamingFootprint: '',
    quizRenewableEnergy: '',
    quizAIFootprint: '',
    consent: false,
  })

  // Calculate results
  const results = useMemo(() => {
    // Device calculations - based on device counts and actual usage duration
    let deviceKg = 0
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
      
      // Power source multiplier based on renewable energy usage
      const getPowerSourceMultiplier = () => {
        switch (form.renewableEnergyUsage) {
          case "0% - All conventional energy": return 1.0
          case "1-25% - Mostly conventional": return 0.9
          case "26-50% - Mixed sources": return 0.7
          case "51-75% - Mostly renewable": return 0.4
          case "76-100% - All or mostly renewable": return 0.2
          default: return 0.8 // Default assumption for "Don't know"
        }
      }

      // Charging habits multiplier (affects efficiency)
      const getChargingMultiplier = () => {
        switch (form.chargingHabits) {
          case "Always keep plugged in": return 1.3 // Higher consumption
          case "Charge overnight (8+ hours)": return 1.1
          case "Charge when needed (1-3 hours)": return 1.0 // Baseline
          case "Quick charge frequently (15-30 min)": return 1.2 // Less efficient
          case "Battery saver mode user": return 0.8 // More efficient
          default: return 1.0
        }
      }

      const powerSourceMultiplier = getPowerSourceMultiplier()
      const chargingMultiplier = getChargingMultiplier()

      deviceData.forEach(({ type, count, duration }) => {
        if (count > 0 && duration > 0) {
          const powerW = defaults.devicePowerW[type] || 0
          const kwhPerYear = (powerW * duration * 365) / 1000
          const baseEmissions = count * (kwhPerYear * defaults.gridKgCO2PerKWh)
          deviceKg += baseEmissions * powerSourceMultiplier * chargingMultiplier
        }
      })

    // Data and streaming calculations (updated for accuracy)
    // Parse academic streaming from range
    const academicText = form.streamingAcademicHrsPerWeek || ""
    let academicHours = 0
    if (academicText.includes("1-5")) academicHours = 3
    else if (academicText.includes("6-15")) academicHours = 10
    else if (academicText.includes("16-30")) academicHours = 23
    else if (academicText.includes("31-50")) academicHours = 40
    else if (academicText.includes("50+")) academicHours = 65
    
    // Parse entertainment streaming from range
    const entertainmentText = form.streamingNonAcademicHrsPerWeek || ""
    let entertainmentHours = 0
    if (entertainmentText.includes("1-10")) entertainmentHours = 5
    else if (entertainmentText.includes("11-25")) entertainmentHours = 18
    else if (entertainmentText.includes("26-40")) entertainmentHours = 33
    else if (entertainmentText.includes("41-60")) entertainmentHours = 50
    else if (entertainmentText.includes("60+")) entertainmentHours = 80
    
    const totalStreamingHoursPerWeek = academicHours + entertainmentHours
    const gbFromStreamingPerYear = totalStreamingHoursPerWeek * defaults.gbPerStreamingHour.default * 52
    
    // Parse cloud usage from range
    const cloudText = form.cloudHoursPerWeek || ""
    let cloudHours = 0
    if (cloudText.includes("1-5")) cloudHours = 3
    else if (cloudText.includes("6-15")) cloudHours = 10
    else if (cloudText.includes("16-30")) cloudHours = 23
    else if (cloudText.includes("31-50")) cloudHours = 40
    else if (cloudText.includes("50+")) cloudHours = 65
    
    const gbFromCloudPerYear = cloudHours * 52 * 0.5 // Estimate 0.5GB per hour of cloud usage
    const gbFromBigTransfersPerYear = (Number(form.largeTransfersPerMonth) || 0) * 12
    const totalGB = gbFromStreamingPerYear + gbFromCloudPerYear + gbFromBigTransfersPerYear
    const dataKg = totalGB * defaults.kgCO2PerGB

    // AI calculations (updated for accuracy)
    let aiKg = 0
    const aiInteractionsText = form.aiInteractionsPerDay || ""
    const aiSessionText = form.typicalAiSessionMinutes || ""
    const aiTypeText = form.aiUsageTypes || ""
    
    // Parse AI interactions per day from range
    let aiInteractionsDaily = 0
    if (aiInteractionsText.includes("1-5")) aiInteractionsDaily = 3
    else if (aiInteractionsText.includes("6-15")) aiInteractionsDaily = 10
    else if (aiInteractionsText.includes("16-30")) aiInteractionsDaily = 23
    else if (aiInteractionsText.includes("31-50")) aiInteractionsDaily = 40
    else if (aiInteractionsText.includes("50+")) aiInteractionsDaily = 75
    
    // Parse session length from range
    let sessionMinutes = 0
    if (aiSessionText.includes("Less than 1")) sessionMinutes = 0.5
    else if (aiSessionText.includes("1-5")) sessionMinutes = 3
    else if (aiSessionText.includes("6-15")) sessionMinutes = 10
    else if (aiSessionText.includes("16-30")) sessionMinutes = 23
    else if (aiSessionText.includes("31-60")) sessionMinutes = 45
    else if (aiSessionText.includes("More than 1 hour")) sessionMinutes = 90
    
    // Get AI type multiplier
    let aiTypeMultiplier = defaults.aiKgCO2PerQuery.default
    if (aiTypeText.includes("Text generation")) aiTypeMultiplier = defaults.aiKgCO2PerQuery.text
    else if (aiTypeText.includes("Image generation")) aiTypeMultiplier = defaults.aiKgCO2PerQuery.image
    else if (aiTypeText.includes("Code assistance")) aiTypeMultiplier = defaults.aiKgCO2PerQuery.code
    else if (aiTypeText.includes("Voice assistants")) aiTypeMultiplier = defaults.aiKgCO2PerQuery.voice
    else if (aiTypeText.includes("Mixed usage")) aiTypeMultiplier = defaults.aiKgCO2PerQuery.mixed
    
    if (aiInteractionsDaily > 0 && sessionMinutes > 0) {
      // Estimate queries per session (roughly 1 query per minute for interactive AI)
      const queriesPerSession = Math.max(1, sessionMinutes / 2)
      const totalQueriesPerYear = aiInteractionsDaily * queriesPerSession * 365
      aiKg = totalQueriesPerYear * aiTypeMultiplier
    }

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
    // Include social cost of carbon for Indian context (environmental damage costs)
    const socialCostMultiplier = 1.5 // Indian environmental damage is higher due to population density
    return round(tonne * (Number(defaults.inrPerTonneCO2) || 0) * socialCostMultiplier, 2)
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

  function handleSubmit() {
    if (!form.consent) {
      setMessage({ type: 'error', text: 'Please provide consent to participate.' })
      return
    }

    setMessage({ 
      type: 'success', 
      text: 'Survey completed successfully! Your carbon footprint has been calculated.' 
    })
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
              <Select label="Home Schooling" value={form.schooling} onChange={(v) => setForm({ ...form, schooling: v })} options={["Government","Private","Convent","Other"]} />
              <Input label="Home City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Select label="Home State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} options={INDIAN_STATES} />
              <Select label="City Tier" value={form.cityTier} onChange={(v) => setForm({ ...form, cityTier: v })} options={["1","2","3"]} />
              <Select label="Current Accommodation" value={form.accommodation} onChange={(v) => setForm({ ...form, accommodation: v })} options={["Apartment","Independent House","Rented","Hostel","Other"]} />
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
                <h4 className="font-medium mb-3">Devices Owned (Enter quantity of devices, Daily usage hours, and Age of the devices)</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3 items-center">
                    <div className="font-medium text-sm text-gray-600">Device Type</div>
                    <div className="font-medium text-sm text-gray-600">Number of devices</div>
                    <div className="font-medium text-sm text-gray-600">Hours/Day</div>
                    <div className="font-medium text-sm text-gray-600">Age of the devices (Years)</div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 items-center">
                    <div className="text-sm">Smartphone</div>
                    <Input label="" value={form.smartphone} onChange={(v) => setForm({ ...form, smartphone: v })} placeholder="0" />
                    <Input label="" value={form.smartphoneDuration} onChange={(v) => setForm({ ...form, smartphoneDuration: v })} placeholder="0" />
                    <Input label="" value={form.smartphoneAge} onChange={(v) => setForm({ ...form, smartphoneAge: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 items-center">
                    <div className="text-sm">Laptop</div>
                    <Input label="" value={form.laptop} onChange={(v) => setForm({ ...form, laptop: v })} placeholder="0" />
                    <Input label="" value={form.laptopDuration} onChange={(v) => setForm({ ...form, laptopDuration: v })} placeholder="0" />
                    <Input label="" value={form.laptopAge} onChange={(v) => setForm({ ...form, laptopAge: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 items-center">
                    <div className="text-sm">Tablet</div>
                    <Input label="" value={form.tablet} onChange={(v) => setForm({ ...form, tablet: v })} placeholder="0" />
                    <Input label="" value={form.tabletDuration} onChange={(v) => setForm({ ...form, tabletDuration: v })} placeholder="0" />
                    <Input label="" value={form.tabletAge} onChange={(v) => setForm({ ...form, tabletAge: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 items-center">
                    <div className="text-sm">Desktop</div>
                    <Input label="" value={form.desktop} onChange={(v) => setForm({ ...form, desktop: v })} placeholder="0" />
                    <Input label="" value={form.desktopDuration} onChange={(v) => setForm({ ...form, desktopDuration: v })} placeholder="0" />
                    <Input label="" value={form.desktopAge} onChange={(v) => setForm({ ...form, desktopAge: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 items-center">
                    <div className="text-sm">Smart TV</div>
                    <Input label="" value={form.smartTV} onChange={(v) => setForm({ ...form, smartTV: v })} placeholder="0" />
                    <Input label="" value={form.smartTVDuration} onChange={(v) => setForm({ ...form, smartTVDuration: v })} placeholder="0" />
                    <Input label="" value={form.smartTVAge} onChange={(v) => setForm({ ...form, smartTVAge: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 items-center">
                    <div className="text-sm">Gaming Console</div>
                    <Input label="" value={form.gamingConsole} onChange={(v) => setForm({ ...form, gamingConsole: v })} placeholder="0" />
                    <Input label="" value={form.gamingConsoleDuration} onChange={(v) => setForm({ ...form, gamingConsoleDuration: v })} placeholder="0" />
                    <Input label="" value={form.gamingConsoleAge} onChange={(v) => setForm({ ...form, gamingConsoleAge: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 items-center">
                    <div className="text-sm">Streaming Device (Roku, Chromecast, etc.)</div>
                    <Input label="" value={form.streamingDevice} onChange={(v) => setForm({ ...form, streamingDevice: v })} placeholder="0" />
                    <Input label="" value={form.streamingDeviceDuration} onChange={(v) => setForm({ ...form, streamingDeviceDuration: v })} placeholder="0" />
                    <Input label="" value={form.streamingDeviceAge} onChange={(v) => setForm({ ...form, streamingDeviceAge: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 items-center">
                    <div className="text-sm">Smart Home Devices (Alexa, etc.)</div>
                    <Input label="" value={form.smartHomeDevices} onChange={(v) => setForm({ ...form, smartHomeDevices: v })} placeholder="0" />
                    <Input label="" value={form.smartHomeDevicesDuration} onChange={(v) => setForm({ ...form, smartHomeDevicesDuration: v })} placeholder="0" />
                    <Input label="" value={form.smartHomeDevicesAge} onChange={(v) => setForm({ ...form, smartHomeDevicesAge: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 items-center">
                    <div className="text-sm">Router/Modem</div>
                    <Input label="" value={form.router} onChange={(v) => setForm({ ...form, router: v })} placeholder="0" />
                    <Input label="" value={form.routerDuration} onChange={(v) => setForm({ ...form, routerDuration: v })} placeholder="24" />
                    <Input label="" value={form.routerAge} onChange={(v) => setForm({ ...form, routerAge: v })} placeholder="0" />
                  </div>
                  <div className="grid grid-cols-4 gap-3 items-center">
                    <div className="text-sm">Other devices</div>
                    <Input label="" value={form.otherDevices} onChange={(v) => setForm({ ...form, otherDevices: v })} placeholder="0" />
                    <Input label="" value={form.otherDevicesDuration} onChange={(v) => setForm({ ...form, otherDevicesDuration: v })} placeholder="0" />
                    <Input label="" value={form.otherDevicesAge} onChange={(v) => setForm({ ...form, otherDevicesAge: v })} placeholder="0" />
                  </div>
                </div>
              </div>

              <hr />

              <h3 className="text-lg font-medium">Charging Habits & Power Sources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select 
                  label="Primary charging habits" 
                  value={form.chargingHabits} 
                  onChange={(v) => setForm({ ...form, chargingHabits: v })} 
                  options={[
                    "Charge overnight (8+ hours)",
                    "Charge when needed (1-3 hours)",
                    "Quick charge frequently (15-30 min)",
                    "Always keep plugged in",
                    "Battery saver mode user"
                  ]} 
                />
                <Select 
                  label="Primary power source at home" 
                  value={form.powerSource} 
                  onChange={(v) => setForm({ ...form, powerSource: v })} 
                  options={[
                    "Grid electricity (regular)",
                    "Grid electricity (renewable mix)",
                    "Solar panels",
                    "Mixed renewable sources",
                    "Don't know"
                  ]} 
                />
                <Select 
                  label="Renewable energy usage" 
                  value={form.renewableEnergyUsage} 
                  onChange={(v) => setForm({ ...form, renewableEnergyUsage: v })} 
                  options={[
                    "0% - All conventional energy",
                    "1-25% - Mostly conventional",
                    "26-50% - Mixed sources",
                    "51-75% - Mostly renewable",
                    "76-100% - All or mostly renewable",
                    "Don't know"
                  ]} 
                />
                <Select 
                  label="Do you have solar panels?" 
                  value={form.solarPanels} 
                  onChange={(v) => setForm({ ...form, solarPanels: v })} 
                  options={[
                    "Yes",
                    "No",
                    "Planning to install",
                    "Don't know"
                  ]} 
                />
                <Select 
                  label="Energy-efficient appliances" 
                  value={form.energyEfficientAppliances} 
                  onChange={(v) => setForm({ ...form, energyEfficientAppliances: v })} 
                  options={[
                    "Yes - Most are energy-efficient",
                    "Some are energy-efficient", 
                    "No - Regular appliances",
                    "Don't know"
                  ]} 
                />
              </div>

              <hr />

              <h3 className="text-lg font-medium">AI, Cloud & Streaming</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select 
                  label="AI interactions per day" 
                  value={form.aiInteractionsPerDay} 
                  onChange={(v) => setForm({ ...form, aiInteractionsPerDay: v })} 
                  options={[
                    "0 - Don't use AI",
                    "1-5 times",
                    "6-15 times",
                    "16-30 times",
                    "31-50 times",
                    "50+ times"
                  ]} 
                />
                <Select 
                  label="Type of AI usage" 
                  value={form.aiUsageTypes} 
                  onChange={(v) => setForm({ ...form, aiUsageTypes: v })} 
                  options={[
                    "Text generation (ChatGPT, etc.)",
                    "Image generation (DALL-E, etc.)",
                    "Code assistance (GitHub Copilot, etc.)",
                    "Voice assistants (Siri, Alexa, etc.)",
                    "Mixed usage (text + image + code)",
                    "Other AI tools",
                    "Don't use AI"
                  ]} 
                />
                <Select 
                  label="Typical AI session length" 
                  value={form.typicalAiSessionMinutes} 
                  onChange={(v) => setForm({ ...form, typicalAiSessionMinutes: v })} 
                  options={[
                    "Less than 1 minute",
                    "1-5 minutes",
                    "6-15 minutes",
                    "16-30 minutes",
                    "31-60 minutes",
                    "More than 1 hour"
                  ]} 
                />
                <Select 
                  label="Cloud services usage (hrs/week)" 
                  value={form.cloudHoursPerWeek} 
                  onChange={(v) => setForm({ ...form, cloudHoursPerWeek: v })} 
                  options={[
                    "0 - Don't use cloud services",
                    "1-5 hrs - Light usage (email, basic storage)",
                    "6-15 hrs - Moderate usage (Google Drive, Office 365)",
                    "16-30 hrs - Heavy usage (video calls, collaboration)",
                    "31-50 hrs - Very heavy usage (streaming, gaming)",
                    "50+ hrs - Constant usage (work/business)"
                  ]} 
                />
                <Input label="Uploads / big transfers per month (GB)" value={form.largeTransfersPerMonth} onChange={(v) => setForm({ ...form, largeTransfersPerMonth: v })} />
                <Select 
                  label="Streaming (academic hrs/week)" 
                  value={form.streamingAcademicHrsPerWeek} 
                  onChange={(v) => setForm({ ...form, streamingAcademicHrsPerWeek: v })} 
                  options={[
                    "0 - No academic streaming",
                    "1-5 hrs - Light (few lectures/courses)",
                    "6-15 hrs - Moderate (regular classes)",
                    "16-30 hrs - Heavy (full online courses)",
                    "31-50 hrs - Very heavy (intensive programs)",
                    "50+ hrs - Constant (full-time online)"
                  ]} 
                />
                <Select 
                  label="Streaming (entertainment hrs/week)" 
                  value={form.streamingNonAcademicHrsPerWeek} 
                  onChange={(v) => setForm({ ...form, streamingNonAcademicHrsPerWeek: v })} 
                  options={[
                    "0 - No entertainment streaming",
                    "1-10 hrs - Light (occasional shows)",
                    "11-25 hrs - Moderate (regular viewing)",
                    "26-40 hrs - Heavy (daily streaming)",
                    "41-60 hrs - Very heavy (binge watcher)",
                    "60+ hrs - Constant (background streaming)"
                  ]} 
                />
              </div>

              <hr />

              {/* Digital Carbon Facts */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 mb-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info size={24} className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">💡 Digital Carbon Facts</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="font-semibold text-blue-600 mb-2">📡 Global Data Infrastructure Cost</div>
                    <div className="text-gray-700">Transferring 1GB globally costs <strong>₹0.80-2.50</strong> including undersea cables, data centers, bandwidth, cooling systems, and maintenance workforce.</div>
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs"><strong>💰 Daily Cost:</strong> ₹2,300 crores spent daily on global internet infrastructure!</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="font-semibold text-green-600 mb-2">🎬 Streaming Infrastructure</div>
                    <div className="text-gray-700">Netflix spends <strong>₹15,000 crores annually</strong> on content delivery networks (CDNs) and bandwidth to stream videos worldwide smoothly.</div>
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs"><strong>💰 Daily Reality:</strong> ₹41 crores daily just for Netflix's streaming infrastructure</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="font-semibold text-purple-600 mb-2">🤖 AI Infrastructure Cost</div>
                    <div className="text-gray-700">OpenAI spends <strong>₹2,100 crores monthly</strong> on computing infrastructure. Google's AI data centers cost <strong>₹50,000 crores</strong> to build.</div>
                    <div className="mt-2 p-2 bg-purple-50 rounded text-xs"><strong>💰 Daily Scale:</strong> ₹70 crores daily spent by OpenAI alone on computing power</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="font-semibold text-amber-600 mb-2">📱 Manufacturing Infrastructure</div>
                    <div className="text-gray-700">Foxconn's iPhone factories cost <strong>₹40,000 crores</strong> to setup. Semiconductor fabs cost <strong>₹80,000+ crores</strong> each to build.</div>
                    <div className="mt-2 p-2 bg-amber-50 rounded text-xs"><strong>💰 Daily Production:</strong> ₹550 crores worth of global electronics manufactured daily</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="font-semibold text-red-600 mb-2">🔋 Power Grid Infrastructure</div>
                    <div className="text-gray-700">India's power grid infrastructure is worth <strong>₹25 lakh crores</strong>. Each power plant costs ₹15,000-50,000 crores to build and maintain.</div>
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs"><strong>💰 Daily Maintenance:</strong> ₹137 crores daily maintenance for India's electricity grid</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="font-semibold text-teal-600 mb-2">🌱 Undersea Cable Reality</div>
                    <div className="text-gray-700">Undersea internet cables cost <strong>₹2,500-4,000 crores per cable</strong>. 400+ cables carry 99% of international data worldwide.</div>
                    <div className="mt-2 p-2 bg-teal-50 rounded text-xs"><strong>💰 Daily Operations:</strong> ₹85 crores daily to operate and maintain undersea cables</div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="text-xs text-gray-600">💚 Your responses help researchers understand digital behavior patterns and promote sustainable technology use!</div>
                </div>
              </div>

              <h3 className="text-lg font-medium">📱 Electronic Carbon Footprint Quiz</h3>
              <div className="text-sm text-gray-600 mb-4">
                Test your knowledge about electronic device carbon footprints! Rate each factor's impact from 1 (lowest) to 10 (highest).
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Data Usage Impact (1-10)
                    <span className="block text-xs text-gray-500">How much does streaming 1 hour of HD video impact your carbon footprint?</span>
                  </label>
                  <Select 
                    value={form.quizDataUsage} 
                    onChange={(v) => setForm({ ...form, quizDataUsage: v })} 
                    options={["1 (lowest)", "2", "3", "4", "5 (medium)", "6", "7", "8", "9", "10 (highest)"]} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Device Lifespan Impact (1-10)
                    <span className="block text-xs text-gray-500">How much does using a smartphone for 5 years vs 2 years reduce carbon footprint?</span>
                  </label>
                  <Select 
                    value={form.quizDeviceLifespan} 
                    onChange={(v) => setForm({ ...form, quizDeviceLifespan: v })} 
                    options={["1 (lowest)", "2", "3", "4", "5 (medium)", "6", "7", "8", "9", "10 (highest)"]} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Charging Habits Impact (1-10)
                    <span className="block text-xs text-gray-500">How much does keeping devices plugged in 24/7 increase carbon footprint?</span>
                  </label>
                  <Select 
                    value={form.quizChargingImpact} 
                    onChange={(v) => setForm({ ...form, quizChargingImpact: v })} 
                    options={["1 (lowest)", "2", "3", "4", "5 (medium)", "6", "7", "8", "9", "10 (highest)"]} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Streaming vs Gaming Impact (1-10)
                    <span className="block text-xs text-gray-500">How much more carbon footprint does cloud gaming have vs Netflix streaming?</span>
                  </label>
                  <Select 
                    value={form.quizStreamingFootprint} 
                    onChange={(v) => setForm({ ...form, quizStreamingFootprint: v })} 
                    options={["1 (lowest)", "2", "3", "4", "5 (medium)", "6", "7", "8", "9", "10 (highest)"]} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Renewable Energy Impact (1-10)
                    <span className="block text-xs text-gray-500">How much can switching to renewable energy reduce your electronic footprint?</span>
                  </label>
                  <Select 
                    value={form.quizRenewableEnergy} 
                    onChange={(v) => setForm({ ...form, quizRenewableEnergy: v })} 
                    options={["1 (lowest)", "2", "3", "4", "5 (medium)", "6", "7", "8", "9", "10 (highest)"]} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    AI Usage Impact (1-10)
                    <span className="block text-xs text-gray-500">How much carbon footprint does generating AI images have vs text conversations?</span>
                  </label>
                  <Select 
                    value={form.quizAIFootprint} 
                    onChange={(v) => setForm({ ...form, quizAIFootprint: v })} 
                    options={["1 (lowest)", "2", "3", "4", "5 (medium)", "6", "7", "8", "9", "10 (highest)"]} 
                  />
                </div>
              </div>

              <hr />

              <h3 className="text-lg font-medium">Sustainability & Awareness</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <Select label="Access to renewable electricity at home" value={form.accessRenewableAtHome} onChange={(v) => setForm({ ...form, accessRenewableAtHome: v })} options={["Yes - fully","Partial / Sometimes","No"]} />
                <Select 
                  label="Your estimate of annual electronic footprint" 
                  value={form.estimatedAnnualKgCO2} 
                  onChange={(v) => setForm({ ...form, estimatedAnnualKgCO2: v })} 
                  options={[
                    "1 - Very Low (0-50 kg CO₂)",
                    "2 - Low (51-150 kg CO₂)", 
                    "3 - Moderate (151-300 kg CO₂)",
                    "4 - High (301-500 kg CO₂)",
                    "5 - Very High (500+ kg CO₂)"
                  ]} 
                />
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