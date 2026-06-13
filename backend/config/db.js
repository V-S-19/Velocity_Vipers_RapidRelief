const mongoose = require('mongoose');
const Alert = require('../models/Alert');

const seedAlerts = async () => {
  try {
    const count = await Alert.countDocuments();
    if (count === 0) {
      console.log('[DATABASE] Seeding database with initial emergency reports...');
      const initialAlerts = [
        {
          category: 'fire',
          severity: 'critical',
          location: 'Warehouse District, Lane 5',
          latitude: 37.7833,
          longitude: -122.4167,
          description: 'Active structure fire reported at the central shipping warehouse. Heavy smoke visible. Multiple fire engines en route.',
          imageUrl: 'https://images.unsplash.com/photo-1542397284385-601017642477?auto=format&fit=crop&w=600&q=80',
          resolved: false,
          reporter: 'fire_marshall@city.gov'
        },
        {
          category: 'flood',
          severity: 'high',
          location: 'Lower Riverbed Parkway',
          latitude: 37.7650,
          longitude: -122.4300,
          description: 'Flash flooding has overflowed the main storm drains. Water depth approx 1.5 feet on roadway. Avoid driving through.',
          imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
          resolved: false,
          reporter: 'citizen_observer99'
        },
        {
          category: 'medical',
          severity: 'medium',
          location: 'Metro Station Entrance, Sector B',
          latitude: 37.7795,
          longitude: -122.4110,
          description: 'Elderly citizen collapsed due to heat exhaustion. Paramedics dispatched and on scene performing triage.',
          resolved: true,
          reporter: 'metro_staff_4'
        },
        {
          category: 'accident',
          severity: 'high',
          location: 'Highway 101 Northbound, Exit 433',
          latitude: 37.7500,
          longitude: -122.4000,
          description: 'Multi-vehicle collision blocking two right lanes. Expect major traffic backlogs. Tow services requested.',
          imageUrl: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?auto=format&fit=crop&w=600&q=80',
          resolved: false,
          reporter: 'hwy_patrol_officer'
        }
      ];
      await Alert.create(initialAlerts);
      console.log('[DATABASE] Seed complete! Mock alerts added successfully.');
    }
  } catch (err) {
    console.error('[DATABASE SEED ERROR] Failed to seed alerts: ', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host}`);
    await seedAlerts();
  } catch (error) {
    console.error(`[DATABASE ERROR] connection failed: ${error.message}`);
    console.warn('[DATABASE WARNING] Server starting in offline mode. Please configure MONGODB_URI in .env.');
  }
};

module.exports = connectDB;
