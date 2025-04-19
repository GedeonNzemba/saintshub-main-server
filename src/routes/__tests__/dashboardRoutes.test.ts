// src/routes/__tests__/dashboardRoutes.test.ts
import request from 'supertest';
import { app } from '../../app.js';
import mongoose from 'mongoose';
import { ChurchModel } from '../../models/Space.js'; // Adjust path if needed
import jwt from 'jsonwebtoken'; // Import jwt

// Load environment variables for database connection, JWT secret etc.
// You might need a .env.test file or similar setup
// import dotenv from 'dotenv';
// dotenv.config({ path: '.env.test' }); // Example

const MONGODB_URI = process.env['MONGODB_URI_TEST'] || 'mongodb://localhost:27017/new-backend-test'; // Use a separate test DB

// --- Test JWT Setup ---
// IMPORTANT: Use the same secret as your actual app's JWT_SECRET (ideally from process.env)
const TEST_JWT_SECRET = 'test-secret-key-please-change'; // Dummy secret for tests
const TEST_USER_ID = new mongoose.Types.ObjectId().toString(); // Generate a realistic test user ID
const testToken = jwt.sign({ id: TEST_USER_ID }, TEST_JWT_SECRET, { expiresIn: '1h' }); // Generate token

// --- Test Setup & Teardown ---
beforeAll(async () => {
  // Connect to a separate test database
  await mongoose.connect(MONGODB_URI);
});

afterEach(async () => {
  // Clear the Church collection after each test
  // Ensure the model is correctly registered before calling deleteMany
  if (mongoose.models['Church']) {
      await mongoose.models['Church'].deleteMany({});
  } else {
      // If the model isn't registered directly via import, try getting it
      try {
          const Church = mongoose.model('Church');
          await Church.deleteMany({});
      } catch (e) {
          console.error("Could not get Church model to clear collection", e);
      }
  }
});

afterAll(async () => {
  // Disconnect from the database
  await mongoose.disconnect();
  // Optional: Close the server if supertest doesn't handle it automatically
  // await new Promise<void>(resolve => app.close(resolve)); // Depends on how server is exported/managed
});

// --- Test Suite ---
describe('Dashboard Routes - /api/v1/dashboard', () => { // Assuming routes are prefixed with /api/v1/dashboard

  // --- POST /churches ---
  describe('POST /churches', () => {
    // TODO: Define valid and invalid church data payloads based on createChurchSchema
    const validChurchPayload = {
      name: "Test Church",
      location: "Test Location", // Make sure all required fields are here
      denomination: "Test Denomination",
      establishedDate: new Date(),
      website: "http://testchurch.com",
      contact: { email: "test@testchurch.com", phone: "123-456-7890" },
      services: [{ day: "Sunday", time: "10:00 AM", type: "Worship" }],
      socialMedia: { facebook: "fb.com/test", twitter: "twitter.com/test" },
      ministries: ["Youth", "Music"],
      events: [{ name: "Test Event", date: new Date(), description: "A test event" }],
      announcements: [{ title: "Test Announcement", body: "Details here", date: new Date() }],
      sermons: [{ title: "Test Sermon", speaker: "Test Speaker", date: new Date(), audioUrl: "http://example.com/audio.mp3", videoUrl: "http://example.com/video.mp4" }],
      leaders: [{ name: "Test Leader", role: "Pastor", bio: "Bio here" }],
      gallery: [{ imageUrl: "http://example.com/image.jpg", caption: "Test Image" }],
      donations: { link: "http://example.com/donate", info: "Info here" },
      prayerRequests: { enabled: true, contact: "prayer@testchurch.com" },
      livestream: { link: "http://example.com/live", schedule: "Sundays 10 AM" },
      mapEmbed: "<iframe src='...'></iframe>",
      additionalSections: [{ title: "Custom Section", content: "Details..." }],
      songs: [{ title: "Test Song", songUrl: "http://example.com/song.mp3" }],
      // Add any other required fields from your schema
    };

    const invalidChurchPayload = { // Missing required fields like 'location'
        name: "Incomplete Church",
        denomination: "Test Denomination",
        // establishedDate: new Date(), // Example missing required field
        website: "http://testchurch.com",
        contact: { email: "test@testchurch.com", phone: "123-456-7890" },
        // ... other fields can be present or absent
    };


    it('should return 401 Unauthorized if no token is provided', async () => {
        const res = await request(app) // Keep eye on potential 'unsafe argument' lint error
            .post('/api/v1/dashboard/churches') 
            .send(validChurchPayload);
        expect(res.statusCode).toEqual(401); // Or 403 depending on auth middleware
         // Maybe check for a specific error message if your middleware provides one
        // expect(res.body.message).toContain('Authentication required');
    });

    // --- Tests requiring authentication ---
    it('should return 400 Bad Request if required fields are missing', async () => { // Test for validation
        const res = await request(app)
            .post('/api/v1/dashboard/churches')
            .set('Authorization', `Bearer ${testToken}`) // Add token
            .send(invalidChurchPayload); // Send invalid data

        expect(res.statusCode).toEqual(400);
        // Optionally, check the error message structure if your validation middleware provides it
        // expect(res.body.errors).toBeDefined();
        // expect(res.body.errors[0].path).toContain('location'); // Example check
    });

    it('should create a church successfully with valid data and token', async () => { // Test for success
        const res = await request(app)
            .post('/api/v1/dashboard/churches')
            .set('Authorization', `Bearer ${testToken}`) // Add token
            .send(validChurchPayload); // Send valid data

        expect(res.statusCode).toEqual(201);
        expect(res.body).toBeDefined();

        // Add type assertion for res.body
        const responseBody = res.body as { _id: string; name: string; /* add other expected fields if needed */ };

        expect(responseBody.name).toEqual(validChurchPayload.name); // Use typed body
        expect(responseBody._id).toBeDefined(); // Use typed body

        // Optional: Verify the church was actually saved in the test database
        const savedChurch = await ChurchModel.findById(responseBody._id); // Use ID from typed body
        expect(savedChurch).not.toBeNull();
        // Use optional chaining for safety, even though we expect it not to be null
        expect(savedChurch?.name).toEqual(validChurchPayload.name); // Use optional chaining
    });

  }); // End POST /churches describe

  // --- Add tests for other dashboard routes (GET, PUT, DELETE /churches/:id, etc.) ---
}); // End describe block
