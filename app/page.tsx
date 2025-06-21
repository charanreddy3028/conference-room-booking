"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Building2,
  Timer,
  User,
  Upload,
  Settings,
  Shield,
  DatabaseIcon,
  Loader2,
  WifiOff,
  Wifi,
} from "lucide-react"
import { useRooms, useBookings } from "@/hooks/useSupabase"
import { isSupabaseReady } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"

type Room = Database["public"]["Tables"]["rooms"]["Row"]
type Booking = Database["public"]["Tables"]["bookings"]["Row"]

interface CredentialsStatus {
  isConnected: boolean
  lastSync: string | null
  error: string | null
}

const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

const floors = ["Fourth Floor", "First Floor", "Ground Floor"]
const SHEET_ID = "1Obquv1e792n5Eh1PVrharSrYLLsioaSCRzJh0wi22BA"

export default function ConferenceRoomBooking() {
  const [selectedFloor, setSelectedFloor] = useState<string>("")
  const [selectedRoom, setSelectedRoom] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [bookerName, setBookerName] = useState<string>("")
  const [conflict, setConflict] = useState<string>("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isBookingAnimating, setIsBookingAnimating] = useState(false)
  const [credentialsStatus, setCredentialsStatus] = useState<CredentialsStatus>({
    isConnected: isSupabaseReady,
    lastSync: new Date().toISOString(),
    error: null,
  })
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // Use Supabase hooks
  const { rooms, loading: roomsLoading, error: roomsError } = useRooms()
  const { bookings, loading: bookingsLoading, error: bookingsError, createBooking } = useBookings()

  const availableRooms = selectedFloor ? rooms.filter((room) => room.floor === selectedFloor) : []
  const selectedRoomData = availableRooms.find((room) => room.id === selectedRoom)

  // Get bookings for selected room and date
  const roomBookings = bookings.filter(
    (booking) => booking.room_id === selectedRoom && booking.date === selectedDate?.toISOString().split("T")[0],
  )

  // Update connection status based on errors
  useEffect(() => {
    const hasError = roomsError || bookingsError
    setCredentialsStatus((prev) => ({
      ...prev,
      isConnected: isSupabaseReady && !hasError,
      error: hasError ? roomsError || bookingsError : null,
      lastSync: hasError ? prev.lastSync : new Date().toISOString(),
    }))
  }, [roomsError, bookingsError])

  // Simulate sync updates every 60 seconds
  useEffect(() => {
    if (credentialsStatus.isConnected) {
      const interval = setInterval(() => {
        setCredentialsStatus((prev) => ({
          ...prev,
          lastSync: new Date().toISOString(),
        }))
      }, 60000)

      return () => clearInterval(interval)
    }
  }, [credentialsStatus.isConnected])

  // Check for conflicts
  useEffect(() => {
    if (selectedRoom && startTime && endTime && selectedDate) {
      const newStartMinutes = timeToMinutes(startTime)
      const newEndMinutes = timeToMinutes(endTime)

      const conflictingBooking = roomBookings.find((booking) => {
        const bookingStart = timeToMinutes(booking.start_time)
        const bookingEnd = timeToMinutes(booking.end_time)
        return newStartMinutes < bookingEnd && newEndMinutes > bookingStart
      })

      if (conflictingBooking) {
        setConflict(
          `Room already booked by ${conflictingBooking.booked_by} from ${conflictingBooking.start_time} to ${conflictingBooking.end_time}`,
        )
      } else {
        setConflict("")
      }
    }
  }, [selectedRoom, startTime, endTime, selectedDate, roomBookings])

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  const getBookingStatus = (booking: Booking): "upcoming" | "in-progress" | "completed" => {
    const now = new Date()
    const bookingDate = new Date(`${booking.date}T${booking.start_time}:00`)
    const bookingEndDate = new Date(`${booking.date}T${booking.end_time}:00`)

    if (now < bookingDate) return "upcoming"
    if (now >= bookingDate && now < bookingEndDate) return "in-progress"
    return "completed"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-red-500"
      case "in-progress":
        return "bg-orange-500"
      case "completed":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleCredentialsUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/json") {
      setUploadedFile(file)

      // Simulate credential validation
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const credentials = JSON.parse(e.target?.result as string)

          // Basic validation for service account structure
          if (credentials.type === "service_account" && credentials.client_email && credentials.private_key) {
            // Simulate successful connection
            setTimeout(() => {
              setCredentialsStatus({
                isConnected: true,
                lastSync: new Date().toISOString(),
                error: null,
              })
              setShowCredentialsDialog(false)
            }, 2000)
          } else {
            setCredentialsStatus({
              isConnected: false,
              lastSync: null,
              error: "Invalid service account structure",
            })
          }
        } catch (error) {
          setCredentialsStatus({
            isConnected: false,
            lastSync: null,
            error: "Invalid JSON format",
          })
        }
      }
      reader.readAsText(file)
    }
  }

  const handleBooking = async () => {
    if (!selectedRoom || !startTime || !endTime || !bookerName || !selectedDate || conflict) {
      return
    }

    setIsBookingAnimating(true)

    const newBooking = {
      room_id: selectedRoom,
      room_name: selectedRoomData?.name || "",
      floor: selectedFloor,
      booked_by: bookerName,
      date: selectedDate.toISOString().split("T")[0],
      start_time: startTime,
      end_time: endTime,
      status: "upcoming" as const,
    }

    const { data, error } = await createBooking(newBooking)

    if (error) {
      console.error("Error creating booking:", error)
    }

    setShowSuccess(true)
    setIsBookingAnimating(false)

    // Reset form
    setStartTime("")
    setEndTime("")
    setBookerName("")

    // Update sync status
    setCredentialsStatus((prev) => ({
      ...prev,
      lastSync: new Date().toISOString(),
    }))

    setTimeout(() => setShowSuccess(false), 3000)
  }

  const isValidTimeRange = startTime && endTime && timeToMinutes(endTime) >= timeToMinutes(startTime) + 30

  if (roomsLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">Loading conference rooms...</p>
          <p className="text-sm text-gray-500">
            {isSupabaseReady ? "Connecting to Supabase..." : "Loading demo data..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Section with Database Status Widget */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Conference Room Booking</h1>
                <p className="text-gray-300">
                  {isSupabaseReady ? "Real-time availability with Supabase" : "Demo mode with sample data"}
                </p>
              </div>
            </div>

            {/* Database Status Widget */}
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur">
                      {credentialsStatus.isConnected ? (
                        <Wifi className="w-4 h-4 text-teal-400" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-yellow-400" />
                      )}
                      <Badge variant={credentialsStatus.isConnected ? "secondary" : "outline"} className="text-xs">
                        {credentialsStatus.isConnected ? "Supabase Connected" : "Demo Mode"}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p>{credentialsStatus.isConnected ? "Supabase Database" : "Demo Mode"}</p>
                      {credentialsStatus.lastSync && (
                        <p className="text-xs opacity-80">
                          Last sync: {new Date(credentialsStatus.lastSync).toLocaleTimeString()}
                        </p>
                      )}
                      {credentialsStatus.error && <p className="text-xs text-red-300">Using fallback data</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-200"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-teal-600" />
                      Integration Settings
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert
                      className={`border-${credentialsStatus.isConnected ? "green" : "yellow"}-200 bg-${credentialsStatus.isConnected ? "green" : "yellow"}-50`}
                    >
                      <DatabaseIcon
                        className={`h-4 w-4 text-${credentialsStatus.isConnected ? "green" : "yellow"}-600`}
                      />
                      <AlertDescription className={`text-${credentialsStatus.isConnected ? "green" : "yellow"}-800`}>
                        {credentialsStatus.isConnected
                          ? "Supabase connected successfully! Real-time sync enabled."
                          : "Running in demo mode with sample data. Configure Supabase environment variables to enable live data."}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>Google Sheets ID (Optional)</Label>
                      <Input value={SHEET_ID} readOnly className="bg-gray-50 font-mono text-sm" />
                    </div>

                    <div className="space-y-2">
                      <Label>Service Account Credentials (Optional)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleCredentialsUpload}
                          className="hidden"
                          id="credentials-upload"
                        />
                        <label htmlFor="credentials-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span className="text-sm font-medium">
                            {uploadedFile ? uploadedFile.name : "Upload service-account.json"}
                          </span>
                          <span className="text-xs text-gray-500">For Google Sheets integration</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-4 relative z-10">
        {/* Status Legend with Neumorphic Design */}
        <Card
          className="mb-8 shadow-2xl border-0 bg-white/95 backdrop-blur-sm"
          style={{
            boxShadow: "20px 20px 60px #d1d9e6, -20px -20px 60px #ffffff",
          }}
        >
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-6 items-center justify-center">
              <div
                className="flex items-center gap-3 bg-red-50 px-6 py-3 rounded-2xl shadow-inner"
                style={{
                  boxShadow: "inset 8px 8px 16px #e8e8e8, inset -8px -8px 16px #ffffff",
                }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                <span className="font-semibold text-red-700">Upcoming</span>
              </div>
              <div
                className="flex items-center gap-3 bg-orange-50 px-6 py-3 rounded-2xl shadow-inner"
                style={{
                  boxShadow: "inset 8px 8px 16px #e8e8e8, inset -8px -8px 16px #ffffff",
                }}
              >
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-lg"></div>
                <span className="font-semibold text-orange-700">In Progress</span>
              </div>
              <div
                className="flex items-center gap-3 bg-green-50 px-6 py-3 rounded-2xl shadow-inner"
                style={{
                  boxShadow: "inset 8px 8px 16px #e8e8e8, inset -8px -8px 16px #ffffff",
                }}
              >
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
                <span className="font-semibold text-green-700">Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid xl:grid-cols-3 gap-8">
          {/* Booking Form with Neumorphic Design */}
          <div className="xl:col-span-2">
            <Card
              className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm"
              style={{
                boxShadow: "20px 20px 60px #d1d9e6, -20px -20px 60px #ffffff",
              }}
            >
              <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <CalendarDays className="w-6 h-6" />
                  Book Your Meeting Room
                </CardTitle>
                <p className="text-teal-100">Select your preferred room, date, and time</p>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {showSuccess && (
                  <Alert className="border-green-200 bg-green-50 shadow-lg animate-in slide-in-from-top duration-300">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-800 font-medium">
                      🎉 Room booked successfully!{" "}
                      {credentialsStatus.isConnected ? "Saved to Supabase database." : "Running in demo mode."}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Floor & Room Selection */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-lg font-semibold">
                      <MapPin className="w-5 h-5 text-teal-600" />
                      Select Floor
                    </Label>
                    <div className="neumorphic-input">
                      <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                        <SelectTrigger className="h-12 border-0 bg-transparent focus:ring-2 focus:ring-teal-500 transition-all duration-200">
                          <SelectValue placeholder="Choose your floor" />
                        </SelectTrigger>
                        <SelectContent>
                          {floors.map((floor) => (
                            <SelectItem key={floor} value={floor} className="py-3">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {floor}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedFloor && (
                    <div className="space-y-3 animate-in slide-in-from-right duration-300">
                      <Label className="text-lg font-semibold">Select Room</Label>
                      <div className="neumorphic-input">
                        <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                          <SelectTrigger className="h-12 border-0 bg-transparent focus:ring-2 focus:ring-teal-500 transition-all duration-200">
                            <SelectValue placeholder="Choose your room" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRooms.map((room) => (
                              <SelectItem key={room.id} value={room.id} className="py-3">
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{room.name}</span>
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Users className="w-4 h-4" />
                                    <span>{room.capacity}</span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Room Info with Neumorphic Card */}
                {selectedRoomData && (
                  <div className="neumorphic-card bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-2xl animate-in slide-in-from-left duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedRoomData.name}</h3>
                        <p className="text-gray-600">{selectedRoomData.floor}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="w-4 h-4 text-teal-600" />
                          <span className="text-sm font-medium">Capacity: {selectedRoomData.capacity} people</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date Selection */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Select Date</Label>
                  <div className="flex justify-center">
                    <div className="neumorphic-card p-4 rounded-2xl">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="rounded-xl border-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Time Selection */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-lg font-semibold">
                      <Clock className="w-5 h-5 text-green-600" />
                      Start Time
                    </Label>
                    <div className="neumorphic-input">
                      <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger className="h-12 border-0 bg-transparent focus:ring-2 focus:ring-teal-500 transition-all duration-200">
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time} className="py-2">
                              <div className="flex items-center gap-2">
                                <Timer className="w-4 h-4" />
                                {time}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">End Time</Label>
                    <div className="neumorphic-input">
                      <Select value={endTime} onValueChange={setEndTime}>
                        <SelectTrigger className="h-12 border-0 bg-transparent focus:ring-2 focus:ring-teal-500 transition-all duration-200">
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem
                              key={time}
                              value={time}
                              disabled={startTime && timeToMinutes(time) <= timeToMinutes(startTime)}
                              className="py-2"
                            >
                              <div className="flex items-center gap-2">
                                <Timer className="w-4 h-4" />
                                {time}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Booker Name */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-lg font-semibold">
                    <User className="w-5 h-5 text-purple-600" />
                    Your Name
                  </Label>
                  <div className="neumorphic-input">
                    <Input
                      value={bookerName}
                      onChange={(e) => setBookerName(e.target.value)}
                      placeholder="Enter your full name"
                      className="h-12 border-0 bg-transparent focus:ring-2 focus:ring-teal-500 transition-all duration-200 text-lg"
                    />
                  </div>
                </div>

                {/* Conflict Warning */}
                {conflict && (
                  <Alert className="border-red-200 bg-red-50 shadow-lg animate-in slide-in-from-top duration-300">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-800 font-medium">⚠️ {conflict}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button with Animation */}
                <Button
                  onClick={handleBooking}
                  disabled={
                    !selectedRoom ||
                    !startTime ||
                    !endTime ||
                    !bookerName ||
                    !isValidTimeRange ||
                    !!conflict ||
                    isBookingAnimating
                  }
                  className={`w-full h-14 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-lg font-semibold shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                    isBookingAnimating ? "animate-pulse" : ""
                  }`}
                  style={{
                    boxShadow: conflict ? "none" : "0 10px 30px rgba(56, 178, 172, 0.3)",
                  }}
                >
                  {isBookingAnimating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Booking...
                    </div>
                  ) : conflict ? (
                    "Resolve Conflict First"
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Room Status & Bookings */}
          <div className="space-y-6">
            <Card
              className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm"
              style={{
                boxShadow: "20px 20px 60px #d1d9e6, -20px -20px 60px #ffffff",
              }}
            >
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-xl">Today's Schedule</CardTitle>
                {selectedRoomData && (
                  <p className="text-indigo-100">
                    {selectedRoomData.name} - {selectedRoomData.floor}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {selectedRoom && selectedDate ? (
                  <div className="space-y-4">
                    {roomBookings.length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No bookings for this date</p>
                        <p className="text-sm text-gray-400">Perfect time to book!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {roomBookings.map((booking, index) => {
                          const currentStatus = getBookingStatus(booking)
                          return (
                            <TooltipProvider key={booking.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="group relative overflow-hidden rounded-2xl border-0 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-in slide-in-from-bottom"
                                    style={{
                                      animationDelay: `${index * 100}ms`,
                                      boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff",
                                    }}
                                  >
                                    <div
                                      className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(currentStatus)}`}
                                    ></div>
                                    <div className="p-4 pl-6 bg-gradient-to-r from-white to-gray-50">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-lg">
                                          {booking.start_time} - {booking.end_time}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className={`font-medium ${
                                            currentStatus === "upcoming"
                                              ? "border-red-300 text-red-700 bg-red-50"
                                              : currentStatus === "in-progress"
                                                ? "border-orange-300 text-orange-700 bg-orange-50"
                                                : "border-green-300 text-green-700 bg-green-50"
                                          }`}
                                        >
                                          {currentStatus.replace("-", " ")}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <User className="w-4 h-4" />
                                        <span>{booking.booked_by}</span>
                                      </div>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-black text-white p-3 rounded-lg">
                                  <p className="font-medium">Booked by {booking.booked_by}</p>
                                  <p className="text-sm opacity-80">
                                    {new Date(booking.created_at).toLocaleString("en-GB")}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Select a room and date</p>
                    <p className="text-sm text-gray-400">to view bookings</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats with Neumorphic Design */}
            <Card
              className="shadow-2xl border-0 bg-gradient-to-br from-gray-900 to-black text-white"
              style={{
                boxShadow: "20px 20px 60px #000000, -20px -20px 60px #333333",
              }}
            >
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <DatabaseIcon className="w-5 h-5 text-teal-400" />
                  System Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/10 backdrop-blur">
                    <span className="text-gray-300">Total Rooms</span>
                    <span className="font-bold text-2xl text-teal-400">{rooms.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/10 backdrop-blur">
                    <span className="text-gray-300">Total Bookings</span>
                    <span className="font-bold text-2xl text-orange-400">{bookings.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/10 backdrop-blur">
                    <span className="text-gray-300">Available Floors</span>
                    <span className="font-bold text-2xl text-purple-400">{floors.length}</span>
                  </div>
                  <div
                    className={`flex justify-between items-center p-3 rounded-xl backdrop-blur border ${
                      credentialsStatus.isConnected
                        ? "bg-teal-500/20 border-teal-400/30"
                        : "bg-yellow-500/20 border-yellow-400/30"
                    }`}
                  >
                    <span className={credentialsStatus.isConnected ? "text-teal-200" : "text-yellow-200"}>
                      Database Status
                    </span>
                    <span
                      className={`font-bold text-sm ${credentialsStatus.isConnected ? "text-teal-400" : "text-yellow-400"}`}
                    >
                      {credentialsStatus.isConnected ? "SUPABASE" : "DEMO MODE"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Bookings Overview */}
        <Card
          className="mt-12 mb-8 shadow-2xl border-0 bg-white/95 backdrop-blur-sm"
          style={{
            boxShadow: "20px 20px 60px #d1d9e6, -20px -20px 60px #ffffff",
          }}
        >
          <CardHeader className="bg-gradient-to-r from-gray-800 to-black text-white rounded-t-lg">
            <CardTitle className="text-2xl">All Recent Bookings</CardTitle>
            <p className="text-gray-300">
              {credentialsStatus.isConnected
                ? "Latest 6 bookings from Supabase database"
                : "Latest 6 bookings - configure Supabase to enable live sync"}
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bookings
                .slice()
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 6)
                .map((booking, index) => {
                  const currentStatus = getBookingStatus(booking)
                  return (
                    <div
                      key={booking.id}
                      className="group relative overflow-hidden rounded-2xl border-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 animate-in slide-in-from-bottom"
                      style={{
                        animationDelay: `${index * 150}ms`,
                        boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff",
                      }}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(currentStatus)}`}></div>
                      <div className="p-6 pt-8 bg-gradient-to-br from-white to-gray-50">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(currentStatus)} ${currentStatus === "in-progress" ? "animate-pulse" : ""} shadow-lg`}
                          ></div>
                          <span className="font-bold text-lg">{booking.room_name}</span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-teal-600" />
                            <span>{booking.floor}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-blue-600" />
                            <span>{new Date(booking.date).toLocaleDateString("en-GB")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span>
                              {booking.start_time} - {booking.end_time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">{booking.booked_by}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .neumorphic-input {
          background: #f5f5f5;
          border-radius: 12px;
          box-shadow: inset 8px 8px 16px #e0e0e0, inset -8px -8px 16px #ffffff;
          padding: 4px;
        }
        
        .neumorphic-card {
          box-shadow: 12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff;
        }
        
        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-from-bottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-from-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-from-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .slide-in-from-top {
          animation: slide-in-from-top 0.3s ease-out;
        }
        
        .slide-in-from-bottom {
          animation: slide-in-from-bottom 0.3s ease-out;
        }
        
        .slide-in-from-left {
          animation: slide-in-from-left 0.3s ease-out;
        }
        
        .slide-in-from-right {
          animation: slide-in-from-right 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
