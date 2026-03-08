/* ─── Types ─────────────────────────────────────────────────────────── */

export interface Rig {
    id: number;
    name: string;
    status: "available" | "booked";
    specs: string;
}

export interface Venue {
    id: number;
    name: string;
    location: string;
    price: number;
    availableRigs: number;
    totalRigs: number;
    description: string;
    rigs: Rig[];
}

/* ─── Constants ─────────────────────────────────────────────────────── */

export const TIME_SLOTS = [
    "10:00 AM – 11:00 AM",
    "11:00 AM – 12:00 PM",
    "12:00 PM – 1:00 PM",
    "1:00 PM – 2:00 PM",
    "2:00 PM – 3:00 PM",
    "3:00 PM – 4:00 PM",
    "4:00 PM – 5:00 PM",
    "5:00 PM – 6:00 PM",
    "6:00 PM – 7:00 PM",
    "7:00 PM – 8:00 PM",
    "8:00 PM – 9:00 PM",
    "9:00 PM – 10:00 PM",
];

export const VENUES: Venue[] = [
    {
        id: 1,
        name: "Apex Racing Lounge",
        location: "HSR Layout",
        price: 500,
        availableRigs: 3,
        totalRigs: 8,
        description:
            "Premium sim racing experience with Fanatec DD setups and triple-screen immersion.",
        rigs: [
            { id: 1, name: "Rig 1", status: "available", specs: 'Fanatec DD Pro · Triple 27"' },
            { id: 2, name: "Rig 2", status: "booked", specs: 'Fanatec DD Pro · Triple 27"' },
            { id: 3, name: "Rig 3", status: "available", specs: 'Fanatec CSL DD · Ultrawide 34"' },
            { id: 4, name: "Rig 4", status: "available", specs: 'Fanatec CSL DD · Ultrawide 34"' },
            { id: 5, name: "Rig 5", status: "booked", specs: 'Logitech G Pro · Single 32"' },
            { id: 6, name: "Rig 6", status: "booked", specs: 'Logitech G Pro · Single 32"' },
            { id: 7, name: "Rig 7", status: "available", specs: "Thrustmaster T300 · VR Headset" },
            { id: 8, name: "Rig 8", status: "booked", specs: "Thrustmaster T300 · VR Headset" },
        ],
    },
    {
        id: 2,
        name: "Clutch Gaming Arena",
        location: "Koramangala",
        price: 600,
        availableRigs: 5,
        totalRigs: 6,
        description:
            "High-end gaming café with professional-grade sim rigs and VR setups.",
        rigs: [
            { id: 1, name: "Rig 1", status: "available", specs: 'Fanatec DD1 · Triple 32"' },
            { id: 2, name: "Rig 2", status: "available", specs: 'Fanatec DD1 · Triple 32"' },
            { id: 3, name: "Rig 3", status: "available", specs: 'Fanatec CSL DD · Ultrawide 34"' },
            { id: 4, name: "Rig 4", status: "booked", specs: 'Logitech G923 · Single 27"' },
            { id: 5, name: "Rig 5", status: "available", specs: 'Logitech G923 · Single 27"' },
            { id: 6, name: "Rig 6", status: "available", specs: "Thrustmaster T-GT II · VR" },
        ],
    },
    {
        id: 3,
        name: "Pole Position Hub",
        location: "Indiranagar",
        price: 450,
        availableRigs: 2,
        totalRigs: 6,
        description:
            "Neighbourhood sim racing spot with solid mid-range setups and AC gaming.",
        rigs: [
            { id: 1, name: "Rig 1", status: "available", specs: 'Logitech G Pro · Triple 24"' },
            { id: 2, name: "Rig 2", status: "booked", specs: 'Logitech G Pro · Triple 24"' },
            { id: 3, name: "Rig 3", status: "booked", specs: 'Logitech G923 · Single 27"' },
            { id: 4, name: "Rig 4", status: "booked", specs: 'Logitech G923 · Single 27"' },
            { id: 5, name: "Rig 5", status: "available", specs: "Thrustmaster T300 · Ultrawide" },
            { id: 6, name: "Rig 6", status: "booked", specs: "Thrustmaster T300 · Ultrawide" },
        ],
    },
    {
        id: 4,
        name: "DRS Zone Lounge",
        location: "Whitefield",
        price: 550,
        availableRigs: 4,
        totalRigs: 7,
        description:
            "Modern racing lounge with motion rigs and competitive league nights.",
        rigs: [
            { id: 1, name: "Rig 1", status: "available", specs: "Fanatec DD Pro · Motion Rig" },
            { id: 2, name: "Rig 2", status: "available", specs: "Fanatec DD Pro · Motion Rig" },
            { id: 3, name: "Rig 3", status: "booked", specs: 'Fanatec CSL DD · Triple 27"' },
            { id: 4, name: "Rig 4", status: "available", specs: 'Fanatec CSL DD · Triple 27"' },
            { id: 5, name: "Rig 5", status: "booked", specs: 'Logitech G Pro · Single 32"' },
            { id: 6, name: "Rig 6", status: "available", specs: 'Logitech G Pro · Single 32"' },
            { id: 7, name: "Rig 7", status: "booked", specs: "Thrustmaster T818 · VR Headset" },
        ],
    },
];
