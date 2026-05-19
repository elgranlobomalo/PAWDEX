export type PetType = 'Cat' | 'Dog';

export interface ScheduleItem {
  id: string;
  time: string;
  activity: string;
}

export interface RecordItem {
  id: string;
  name: string;
  date: string;
  size: string;
  iconType: 'pill' | 'activity';
}

export interface PetAttributes {
  energyLevel: string;
  favoriteToy: string;
  allergies: string;
  microchipID: string;
  lastBath: string;
  personality: string;
}

export interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  color?: string;
  dob?: string;
  age: string;
  gender: 'Male' | 'Female' | 'Unknown';
  weight: number[]; // Array for chart
  diet: string;
  notes: string;
  avatarUrl: string;
  colorHex: string;
  schedule: ScheduleItem[];
  attributes: PetAttributes;
  records: RecordItem[];
  photos?: { id: string, url: string, date: string }[];
}

const defaultSchedule = [
  { id: '1', time: '08:00', activity: 'BREAKFAST' },
  { id: '2', time: '12:00', activity: 'BRUSHING' },
  { id: '3', time: '19:00', activity: 'MEDICATION / EXERCISE' }
];

const defaultAttributes = {
  energyLevel: 'MODERATE',
  favoriteToy: 'NONE',
  allergies: 'NONE',
  microchipID: 'PENDING',
  lastBath: 'UNKNOWN',
  personality: 'MIXED'
};

const defaultRecords: RecordItem[] = [
  { id: '1', name: 'VAX.PDF', date: '12/10/24', size: '1.2MB', iconType: 'pill' },
  { id: '2', name: 'RX_EYE.IMG', date: '01/05/25', size: '2.4MB', iconType: 'activity' }
];

export const initialPets: Pet[] = [
  {
    id: 'kuro',
    name: 'Kuro',
    type: 'Cat',
    age: '4.5 years',
    gender: 'Female',
    weight: [3.8, 3.9, 4.0, 4.1, 4.0],
    diet: '1/2 cup dry, 1 can wet',
    notes: 'Likes to hide. Needs grooming.',
    avatarUrl: 'Kuro_Avatar.png', // placeholder
    colorHex: '#3b82f6', // Blue theme
    schedule: [...defaultSchedule],
    attributes: { ...defaultAttributes, energyLevel: 'LOW', favoriteToy: 'CARDBOARD BOX', personality: 'AVOIDANT / SPICY' },
    records: [...defaultRecords],
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', date: '01/10/25' },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', date: '01/15/25' }
    ]
  },
  {
    id: 'blaze',
    name: 'Blaze',
    type: 'Cat',
    age: '3 years',
    gender: 'Male',
    weight: [4.5, 4.6, 4.5, 4.7, 4.8],
    diet: '3/4 cup dry',
    notes: 'Very active. Orange energy.',
    avatarUrl: 'Blaze_Avatar.png', 
    colorHex: '#f97316', // Orange theme
    schedule: [...defaultSchedule],
    attributes: { ...defaultAttributes, energyLevel: 'HIGH', favoriteToy: 'LASER POINTER', personality: 'CHAOTIC GOOD' },
    records: [...defaultRecords],
    photos: [
      { id: 'p3', url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', date: '02/01/25' }
    ]
  },
  {
    id: 'limbu',
    name: 'Limbu',
    type: 'Cat',
    age: '1 year',
    gender: 'Male',
    weight: [2.0, 2.5, 3.0, 3.8, 4.2],
    diet: 'Kitten formulated dry',
    notes: 'Troublemaker. Loves strings.',
    avatarUrl: 'Limbu_Avatar.png',
    colorHex: '#eab308', // Yellow
    schedule: [...defaultSchedule],
    attributes: { ...defaultAttributes, energyLevel: 'VERY HIGH', favoriteToy: 'SHOE LACES', personality: 'MISCHIEVOUS' },
    records: [...defaultRecords]
  },
  {
    id: 'rex',
    name: 'Rex',
    type: 'Dog',
    age: '~2 years',
    gender: 'Male',
    weight: [18.0, 18.5, 19.0, 19.2, 19.5],
    diet: '2 cups dry, chicken topper',
    notes: 'Good boy. Needs 2 walks/day.',
    avatarUrl: 'Rex_Avatar.png',
    colorHex: '#ef4444', // Red
    schedule: [...defaultSchedule, { id: '4', time: '17:00', activity: 'PARK WALK' }],
    attributes: { ...defaultAttributes, energyLevel: 'HIGH', favoriteToy: 'TENNIS BALL', personality: 'LOYAL / GOOFY' },
    records: [...defaultRecords]
  },
  {
    id: 'kazu',
    name: 'Kazu',
    type: 'Dog',
    age: 'Unknown (Adult)',
    gender: 'Female',
    weight: [15.0, 15.2, 15.5, 16.0, 16.1],
    diet: 'Sensitive stomach kibble',
    notes: 'Rescue. Timid but sweet.',
    avatarUrl: 'Kazu_Avatar.png',
    colorHex: '#10b981', // Green
    schedule: [...defaultSchedule],
    attributes: { ...defaultAttributes, energyLevel: 'LOW', favoriteToy: 'STUFFED BEAR', personality: 'TIMID / SWEET', allergies: 'POULTRY' },
    records: [...defaultRecords]
  }
];
